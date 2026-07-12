# MWindow

<identity>Vuetify `VWindow` · PrimeTime `MWindow` · Phase 4 foundation · public family parent</identity>

<status>Pending implementation/integration phase. Architecture discussed and approved; must be implemented and validated before dependent `MStepper`.</status>

<pending-reason>`MWindow` is a generic selection/mount/motion/touch foundation whose lifecycle, inert panels, dynamic registration, SSR mounting and gesture behavior need dedicated integration testing before Stepper composition is considered implementation-ready.</pending-reason>

<problem>Generic value-controlled content switching needs reusable selection, mounting, motion and inactive-panel behavior without importing tab or stepper semantics.</problem>

<solution>`MWindow` normalizes typed items, owns a `createSingle` selection context and renders private `WindowItem` panels. It draws no headers/actions. Non-goals: tablist, step workflow, validation, carousel chrome, index model and global state.</solution>

<api>
```ts
type MWindowDirection = 'horizontal' | 'vertical'
type MWindowTransition = 'slide' | 'fade' | 'none'
type MWindowMount = 'active' | 'visited' | 'eager'

interface MWindowProps<TItem, TValue> {
  items: readonly TItem[]
  itemValue: keyof TItem | ((item: TItem, index: number) => TValue)
  itemDisabled?: keyof TItem | ((item: TItem, index: number) => boolean)
  itemKey?: keyof TItem | ((item: TItem, index: number) => PropertyKey)
  direction?: MWindowDirection
  transition?: MWindowTransition
  touch?: boolean
  mandatory?: boolean | 'force'
  mount?: MWindowMount
}

const model = defineModel<TValue>()
```
Defaults: horizontal, slide, touch false, mandatory force, mount visited.</api>

<composition>`createSingle` owns value tickets and selection; typed window context exposes active value/order/direction/mount/ids plus prev/next/select. Private items register once and clean up with `onScopeDispose`. Data items render through `#item`; group-level default slot receives navigation state.</composition>

<reuse>`createSingle`, registry identity/comparator conventions, `useDrag`, `useEventListener`, motion tokens and reduced-motion policy. Do not implement another selection registry, raw global listeners or index selection.</reuse>

<slots>Item slot receives source item/index/value/active/visited; default/group slot receives active, hasPrev/hasNext and prev/next/select. Empty slot handles no enabled items. Custom content never receives internal ticket ids.</slots>

<mounting>`active` mounts only selected content; `visited` mounts on first activation and retains it; `eager` mounts all. Inactive retained panels are hidden and inert. Removed panels lose local state by explicit policy. Dynamic removal selects the next valid ticket according to mandatory rules.</mounting>

<touch>Optional touch uses `useDrag`; axis intent is confirmed before preventing native scroll. Disabled bounds do not rubber-band into selection. RTL reverses horizontal logical direction. No touch listeners when disabled.</touch>

<accessibility>Window is semantic-neutral by default; consumers/leaves supply panel roles and ids where needed. Inactive retained content is `hidden` and `inert`, never tabbable. Reduced motion changes animation only.</accessibility>

<styles>One nested window token map covers viewport overflow, horizontal/vertical slide directions, fade, duration/easing and reduced motion. No layout literals/runtime state variables in SFC.</styles>

<ssr-lifecycle>Selection and mount branches are synchronous. Drag listeners use lifecycle-safe composables. Visited state begins with the SSR-active panel; hydration does not replace it.</ssr-lifecycle>

<tests>Typed values, mandatory modes, dynamic items, all mount policies, prev/next skipping disabled, RTL/touch axis, inert panels, transitions/reduced motion, SSR/hydration, cleanup, lint/stylelint.</tests>

<done>Generic panels switch by stable value with controlled mounting and motion, independent of tabs/stepper semantics.</done>

<questions>None.</questions>
