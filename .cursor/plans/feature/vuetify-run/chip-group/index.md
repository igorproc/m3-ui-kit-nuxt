# MChipGroup

<identity>
Vuetify reference: `VChipGroup` · PrimeTime target: `MChipGroup` · Phase: 3 · Type: public family parent
</identity>

<status>
Discussed and approved. The original `filter` and `column` props are removed as first-iteration artifacts. Vuetify's `VChipGroupSymbol` is an injection symbol, not a visual component; PrimeTime keeps its internal context key inside this plan and creates no `ChipGroupSymbol` component.
</status>

<problem>
Standalone `MChip` has a boolean selected model but several chips cannot yet share stable-value single/multiple selection, mandatory/max rules or one keyboard focus registry. Consumers should be able to compose chips naturally without manually binding generic selection slot state.
</problem>

<solution>
`MChipGroup` specializes the existing selection foundation and provides a dedicated typed chip context. Descendant `MChip` optionally injects that context and registers a reactive value/disabled/element ticket. Grouped selection has exactly one source of truth; outside the group the current standalone boolean model remains unchanged.

Non-goals:

- no index-based model;
- no second selection registry or Pinia store;
- no `filter` prop (chip type owns filter semantics);
- no `column` prop (`direction` expresses layout);
- no overflow arrows/drag (the low-priority `MSlideGroup` phase may own them later);
- no public context symbol or visual `ChipGroupSymbol` leaf.
</solution>

<standalone-chip-rule>
`MChip` remains a first-class standalone design component for all existing MD3 types: `assist`, `filter`, `input` and `suggestion`. `MChipGroup` never forces a chip type and its data API never replaces compositional `<MChip>` usage.

The primary group DX is explicit components in the default slot. A descendant with a defined `value` opts into group selection; a descendant without `value` remains a normal standalone chip used for layout/action/content and does not register. This is valid and produces no warning. Mixed groups therefore retain normal Tab stops for standalone chips while registered selectable chips use the group roving registry.
</standalone-chip-rule>

<api>
```ts
export type MChipGroupDirection = 'horizontal' | 'vertical'

export interface MChipGroupProps<TItem, TValue> {
  items?: readonly TItem[]
  itemValue?: keyof TItem | ((item: TItem, index: number) => TValue)
  itemDisabled?: keyof TItem | ((item: TItem, index: number) => boolean)
  itemKey?: keyof TItem | ((item: TItem, index: number) => PropertyKey)
  multiple?: boolean
  mandatory?: boolean | 'force'
  disabled?: boolean
  max?: number
  direction?: MChipGroupDirection
  wrap?: boolean
  valueComparator?: (left: TValue, right: TValue) => boolean
}

const model = defineModel<TValue | TValue[] | undefined>()
```

Defaults: single, non-mandatory, enabled, horizontal, wrap true. `max` applies only in multiple mode. Standard ARIA attrs fall through to the group root.
</api>

<composition>
```text
MChipGroup
├── useSelectionGroup (only selection source)
├── MChipGroupContext
│   ├── selection facade
│   ├── chip tickets
│   ├── element/order view registry
│   └── roving-focus operations
└── MChip descendants
```

The dedicated context prevents an `MChip` inside an unrelated generic `MSelectionGroup` from registering accidentally. Compositional children inject it; data-driven items receive equivalent safe bindings from the same context.
</composition>

<context>
```ts
interface MChipRegistration<TValue> {
  value: MaybeRefOrGetter<TValue>
  disabled: MaybeRefOrGetter<boolean>
  element: Readonly<ShallowRef<HTMLElement | null>>
}

interface MChipGroupTicket<TValue> {
  value: Readonly<ComputedRef<TValue>>
  selected: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  blocked: Readonly<ComputedRef<boolean>>
  blockReason: Readonly<ComputedRef<'disabled' | 'max' | null>>
  tabindex: Readonly<ComputedRef<0 | -1>>
  toggle: () => void
  focus: () => void
  stop: () => void
}

interface MChipGroupContext<TValue> {
  multiple: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  selectionLimitReached: Readonly<ComputedRef<boolean>>
  direction: Readonly<ComputedRef<MChipGroupDirection>>
  register: (registration: MChipRegistration<TValue>) => MChipGroupTicket<TValue>
  select: (value: TValue) => void
  unselect: (value: TValue) => void
  toggle: (value: TValue) => void
  focusNext: (value: TValue) => void
  focusPrev: (value: TValue) => void
  focusFirst: () => void
  focusLast: () => void
}
```

