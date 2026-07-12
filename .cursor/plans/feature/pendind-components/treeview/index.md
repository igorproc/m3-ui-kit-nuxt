# MTreeview: pending composite

<identity>
Status: pending architecture/interaction validation · Vuetify reference: `VTreeview` · Candidate target: public data-driven `MTreeview` with private Children/Group/Item leaves
</identity>

<reason-for-pending>
Treeview combines immutable recursive normalization, three separate controlled states (opened/selected/active), cascade aggregate selection, lazy child loading, full visible-graph keyboard focus and nested ARIA semantics. Existing list/selection registries help, but they do not by themselves solve ancestry, tri-state propagation or focus after recursive changes. The family should not be implemented as a thin nested list before these contracts are reviewed and stress-tested.
</reason-for-pending>

<candidate-api>
Data-driven `items` with title/value/children/disabled/hasChildren resolvers. Values are stable `PropertyKey`s. Models: selected value array, opened value array and one active value. Candidate policies: independent/leaf/cascade selection, single/multiple open strategy, openOnClick and optional loadChildren callback. Input data remains immutable.
</candidate-api>

<master-context>
One root context owns normalized nodes/roots, opened/selected/active/focused/visible projections, node lookup, aggregate selection, open/load actions, activation, visible-order focus navigation and stable ids. All recursive leaves inject this context; no branch-local selection/open context or DOM traversal is allowed.
</master-context>

<normalization>
Build a readonly graph mapping value to source item, parent, children, level, position/set size, disabled and hasChildren. Diagnose duplicate/missing values and cycles. Visible order is a depth-first projection of opened state and drives keyboard navigation without `querySelectorAll`.
</normalization>

<selection>
Keep activation, checkbox selection and disclosure independent. Candidate strategies: independent nodes, leaf-only, and cascade with parent mixed state. Cascade computes over normalized ancestry/descendants from one selected model; it must not instantiate unsynchronized generic selection groups per branch.
</selection>

<lazy>
Distinguish loaded empty children from unresolved `children: undefined + hasChildren`. Root may cache callback results without mutating input. Request versions prevent stale writes; unmount aborts tree-owned requests, while merely closing a branch need not discard a useful pending result. Loading/error/retry state belongs to the node runtime projection.
</lazy>

<keyboard-accessibility>
Implement WAI tree behavior over visible values: Up/Down, Right open/first child, Left close/parent, Home/End, Enter activate and Space select. Roving tabindex follows focused node; closing/removing focused descendants restores focus to ancestor/nearest visible/root. Root/treeitem/group roles include level, position, set size, expanded, active selection and optional checked/mixed state without contradictory semantics.
</keyboard-accessibility>

<list-dependency>
`MListItem` needs an approved semantic override so TreeviewItem can supply `role=treeitem`, external roving tabindex and tree keyboard bindings without the current interactive-div path forcing `role=button`. Add/update the existing list-family plan before Treeview implementation; tree must reuse list chrome rather than wrap a second interactive root.
</list-dependency>

<virtualization-boundary>
V1 candidate uses nested recursive DOM. Optional flattening/`useVirtualScroll` is a later mode because it changes group semantics, focus retention and aria-setsize behavior. Do not add virtualization implicitly.
</virtualization-boundary>

<reuse>
`MListItem` after semantic update, canonical registry/context lifecycle, selection/tri-state primitives, `MIcon`, lifecycle-safe async tools and later `useVirtualScroll` only after dedicated review. No raw DOM traversal, second list shell or per-branch aggregate model.
</reuse>

<promotion-gate>
Promote after approving the normalized graph/types, three-model semantics, cascade rules, lazy request/cache policy, complete keyboard focus behavior and MListItem semantic extension. Then expand all four family files into final implementation specifications together.
</promotion-gate>

