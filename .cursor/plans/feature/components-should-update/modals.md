# Modal infrastructure: declarative API + `$modals`

<identity>
Area: existing modal infrastructure · Update targets: `useModal`, Nuxt plugin, `MDialog`, modal `MSheet`, overlay host · Depends on: `feature/vuetify-run/overlay.md`
</identity>

<problem>
Декларативный `v-model` удобен для dialog, который является частью состояния страницы, но одноразовые confirm/alert/quick-form сценарии заставляют заранее размещать экземпляры dialog в template и обслуживать лишние refs.

Текущий `openModal()` частично решает это через `vue-final-modal`, однако его контракт неоднозначен: заявлен `Promise<T | null>`, cancellation может вернуть `false`, confirm без payload — `true`, а falsy payload (`0`, `''`, `false`) заменяется на `true`. Публичный composable также напрямую связан с mounting API сторонней библиотеки.
</problem>

<goal>
Оставить два равноправных способа открытия modal UI:

1. декларативный `<MDialog v-model>` / `<MSheet v-model>` для состояния, принадлежащего экрану;
2. программный `$modals` / `useModals()` для одноразовых flow без template boilerplate.

Оба способа обязаны использовать одинаковые компоненты и единый `MOverlay` runtime, поэтому выбор API не меняет M3 UX, accessibility и nesting behavior.
</goal>

<service-api>
```ts
type ModalDismissReason
  = 'cancel' | 'outside' | 'escape' | 'programmatic' | 'parent-closed'

type ModalResult<T> =
  | { status: 'confirmed', value: T }
  | { status: 'cancelled', reason: ModalDismissReason }

interface OpenModalOptions {
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
  parent?: MModalContext | null
}

interface ModalService {
  open<TResult>(
    component: Component,
    options?: OpenModalOptions,
  ): Promise<ModalResult<TResult>>

  confirm(options: ModalConfirmOptions): Promise<boolean>
  alert(options: ModalAlertOptions): Promise<void>
  closeTop(reason?: ModalDismissReason): void
  closeAll(reason?: ModalDismissReason): void
}
```

Nuxt plugin injects `$modals`; `useModals()` возвращает тот же facade, но захватывает ближайший modal context для автоматического parent-child nesting.
</service-api>

<usage>
Declarative — когда modal является видимой частью состояния страницы:

```vue
<MDialog v-model="isEditing">
  <ProfileForm />
</MDialog>
```

Programmatic component — когда нужен результат локальной операции:

```ts
const result = await $modals.open<ProfileDraft>(EditProfileDialog, {
  props: { profile },
})

if (result.status === 'confirmed')
  await save(result.value)
```

Preset — для короткого решения:

```ts
const shouldDelete = await $modals.confirm({
  title: 'Удалить проект?',
  text: 'Это действие нельзя отменить',
  confirmText: 'Удалить',
  tone: 'error',
})
```
</usage>

<result-contract>
`open()` всегда resolve, а не reject, при пользовательском закрытии. Reject допускается только для ошибки создания/mount компонента. Discriminated union не смешивает business payload с причиной закрытия и сохраняет любые falsy values без преобразования.

`confirm()` намеренно сворачивает result в boolean для простого UX; `alert()` завершается после полного закрытия. Generic `open()` остаётся строгим и информативным.
</result-contract>

<nesting>
- `useModals().open()` внутри dialog автоматически передаёт текущий context как parent.
- `$modals.open()` без `parent` открывает root modal; explicit `parent` разрешён для infrastructure code.
- При закрытии parent его programmatic children получают `parent-closed`, корректно завершают promises и уничтожаются.
- Escape/closeTop воздействует только на верхний eligible modal в общем overlay stack.
</nesting>

<component-contract>
Компонент, переданный в `open()`, должен поддерживать standard modal bridge:

- `modelValue: boolean` + `update:modelValue`;
- emit `confirm(payload)`;
- emit `cancel`;
- emit `closed` после leave transition.

`MDialog` и modal `MSheet` реализуют bridge напрямую. Для произвольного content-компонента можно использовать documented wrapper/helper, но service не должен угадывать произвольные имена событий.
</component-contract>

<presets>
`confirm` и `alert` — методы service, построенные на внутренних M3-компонентах dialog, а не отдельная rendering system. Их API должен оставаться небольшим: title, supporting text, action labels, semantic tone, persistent/loading/disabled action state. Для сложной формы используется `open(component)`.

Не добавлять универсальный JSON-конструктор dialog: slots/component дают лучший Vue DX и типизацию.
</presets>

<plugin>
- Переименовать plugin по назначению, например `app:modals`, вместо публичного акцента на `vue-final-modal`.
- Plugin создаёт один request-safe `ModalService` и предоставляет `$modals` через Nuxt injection.
- Добавить Nuxt type augmentation для `useNuxtApp().$modals` и template access.
- `vue-final-modal` оставить внутренним mounting adapter на первом этапе. Ни один public type/import не должен экспортировать VFM.
- Overlay host доступен как в optional `MApp`, так и в стандартном layer root; `MApp` не является обязательным условием `$modals`.
</plugin>

<reuse>
Переиспользовать `MDialog`, modal `MSheet`, будущий `MOverlay`, modal context и существующий VFM adapter. Не создавать отдельные programmatic dialog styles, scrim, stack, focus trap или transition. Confirm/alert собираются из существующих M3 typography, buttons и dialog composition.
</reuse>

<m3-ux>
- Programmatic способ не меняет M3 shape, surface, typography, scrim и motion выбранного modal component.
- Confirm destructive action использует semantic error treatment, но не полагается только на цвет.
- Пока async confirm выполняется, action получает progress/disabled state; dismiss policy задаётся явно, а не скрыто меняется service.
- Focus после закрытия возвращается к element, из которого был вызван service, либо в parent modal.
</m3-ux>

<migration>
1. Ввести типы `ModalResult`, `ModalDismissReason`, `ModalService` и behavioral tests.
2. Реализовать service поверх текущего VFM mounting adapter без изменения overlay visuals.
3. Инъецировать `$modals` и добавить `useModals()` с capture ближайшего context.
4. Перевести `openModal()` в deprecated compatibility wrapper. Wrapper должен честно документировать legacy return; новые вызовы используют service result.
5. Подключить service к `MOverlay` runtime после реализации overlay plan.
6. Добавить typed internal confirm/alert components/presets.
7. Удалить legacy wrapper только в следующем major release; затем отдельно решить, оставлять или заменять VFM adapter.
</migration>

<tests>
- generic `open()` возвращает typed confirmed/cancelled result;
- payload `false`, `0`, `''`, `null` не заменяется sentinel-значением;
- outside/Escape/cancel/programmatic/parent close дают правильную reason;
- promise завершается ровно один раз при конкурирующих events;
- component уничтожается только после `closed` и не оставляет listeners/context;
- nested `useModals()` создаёт child, global `$modals` — root;
- `closeTop`/`closeAll` соблюдают stack и persistent policy;
- confirm/alert shortcuts;
- SSR не монтирует DOM преждевременно, client hydration создаёт host безопасно;
- declarative и programmatic вызов одного dialog имеют одинаковые overlay/a11y semantics.
</tests>

<done>
Пользователь выбирает template или `$modals` по характеру состояния, а не из-за ограничений kit. Оба пути дают один M3 modal UX; programmatic results типизированы, nesting предсказуем, VFM скрыт за заменяемым adapter.
</done>

<questions>
Перед реализацией отдельно утвердить точные поля `ModalConfirmOptions`/`ModalAlertOptions` и политику `closeAll` относительно persistent modals.
</questions>
