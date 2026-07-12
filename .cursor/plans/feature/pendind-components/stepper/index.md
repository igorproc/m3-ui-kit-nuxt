# MStepper

<identity>Vuetify `VStepper` · PrimeTime `MStepper` · Phase 4 · public family parent</identity>

<status>Pending composite. Architecture approved as a data-driven workflow orchestrator, but implementation is gated by the pending `MWindow` foundation and guard/focus integration tests.</status>

<pending-reason>Stepper combines Window mounting/motion, controlled workflow selection, async beforeChange/beforeComplete guards, horizontal/vertical presentations, action pending state and focus/ARIA wiring. Promote only after MWindow is stable and the shared root state is tested across both renderers.</pending-reason>

<problem>Multi-step workflows need stable-value navigation, status, linear progression, asynchronous gating, panels and actions without duplicating validation or maintaining horizontal/vertical state separately.</problem>

<solution>Normalize typed step descriptors, own one step selection/context and route every transition through guards. Render horizontal or vertical private presentation leaves and reuse `MWindow` for content. Non-goals: validation engine, form store, route wizard, index model and responsive dual DOM.</solution>

<api>
```ts
interface MStepperItem<TValue> {
  value: TValue
  title: string
  subtitle?: string
  optional?: boolean
  complete?: boolean
  error?: boolean
  disabled?: boolean
  icon?: string
  completeIcon?: string
  errorIcon?: string
}
type MStepperLayout = 'horizontal' | 'vertical'
type StepperChangeReason = 'next' | 'prev' | 'item' | 'model'
type StepperBeforeChange<T> = (event: { from?: T, to: T, direction: 'forward' | 'backward', reason: StepperChangeReason }) => boolean | Promise<boolean>
```
Props: typed items/resolvers, layout, linear, editable, disabled, mount, beforeChange, beforeComplete, localized action labels. Model is `TValue`; emits `complete` and `navigation-error`. Defaults: horizontal, linear true, editable true, mount visited.</api>

<composition>Root creates the only step selection/orchestration context. Horizontal renderer uses Item + Window + Actions; vertical renderer uses VerticalItem + local VerticalActions. Immediate renderer relationships use direct props; context exists only for cross-branch current/navigation/ids.</composition>

<reuse>`MWindow`, `createSingle`/selection registries, `MButton`, `MIcon`, locale and stable ids. No pending validation dependency: application-controlled complete/error fields plus guards are the integration boundary.</reuse>

<navigation>Every request checks disabled/bounds/linear rules, awaits `beforeChange`, then commits model. Pending guard sets navigating and blocks repeats. False/reject retains the active panel; reject emits navigation-error. Backward/forward order uses normalized enabled values, never numeric model assumptions.</navigation>

<linear>Backward navigation to reachable prior steps is allowed. Forward direct navigation requires every preceding non-optional step complete and advances normally one enabled step at a time. Optional does not block; disabled is skipped but not auto-complete. `editable=false` disables header navigation only.</linear>

<completion>On the final step, complete action awaits `beforeComplete`; success emits complete and leaves model intact, false retains state, rejection emits navigation-error. Workflow submission remains consumer-owned.</completion>

<slots>Item label, panel, actions, previous, next and complete slots receive normalized step, current/bounds, navigating and safe request methods. Content slots cannot bypass root guards by directly mutating window selection.</slots>

<accessibility>Ordered step list; current header uses `aria-current="step"`; actionable headers are real controls, current/noneditable/disabled are noninteractive. Header/panel ids are paired. Stepper is not a tablist and does not invent tab ARIA/roving focus. Successful action navigation focuses the new step header; validation focus remains consumer-owned.</accessibility>

<styles>One nested stepper map covers horizontal headers/connectors, statuses, vertical geometry/body, action layouts and motion. Reused controls retain their own state tokens.</styles>

<ssr-lifecycle>No breakpoint-driven auto layout in v1, avoiding dual DOM/hydration divergence. Async guards are request-versioned so stale completion cannot commit. Context tickets clean up on scope disposal.</ssr-lifecycle>

<tests>Stable values, dynamic items, linear/optional/disabled, editable, guard race/error, complete flow, layouts, focus/ARIA, Window mount policies, SSR and token/lint checks.</tests>

<done>One controlled workflow state safely drives both presentations and panels without validation duplication.</done>

<questions>None.</questions>
