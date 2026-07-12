# MOverlay

<identity>
Vuetify: `VOverlay` · Target: `MOverlay` · Phase: 1 · Type: public primitive + internal runtime foundation
</identity>

<problem>
Сейчас `MDialog`, modal `MSheet` и `MMenu` решают одну инфраструктурную задачу разными путями: teleport, scrim, порядок слоёв, dismiss по Escape/outside, блокировку прокрутки и возврат фокуса. Из-за этого вложенные поверхности могут конкурировать за z-index и события закрытия, а исправление поведения приходится повторять в нескольких компонентах.

Пользователю также нужны два равноправных сценария: декларативный dialog в template и программный dialog через `$modals`, когда одноразовый confirm/alert/form не должен засорять разметку. Эти сценарии не должны порождать две overlay-системы с разным UX.
</problem>

<user-jobs>
- Показать произвольную временную поверхность поверх приложения и полностью контролировать её состояние через `v-model`.
- Получить одинаковые stack, focus, dismiss и scroll-lock semantics в dialog, sheet и menu.
- Открывать dialog декларативно или программно без отличий в M3-поведении.
- Безопасно вкладывать menu/dialog/sheet друг в друга: Escape закрывает только верхний допустимый слой, фокус возвращается к правильному activator.
</user-jobs>

<solution>
`MOverlay` становится единственным controlled primitive для жизненного цикла временной поверхности. Он владеет инфраструктурой, но не внешним видом содержимого: dialog, sheet и menu остаются самостоятельными public-компонентами и задают семантику, геометрию, motion и клавиатурную модель.

Программный `$modals` не создаёт второй overlay engine. Он монтирует тот же `MDialog`, `MSheet` или пользовательский modal-компонент, который внутри проходит через `MOverlay`.
</solution>

<public-api>
```ts
interface MOverlayProps {
  modelValue: boolean
  mode?: 'modal' | 'popover'
  persistent?: boolean
  scrim?: boolean
  closeOnOutside?: boolean
  closeOnEscape?: boolean
  teleportTo?: string | HTMLElement
}

interface MOverlayEmits {
  (event: 'update:modelValue', value: boolean): void
  (event: 'click:outside', nativeEvent: PointerEvent): void
  (event: 'dismiss', reason: 'outside' | 'escape'): void
  (event: 'after:enter'): void
  (event: 'after:leave'): void
}
```

Defaults:

- `mode: 'modal'`;
- `persistent: false`;
- `scrim: mode === 'modal'`;
- `closeOnOutside: true`;
- `closeOnEscape: true`.

`persistent` запрещает пользовательский dismiss по outside и Escape, но не блокирует программное изменение `v-model`. Это позволяет завершить сохранение или закрыть поверхность после успешной операции.

Не давать public `zIndex` и `contained` на первом этапе: произвольный z-index разрушает общий stack, а contained overlay требует отдельного доказанного сценария и иной стратегии scroll/focus boundaries.
</public-api>

<slots>
- `activator`: получает `{ open, close, toggle, isOpen, props }`; `props` содержит ARIA и обработчики, которые можно применить через `v-bind`.
- `default`: получает `{ close, isTop, overlayId }`; здесь consumer размещает dialog/menu/sheet surface.
- `scrim`: позволяет изменить содержимое/визуал scrim, сохраняя его events и stack semantics. Полная замена корневого overlay DOM не предоставляется.
</slots>

<flows>
Declarative:

```vue
<MDialog v-model="isOpen">
  ...
</MDialog>
```

Programmatic:

```ts
const { status, value } = await $modals.open(EditProfileDialog, {
  props: { profile },
})

if (status === 'confirmed')
  save(value)
```

Оба потока сходятся в одну цепочку:

`MDialog/MSheet/custom modal → MOverlay → shared stack/focus/scrim/teleport runtime`.
</flows>

