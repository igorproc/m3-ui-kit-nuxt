# TreeviewGroup: pending private branch renderer

<identity>Status: pending with parent · Vuetify `VTreeviewGroup` · private sub</identity>

<problem>A branch needs one treeitem activator plus recursively labelled children without owning disclosure or lazy state.</problem>

<candidate-contract>Internal stable value only. Inject master context to resolve node/open/loading/error/children and actions. Compose TreeviewItem plus TreeviewChildren; no local model/context.</candidate-contract>

<behavior>Activator carries aria-expanded/controls/busy. Open requests route through root lazy/open policy. Closed content leaves navigation/focus order; cached loaded data remains root-owned.</behavior>

<reuse>TreeviewItem, Children, master context and nested connector/inset tokens. No expansion registry or async cache.</reuse>

<promotion-gate>Finalize with root disclosure/lazy/focus policy.</promotion-gate>

