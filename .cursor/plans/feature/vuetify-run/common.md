# Vuetify-run: общий контракт планов

<purpose>
Цель — закрывать дельту возможностей Vuetify без копирования его API. Новый
контракт всегда PrimeTime-first: компактные typed props, `defineModel`,
предсказуемые slots и Material 3 UX.
</purpose>

<m3-like-doctrine>
PrimeTime UI — M3-like kit, а не набор нейтральных Vue-виджетов и не копия
Vuetify. Каждый новый visual-компонент обязан выражать Material 3:

- semantic roles (`primary`, `surface`, `on-surface`, `error`), elevation,
  shape, typography, motion и state layers берутся из системы токенов;
- варианты отражают M3 surface/action taxonomy, а не произвольные CSS-темы;
- layout следует M3 compact/medium/expanded поведению на существующих
  breakpoints и design-scale `rem`;
- accessibility — часть внешнего вида и UX: visible focus, корректные
  contrast/state layers, native semantics прежде искусственных role;
- нельзя переносить Vuetify API или визуальный язык, если это конфликтует с
  M3, текущими tokens или более ясным PrimeTime DX.
</m3-like-doctrine>

<delta-rule>
Статус сверяется по фактической возможности, а не по имени файла. Роль,
которая уже реализована props, slots или private leaf-компонентом, считается
существующей и описывается в `components-should-update/` вместе с семьёй.
Отдельный `.md` в корне создаётся только для реально отсутствующей роли.
</delta-rule>

<public-sub-rule>
`public` живёт в `app/components/ui/<name>/index.vue`, получает `M*` имя и
может auto-importиться потребителем. `sub` живёт у родителя, импортируется
родителем явно и не получает отдельный публичный API. Каждый `sub` всё равно
имеет собственный план: его API — контекст родителя, props и emits, нужные
только для композиции.
</public-sub-rule>

<scss-map-declaration>
Для каждого visual-компонента обязателен co-located token file
`app/assets/stylesheet/components/<name>/_index.scss` (для leaf — вложенный
путь). Он экспортирует единственную вложенную `$tokens` map. В `.vue`:

```scss
@use '~/assets/stylesheet/components/<name>/index' as t;

.ui-example {
  $t: material-map(t.$tokens, 'md-example');

  padding: g($t, 'container-padding');
}
```

- В SFC нет локальных Sass maps, literal colours, размеров или state tokens.
- Вложенность map повторяет путь `g($t, 'container-padding')`.
- Все initial/hover/focused/pressed/disabled состояния определены в `$tokens`.
  State layers используют `color-mix` с интерполяцией Sass-значений.
- Native CSS functions интерполируют Sass: `color-mix(in srgb, #{$color} 8%, transparent)`.
- Размеры остаются в design-scale `rem`: adaptive root stylesheet сохраняет
  1rem = 1px на базовой макетной ширине и масштабирует систему по breakpoints.
- Новый `_index.scss` подключается из SFC через `@use`; глобальные component
  partials в `main.scss` не добавляются.
</scss-map-declaration>

<runtime-rule>
Состояние групп и leaf-компонентов строится на `createContext`,
`createSingle`, `createGroup` и composables. Новый Pinia store запрещён без
отдельного решения. Внутри библиотеки UI-компоненты импортируются явно.
</runtime-rule>

<reuse-rule>
Перед созданием любого UI, context, observer, selection registry или overlay
план обязан проверить готовые primitives. Предпочтительный порядок:

1. Скомпоновать существующие public M-компоненты и их slots.
2. Переиспользовать существующий composable/context/registry.
3. Выделить private sub-компонент рядом с родителем.
4. Только затем писать новую основу.

Повторная реализация `MTextField`, `MMenu`, `MOverlay`, `useDrag`,
`useTimer`, `useEventListener`, date utilities или selection registry
запрещена. План обязан иметь `<reuse>` с перечислением применяемых частей и
явно объяснять каждый новый primitive.
</reuse-rule>

<a11y-ssr-rule>
План обязан описывать role/aria wiring, roving focus или native keyboard
семантику, focus return для overlay, disabled/read-only/loading/empty/error
states, а также SSR-safe initial render. `onMounted` не используется для
начальной загрузки данных; слушатели и таймеры имеют cleanup.
</a11y-ssr-rule>

<document-template>
Каждый компонентный файл содержит все блоки:

```md
<identity>Vuetify reference · PrimeTime target · phase · public/sub/composable/directive</identity>
<problem>Какую пользовательскую задачу закрывает.</problem>
<solution>Границы ответственности и non-goals.</solution>
<api>Approximate Props · v-model · Emits · Slots · expose.</api>
<composition>Родитель, sub-компоненты, context/composables.</composition>
<reuse>Готовые M-компоненты, composables, contexts и utilities; что нельзя дублировать.</reuse>
<styles>Требования из scss-map-declaration.</styles>
<ux>Keyboard, focus, responsive и accessibility.</ux>
<dx>Пример использования, types и diagnostics.</dx>
<tests>Unit, interaction, a11y, SSR и docs playground.</tests>
<done>Проверяемые критерии готовности.</done>
<questions>Только неразрешённые решения владельца.</questions>
```
</document-template>

<final-file-restructure>
Перед завершением инициативы обязательно реформатировать каталог: plain plans остаются плоскими, family plans используют `<parent>/index.md` и `<parent>/<child>.md`. До окончания последовательного обсуждения допускается временная плоская структура. После move обновить и проверить все ссылки; автономный режим не пропускает этот шаг.
</final-file-restructure>

<self-contained-plan-rule>
Каждый `.md`, включая private child/leaf, является самодостаточной implementation specification. Нельзя заменять описание фразой «использует context родителя»: файл обязан фиксировать относящиеся к leaf части context/ticket API, registration/disposal, states, user flow, slots, a11y, M3/SCSS map, edge cases, tests, reuse и non-goals. Решения не должны существовать только в чате. Размер child plan определяется сложностью, а не искусственно сокращается относительно parent.
</self-contained-plan-rule>
