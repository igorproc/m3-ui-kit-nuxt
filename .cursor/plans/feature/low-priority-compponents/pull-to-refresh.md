# MPullToRefresh: low priority

<identity>
Status: low priority · Vuetify reference: `VPullToRefresh` · Candidate target: public `MPullToRefresh` or gesture composable plus thin presentation
</identity>

<reason-for-low-priority>
Pull-to-refresh is a mobile-specific convenience pattern rather than a foundational data capability. A correct implementation must arbitrate native scrolling/overscroll, nested containers, pointer intent, refresh threshold, resistance, async state, cancellation and reduced motion. Current products can expose an explicit refresh action without gesture ambiguity.
</reason-for-low-priority>

<candidate-scope>
An opt-in scroll-top gesture surface. It reports gesture progress/armed/refreshing state and invokes or emits one consumer-owned refresh intent. Consumer retains data transport, cache invalidation, retry/error and refreshed content.
</candidate-scope>

<candidate-state-machine>
```text
idle
└── downward gesture at logical scroll start → pulling
    ├── release before threshold → settling → idle
    └── threshold reached → armed
        ├── cancel → settling → idle
        └── release → refreshing
            └── consumer completion → settling → idle
```

Exact callback-versus-controlled-state API requires later review. Repeated gestures while refreshing are blocked; stale async completion cannot mutate a new gesture.
</candidate-state-machine>

<interaction>
Activate only at the scroll container's logical start and after vertical intent is confirmed. Do not break horizontal gestures, nested scrollables, text selection or browser navigation. Prefer pointer events through `useDrag`; never attach raw global touch listeners. Keyboard users retain a visible explicit refresh action in the consumer UI when refresh is essential.
</interaction>

<platform-policy>
Review browser/installed-PWA native overscroll refresh behavior and `overscroll-behavior` before implementation. The component must not produce double refresh or disable useful browser behavior globally. Container ownership is explicit.
</platform-policy>

<accessibility-motion>
Indicator communicates refreshing through a localized status without announcing continuous pull percentages. Reduced motion removes elastic animation while preserving the explicit action/result. Focus and reading position remain stable when content refreshes.
</accessibility-motion>

<reuse>
`useDrag`, `useRaf`, `useEventListener`, canonical progress/loading visuals and reduced-motion tokens. No fetch/cache store, raw listeners or duplicated scroll state machine per visual leaf.
</reuse>

<non-goals>
- no automatic data fetching;
- no cache invalidation policy;
- no global overscroll CSS;
- no replacement for an accessible explicit refresh button;
- no implementation without a confirmed touch-first product surface.
</non-goals>

<promotion-gate>
Promote when a touch-first product flow requires the gesture and drag/scroll arbitration has dedicated browser/device tests. Decide composable-first versus component API before final planning.
</promotion-gate>

