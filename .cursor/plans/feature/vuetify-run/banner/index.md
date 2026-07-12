# MBanner

<identity>
Vuetify reference: `VBanner` · PrimeTime target: `MBanner` · Phase: 3 · Type: public family parent
</identity>

<status>
Discussed and approved. `MBanner` is a neutral contextual action surface for page/section-level situations. It is distinct from severity-oriented inline `MAlert` and transient overlay `MSnackbar`.
</status>

<problem>
Some persistent situations affect an entire page or section and require a visible user decision: incomplete setup, offline mode, changed terms or unavailable synchronization. An alert is too local/severity-oriented, a snackbar is transient, and a dialog is unnecessarily blocking.
</problem>

<solution>
Render a wide inline surface with optional icon/title, explanatory content, responsive actions and explicit dismissal. Banner remains in document flow and owns no placement, sticky behavior, timer, queue or business state.

Non-goals: severity types, arbitrary colors, global service, teleport, timeout, queue, focus trap, sticky offsets, automatic action overflow and card-like arbitrary content sections.
</solution>

<api>
```ts
export type MBannerLayout = 'auto' | 'inline' | 'stacked'
export type MBannerVariant = 'surface' | 'tonal'
export type MBannerAnnounce = 'polite' | 'off'

export interface MBannerProps {
  title?: string
  text?: string
  icon?: string | false
  layout?: MBannerLayout
  variant?: MBannerVariant
  closable?: boolean
  closeLabel?: string
  announce?: MBannerAnnounce
}

const model = defineModel<boolean>({ default: true })

const emit = defineEmits<{
  (event: 'close'): void
}>()
```

Defaults are `layout: 'auto'`, `variant: 'surface'`, `closable: false`, `announce: 'polite'`. `icon: undefined` means no default icon; banner has no severity from which to infer one. `icon: false` explicitly suppresses icon rendering when wrapper presets supply one.
</api>

<composition>
```text
MBanner semantic section
├── MSurface
├── optional MIcon
├── content
│   ├── title
│   └── default/text
├── private BannerActions
│   └── consumer MButton composition
└── optional MButtonIcon close
```

`MBanner` imports `MSurface`, `MIcon`, `MButtonIcon` and `BannerActions` explicitly. The parent passes `layout` directly to its immediate private leaf. No context, registry or provide/inject pair is created for a relationship that needs neither descendant discovery nor shared mutable state.
</composition>

<reuse>
Reuse `MSurface`, `MIcon`, `MButton`, `MButtonIcon`, locale labels and existing layout primitives when placement is needed. Do not duplicate `MAlert` severity, `MSnackbar` queue, `MLayoutItem` sticky/carve behavior or create raw action controls/global state.
</reuse>

<models-and-flow>
```text
model=true
  ├── external false → hide without close event
  └── explicit close
        ├── emit close
        └── model=false
```

Banner has no automatic dismissal and Escape does not close it. Reopening renders current props/slots without retained private state.
</models-and-flow>

<slots>
- `default`: body content, falling back to `text`.
- `title`: rich title, falling back to `title`.
- `icon`: complete leading visual replacement.
- `actions`: rendered inside private `BannerActions`.
- `close`: whole-control close replacement.

```ts
export interface MBannerActionsSlot {
  close: () => void
}

export interface MBannerCloseSlot {
  close: () => void
  props: {
    type: 'button'
    ariaLabel: string
    onClick: () => void
  }
}
```

Default close uses `MButtonIcon`. Consumers compose actions from `MButton`; the banner does not assign primary/secondary meaning or reorder controls.
</slots>

<layout>
- `inline`: icon, content, actions and close share the wide layout row.
- `stacked`: actions occupy a trailing row beneath content.
- `auto`: static CSS/container breakpoints select inline or stacked presentation without DOM measurement.

Text may wrap naturally. Action DOM order and keyboard order remain unchanged across layouts. Actions stay visible rather than collapsing into an implicit menu. Banner does not expose `sticky`; consumers place it normally or compose it with the canonical layout family.
</layout>

<accessibility>
Root is a labelled semantic section, not `role="alert"`. Rendered title/body receive stable ids and wire `aria-labelledby`/`aria-describedby`. `announce="polite"` adds polite live-region behavior; `off` omits it for permanent SSR content. Close has a localized accessible name.

There is no focus trap or activator. After dismissal the component does not guess a focus target; consumers may restore focus from `@close`. Icon content is decorative unless a custom slot deliberately supplies meaningful semantics.
</accessibility>

<styles>
Create `app/assets/stylesheet/components/banner/_index.scss` with one nested `$tokens` map. It covers surface/tonal container and content roles, optional divider/outline, padding, icon geometry, title/body typography, close placement, inline/stacked grids, responsive thresholds, actions gap/alignment and motion. Interactive state layers remain owned by reused buttons. No literal component values or runtime state CSS variables live in the SFC.
</styles>

<ssr-and-lifecycle>
All initial output derives synchronously from props/model. Auto layout is CSS-driven and creates no hydration-dependent branch. No observers, global listeners, timers, teleport or mounted-time initialization exist.
</ssr-and-lifecycle>

<dx>
```vue
<MBanner
  v-model="showSetupBanner"
  icon="cloud_off"
  title="Синхронизация отключена"
  closable
>
  Изменения сохраняются только на этом устройстве.

  <template #actions>
    <MButton variant="text" @click="openSyncSettings">
      Настроить
    </MButton>
  </template>
</MBanner>
```
</dx>

<edge-cases>
No title/body/icon/actions/close leaves no empty wrappers; long localized text and action labels wrap without overflow; action order survives RTL and layout changes; external hide emits no close; custom close retains consumer-owned semantics; nested banner is allowed structurally but documented as poor UX.
</edge-cases>

<tests>
Props/defaults, slot precedence, both variants, all layouts, CSS auto transition, stable action order, explicit/external dismissal, localized close, polite/off semantics, absent wrapper branches, RTL, long content, SSR/hydration, light/dark tokens, lint and stylelint.
</tests>

<done>
`MBanner` provides a persistent page/section contextual action surface clearly separated from alert, snackbar, dialog and layout placement responsibilities.
</done>

<questions>
None.
</questions>