<composition>
- `MDialog` фиксирует `mode="modal"`, добавляет `role="dialog"`, focus trap, размеры и dialog motion.
- Modal `MSheet` фиксирует `mode="modal"`, добавляет bottom-sheet geometry, drag handle и swipe/drag rules.
- `MMenu` фиксирует `mode="popover"`, отключает scrim по умолчанию и добавляет anchor positioning и menu keyboard navigation.
- Общие props создаются shared prop factory/composable, чтобы названия и defaults не расходились.
- `MOverlay` использует существующие `useStack`/modal context после их консолидации; не создаёт новый Pinia store.
</composition>

<reuse>
Переиспользовать существующие modal hierarchy, transition conventions и `vue-final-modal` как временный внутренний mounting adapter. `MDialog`, `MSheet` и `MMenu` мигрируют на primitive постепенно без обязательного breaking change public API. Не создавать параллельные реализации z-index, focus restore, outside detection или scroll lock.
</reuse>

<runtime>
- Stack ведётся на уровне Nuxt app через `useState` либо plugin-local reactive singleton с SSR-safe request scope; новый Pinia store не нужен.
- Каждый overlay регистрирует id, parent id, type и activation order. Только верхний eligible overlay обрабатывает Escape/outside.
- Scroll lock reference-counted: закрытие дочернего modal не разблокирует страницу, пока открыт родительский.
- Activator сохраняется перед открытием; после полного leave фокус возвращается в activator либо в ближайший живой parent overlay.
- Teleport target по умолчанию — общий overlay host. Если `MApp` отсутствует, Nuxt plugin/layer root обязан предоставить host или безопасный body fallback после hydration.
- Все browser listeners подключаются через VueUse либо обязательно снимаются при unmount.
</runtime>

<m3-ux>
- Scrim использует M3 scrim role и токены opacity, а не локальный hardcode.
- Motion различается у consumer-компонентов: overlay управляет lifecycle, но не навязывает dialog motion меню или sheet.
- При `prefers-reduced-motion` переход сокращается без изменения порядка lifecycle events.
- Modal mode изолирует фон от keyboard/pointer interaction; popover mode сохраняет доступность окружающего контекста.
- Нельзя закрыть два вложенных слоя одним Escape или одним pointer event.
</m3-ux>

<styles>
Создать co-located `components/overlay/_index.scss` с nested `$tokens` map минимум для `scrim.color`, `scrim.opacity` и базовых lifecycle значений. SFC получает значения только через `material-map()` и `g()` согласно `common.md`. Все размеры следуют правилу kit `1rem = 1px макета`; runtime CSS variables для component states не вводятся.
</styles>

<migration>
1. Выделить shared stack, dismiss, scroll-lock и focus runtime с тестами.
2. Реализовать `MOverlay` поверх runtime.
3. Перевести `MDialog`, затем modal `MSheet`, затем `MMenu`, сохраняя их текущий API через deprecated aliases при необходимости.
4. Подключить `$modals` к тому же runtime по плану `components-should-update/modals.md`.
5. После миграции удалить дублирующиеся overlay paths и оценить, нужен ли ещё `vue-final-modal` как adapter.

Текущие `clickToClose`/`escToClose` в consumers мигрируют к `closeOnOutside`/`closeOnEscape`; старые имена можно временно поддержать с dev warning.
</migration>

<tests>
- controlled open/close и lifecycle emits;
- activator ARIA и focus restore;
- nested modal + menu stack ordering;
- Escape/outside закрывают только верхний eligible overlay;
- `persistent` блокирует user dismiss, но не программное закрытие;
- reference-counted scroll lock;
- unmount открытого overlay очищает listeners и stack;
- SSR render, hydration и teleport fallback;
- reduced motion;
- один и тот же dialog проходит одинаковые behavioral tests declarative и programmatic способом.
</tests>

<non-goals>
- `MOverlay` не является готовым dialog, menu или bottom sheet.
- Он не задаёт padding, shape, content layout и business actions.
- `$modals` не является частью самого Vue-компонента `MOverlay`; это facade над программным mounting и modal lifecycle.
</non-goals>

<done>
`MDialog`, `MSheet`, `MMenu` и программные modals используют один runtime; вложенные слои предсказуемо работают с focus, Escape, outside, scroll lock и SSR, а public consumers не зависят от `vue-final-modal`.
</done>

<questions></questions>
