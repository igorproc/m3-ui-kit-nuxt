# MAlert

<identity>
Vuetify reference: `VAlert` · PrimeTime target: `MAlert` · Phase: 3 · Type: public
</identity>

<implementation-status state="planned" updated="2026-07-13">
Specification is approved; no public `MAlert` implementation or focused tests were found.
</implementation-status>

<status>
Discussed and approved. `MAlert` is a persistent inline status block. It is not a toast, snackbar, dialog, notification queue or overlay.
</status>

<problem>
Forms, settings sections and page content need a visible message that remains next to the state it explains. Rebuilding this from `MSurface`, colors, icons and ARIA attributes makes severity semantics inconsistent and encourages misuse of transient `MSnackbar` notifications for persistent errors.
</problem>

<solution>
`MAlert` renders a semantic inline surface with severity icon, optional title, content, actions and explicit dismissal. It occupies normal document layout and never teleports or auto-dismisses. `MSnackbar` remains responsible for transient toast feedback about a completed action.

Non-goals:

- no timeout, queue, global service or programmatic notification API;
- no fixed positioning, teleport, overlay stack or focus trap;
- no retry/loading business state;
- no automatic conversion of actions into an overflow menu;
- no arbitrary color prop that can contradict severity.
</solution>

<api>
```ts
export type MAlertType = 'info' | 'success' | 'warning' | 'error'
export type MAlertVariant = 'tonal' | 'outlined'
export type MAlertAnnounce = 'auto' | 'polite' | 'assertive' | 'off'

export interface MAlertProps {
  type?: MAlertType
  variant?: MAlertVariant
  title?: string
  text?: string
  icon?: string | false
  closable?: boolean
  closeLabel?: string
  announce?: MAlertAnnounce
}

const model = defineModel<boolean>({ default: true })

const emit = defineEmits<{
  (event: 'close'): void
}>()
```

Defaults:

```ts
{
  type: 'info',
  variant: 'tonal',
  icon: undefined,
  closable: false,
  announce: 'auto',
}
```

`icon: undefined` resolves the default severity icon; `icon: false` removes the leading icon. `closeLabel` uses the locale-layer default when omitted. An external `model=false` hides the alert without emitting `close`; `close` only represents explicit user dismissal.
</api>

<composition>
```text
MAlert semantic root
├── MSurface
├── leading icon → MIcon
├── content
│   ├── title
│   └── default/text
├── actions → consumer MButton composition
└── close → MButtonIcon
```

The SFC imports all UI dependencies explicitly. `MSurface` provides the passive container boundary, while alert layout and severity tokens remain owned by `MAlert`. Default close uses `MButtonIcon`; actions are supplied through the `actions` slot and documented with `MButton` examples.
</composition>

<reuse>
Reuse `MSurface`, `MIcon`, `MButton`, `MButtonIcon`, the locale layer and stable-id utilities already used by the kit. Do not duplicate the `MSnackbar` queue/toast responsibility, create raw action buttons, introduce a Pinia store or add an overlay primitive.
</reuse>

<models-and-flow>
```text
model=true
  ├── render inline alert
  ├── external model=false → hide without close event
  └── close action
        ├── emit close
        └── model=false
```

No internal timer exists. Updating `type`, title or content preserves visibility. Reopening through the model renders current props/slots without retaining private dismissal state.
</models-and-flow>

<slots>
- `default`: rich message body; falls back to `text`.
- `title`: rich title content; falls back to `title` prop.
- `icon`: replaces the leading icon rendering.
- `actions`: action area; consumers compose one or more `MButton`s.
- `close`: whole-control replacement for the close button.

```ts
export interface MAlertIconSlot {
  type: MAlertType
  icon: string
}

export interface MAlertActionsSlot {
  type: MAlertType
  close: () => void
}

export interface MAlertCloseSlot {
  close: () => void
  props: {
    type: 'button'
    ariaLabel: string
    disabled: false
    onClick: () => void
  }
}
```

The whole-control `close` slot receives safe bindings. A consumer replacing it is responsible for retaining button semantics and an accessible name. Slots never accept HTML strings.
</slots>

<default-icons>
```text
info    → info
success → check_circle
warning → warning
error   → error
```

