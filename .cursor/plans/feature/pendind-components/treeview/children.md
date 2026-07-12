# TreeviewChildren: pending private recursion leaf

<identity>Status: pending with parent · Vuetify `VTreeviewChildren` · private sub</identity>

<problem>Recursive traversal must live in one renderer so Group/Item do not duplicate node mapping, slot forwarding or lazy branches.</problem>

<candidate-contract>Direct props: normalized child values and level. Inject master tree context for lookup/state/actions. Render Group for branches and Item for leaves; proxy root item/prepend/title/append slots. No model or local loading state.</candidate-contract>

<semantics>Nested invocation owns `role=group`; root invocation renders direct tree children. DOM order follows normalized reading order. Closed branches are absent/inert according to the eventual mount policy.</semantics>

<reuse>Master context, private Group/Item and root slot contracts. No separate context, selection, normalization or DOM traversal.</reuse>

<promotion-gate>Finalize with root normalized graph and lazy/mount semantics.</promotion-gate>