The internal `InjectionKey<MChipGroupContext<unknown>>` and provide/use/tryUse helpers are implementation exports within the family, not a public component/capability. Selection tickets delegate to `useSelectionGroup`; the additional ordered element list is view/focus state only. Registration cleanup uses `onScopeDispose`.
</context>

<reuse>
Reuse `useSelectionGroup`, its comparator/mandatory/max/model synchronization, selection tickets, `MChip`, shared context helper and lifecycle cleanup. Use wrap/native overflow until the low-priority `MSlideGroup` is promoted. Do not expose generic selection context directly as chip context or duplicate selected collections.
</reuse>

<chip-integration>
`MChip` gains optional typed `value` and calls `tryUseChipGroupContext()`. With context and value it registers once using reactive getters and derives selected/disabled/blocked/tabindex from the ticket; click calls ticket toggle. Without context it retains existing `defineModel<boolean>` standalone behavior.

Inside a chip group without `value`, a chip remains an ordinary standalone component and does not join selection/roving focus. This supports assist/input/suggestion chips as independent design elements even when they share the group layout. Changing a registered value updates the reactive ticket rather than unregistering it.
</chip-integration>

<selection>
Single/multiple/mandatory/max behavior delegates to the canonical registry. Max-blocked unselected chips expose blocked/aria-disabled state and are skipped by selection/focus movement; selected chips remain operable so the user can free capacity. Disabling a selected chip does not silently mutate the business model. Dynamic unmount follows canonical mandatory re-selection behavior.
</selection>

<keyboard>
Root uses `role="group"` with consumer/localized label. Chips are toggle buttons with `aria-pressed`. Roving tabindex provides one entry point. Arrow keys move in logical direction; Home/End focus first/last enabled; Space/Enter retain native chip toggle. Horizontal RTL reverses visual previous/next mapping. Removing the focused chip targets next enabled, then previous, then group root.
</keyboard>

<slots>
Compositional default slot is the primary API and accepts ordinary explicit `MChip` children plus other slot content. It receives selected values, group state and select/unselect/toggle. Data `item` slot is optional convenience and receives source item/index/value/selected/disabled/blocked/blockReason plus safe MChip bindings. `empty` receives group state. Selected-icon customization belongs to `MChip`, not the group.
</slots>

<layout>
`direction` controls row/column flow; horizontal `wrap=true` wraps, false uses native inline scrolling without arrows/drag. Group owns only gap, alignment, wrap and overflow. Chip owns all selected/hover/focus/disabled visual states.
</layout>

<accessibility>
Toggle-button semantics use `aria-pressed`; group disabled and item constraints are reflected without fake checkbox/tab roles. Roving order follows registration/DOM order. Supporting descriptions can bind through fallthrough `aria-describedby`. No tablist semantics are used.
</accessibility>

<styles>
Create `components/chip-group/_index.scss` with layout-only tokens: gaps, directions, wrap/no-wrap and focus fallback. Update existing chip tokens for grouped selected icon, focus-visible and max-blocked presentation. No visual token file exists for the internal symbol/context.
</styles>

<ssr-lifecycle>
Initial model is reconciled as chips register, matching existing selection behavior. No mounted data load or DOM measurement. Element refs are used only for user-triggered focus movement. Tickets/view entries clean up on scope disposal; focus fallback handles dynamic removal.
</ssr-lifecycle>

<dx>
```vue
<MChipGroup v-model="filter" mandatory aria-label="Статус">
  <MChip type="filter" value="all">Все</MChip>
  <MChip type="filter" value="active">Активные</MChip>
  <MChip type="filter" value="archived">Архив</MChip>
</MChipGroup>
```

```vue
<MChipGroup
  v-model="categories"
  :items="availableCategories"
  item-value="id"
  item-key="id"
  multiple
  :max="3"
>
  <template #item="{ item, props }">
    <MChip v-bind="props" type="filter">{{ item.title }}</MChip>
  </template>
</MChipGroup>
```
</dx>

<tests>
Standalone regression for assist/filter/input/suggestion; explicit compositional children with and without value; optional data mode; single/multiple/mandatory/max/disabled; reactive value/disabled; comparator and stable keys; no accidental generic-selection injection; selected/blocked ARIA; mixed standalone/registered keyboard flow; roving arrows/Home/End/RTL; dynamic removal/focus/mandatory; wrap/direction; SSR/hydration; cleanup; tokens/lint/stylelint.
</tests>

<done>
Chip sets share one stable-value model and accessible focus behavior through a dedicated context while standalone chips remain backward-compatible and generic selection infrastructure is reused.
</done>

<questions>
None.
</questions>