The names use the existing `MIcon` resolution convention. The decorative severity icon is hidden from assistive technology because the semantic type and textual content already communicate the state.
</default-icons>

<accessibility>
With `announce="auto"`:

```text
info    → role=status · aria-live=polite
success → role=status · aria-live=polite
warning → role=status · aria-live=polite
error   → role=alert  · aria-live=assertive
```

`polite` and `assertive` explicitly override this mapping. `off` renders a semantic inline region without live-region announcements, for example when the alert is already present in initial SSR HTML.

Stable ids connect a rendered title through `aria-labelledby` and body content through `aria-describedby`. Empty title/body wrappers are not rendered. The close control receives the localized accessible name.

Escape does not dismiss an inline alert. Since there is no activator, the component does not guess a focus-return target after close. Consumers that opened an alert from a specific control may restore focus in `@close`.
</accessibility>

<layout-and-ux>
Wide layout keeps icon, content, actions and close control in one structured row. At narrow container/viewport widths, actions wrap beneath the content while close remains available at the leading content row edge. Content can grow and wrap without shrinking icon or close hit target.

Actions remain visible; the component does not hide them in a menu. A large number of actions indicates that `MBanner`, `MCard` or another content surface is more appropriate.
</layout-and-ux>

<styles>
Create `app/assets/stylesheet/components/alert/_index.scss` exporting one nested `$tokens` map and consume it through:

```scss
@use '~/assets/stylesheet/components/alert/index' as t;

.ui-alert {
  $t: material-map(t.$tokens, 'md-alert');
}
```

The map covers:

- root gap, padding, min size, shape and motion;
- title/body typography;
- icon and close-control sizing;
- actions spacing and responsive wrapping;
- per-severity `tonal` container/content/icon/action roles;
- per-severity `outlined` container/content/icon/action/outline roles;
- close hover, focused, pressed and disabled state layers.

Error uses the canonical error container roles. Info/success/warning mappings are declared explicitly in alert tokens from available semantic theme roles until dedicated system roles exist. The SFC contains no literal colors, sizes, state opacity values or component runtime CSS variables.
</styles>

<ssr-and-lifecycle>
Initial visibility and semantic attributes derive synchronously from props/model, producing stable SSR markup. There are no browser listeners, timers, teleport targets, observers or mounted-time initial state. Closing is a synchronous model transition.
</ssr-and-lifecycle>

<dx>
```vue
<MAlert
  type="warning"
  title="Не все изменения сохранены"
  text="Проверьте соединение и повторите попытку."
/>
```

```vue
<MAlert
  v-model="showSyncError"
  type="error"
  title="Не удалось синхронизировать данные"
  closable
  @close="trackDismiss"
>
  Последние изменения пока сохранены только на этом устройстве.

  <template #actions>
    <MButton
      variant="text"
      color="error"
      @click="retrySync"
    >
      Повторить
    </MButton>
  </template>
</MAlert>
```
</dx>

<edge-cases>
- No title: body aligns correctly with the icon and actions.
- No body: title remains the accessible label without an empty description.
- No icon: content occupies the leading column without reserved blank space.
- No actions/close: no empty trailing containers render.
- Long localized title/body/action labels wrap without overflow.
- Slot and prop content follow deterministic slot-first precedence.
- `closable=false` ignores the close slot to avoid a hidden interaction contract.
- Changing severity while visible updates semantics and tokens without resetting the model.
</edge-cases>

<tests>
- defaults and all severity/variant combinations;
- default icon resolution, custom icon and `icon=false`;
- title/text fallbacks and slot precedence;
- controlled visibility, explicit close event and external hide without close event;
- default and custom close controls;
- automatic and overridden role/live-region mappings;
- `aria-labelledby`/`aria-describedby` only for rendered content;
- keyboard activation of close and absence of Escape dismissal;
- narrow action wrapping and long-content layout;
- light/dark themes and alert token resolution;
- SSR output and hydration with visible/hidden models;
- lint, stylelint and docs playground examples.
</tests>

<done>
`MAlert` provides a persistent, accessible and token-driven inline status message with severity, actions and optional dismissal. It remains clearly distinct from `MSnackbar`, adds no global runtime infrastructure and passes lint, stylelint, unit, a11y and SSR checks.
</done>

<questions>
None. Product and API direction approved.
</questions>
