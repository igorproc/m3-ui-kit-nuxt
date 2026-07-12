# MCalendar: high-priority pending composite

<identity>
Status: pending system validation · Priority: high · Vuetify reference: `VCalendar` · Candidate target: public `MCalendar` with private category/daily/weekly views
</identity>

<reason-for-pending>
Calendar is a large composite rather than an isolated component. It combines date/range arithmetic, locale/time-zone/DST correctness, event normalization and overlap geometry, selection/focus registries, scrolling/virtualization, responsive layouts, drag interactions, overlays and SSR. Building it before those foundations are tested together would make the calendar an integration test written as production architecture.
</reason-for-pending>

<priority>
High. The feature remains strategically important and should return immediately after the underlying system passes integration and stress testing. Pending means dependency-gated, not optional or low priority.
</priority>

<candidate-scope>
Root owns visible range, view selection, normalized events/categories, interval definitions, ids and cross-view navigation. Private Category, Daily and Weekly renderers consume one root context and share event geometry. Calendar never fetches data and does not reuse DatePicker selection semantics accidentally.
</candidate-scope>

<candidate-api>
Stable models for visible anchor/range and view. Typed inputs for events/categories/interval policy, first day of week, timezone/locale and readonly/interaction mode. Slots for event, day, interval and category content. Emits user intent for date/event/interval activation and range/view changes; business persistence remains consumer-owned.
</candidate-api>

<system-prerequisites>
1. Date primitives tested across locale, week boundaries, leap years, timezone and DST transitions.
2. Registry/context lifecycle tested under dynamic and virtualized children.
3. Scroll/RAF/virtualization foundations tested for large interval/event sets.
4. Drag/pointer gesture arbitration and cleanup tested with scrollable grids.
5. Overlay/menu/popover stacking and focus return tested for event interactions.
6. Responsive/container strategy tested without hydration divergence.
7. Shared M3 token architecture validated for dense data grids and interaction states.
8. SSR/client date formatting parity and deterministic ids verified.
</system-prerequisites>

<architecture-to-decide>
- Canonical date/time representation and explicit timezone boundary.
- Visible-range model versus anchor-date model.
- View set and whether month/resource views belong in the initial release.
- Event overlap/lane allocation and all-day placement algorithms.
- Virtualization thresholds for intervals, categories and events.
- Keyboard model: grid navigation, event traversal and focus restoration.
- Drag create/move/resize scope and readonly separation.
- Responsive behavior: scroll, alternate view or consumer-controlled switch.
- Event identity, recurrence expansion boundary and diagnostics.
</architecture-to-decide>

<reuse>
Existing date utilities after validation, selection/context registries, `useEventListener`, `useRaf`, future virtual-scroll foundation, `useDrag`, `MButtonIcon`, overlay/menu primitives, locale and system tokens. Do not create a second date parser/locale engine, fetch layer, global event store or raw listener loops.
</reuse>

<non-goals>
- no event fetching/cache/persistence;
- no recurrence backend or calendar provider integration hidden in UI;
- no DatePicker state reuse where event-calendar semantics differ;
- no untested timezone inference;
- no implementation before prerequisite test gates pass.
</non-goals>

<test-gate>
Before implementation planning is finalized, create cross-foundation integration tests for DST days, week/year boundaries, dynamic registry cleanup, large scroll grids, pointer cancellation, overlay focus, responsive SSR and reduced motion. Calendar-specific visual/event tests build on those results rather than compensating for unstable primitives.
</test-gate>

<promotion-gate>
Promote the complete family back to the active roadmap after prerequisite owners sign off the tested foundations and the root date/time/event representation is approved. Then expand all four plans into final API/state-machine/geometry specifications before code work.
</promotion-gate>

