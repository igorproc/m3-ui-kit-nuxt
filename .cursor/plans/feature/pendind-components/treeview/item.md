# TreeviewItem: pending private node renderer

<identity>Status: pending with parent · Vuetify `VTreeviewItem` · private sub</identity>

<problem>Each node needs one semantic row integrating disclosure, activation, optional tri-state selection, content slots and roving focus without a local aggregate model.</problem>

<candidate-contract>Internal stable value. Inject master context and derive source item, level/position/setsize, open/selected/mixed/active/disabled/loading/error/focused plus safe toggle/select/activate/focus bindings. Root slots customize content, not the semantic treeitem root.</candidate-contract>

<composition>Reuse updated `MListItem` chrome with explicit role/tabindex/ARIA/tree-keyboard override. Prepend contains disclosure and optional checkbox/marker; append remains consumer content. Avoid nested competing interactive roots.</composition>

<accessibility>Role treeitem, roving tabindex, aria-level/posinset/setsize, expanded for branches, selected for active state and checked/mixed for selectable state. Disabled and busy states remain coherent. All arrow behavior delegates to root visible graph.</accessibility>

<reuse>Master context, MListItem semantic extension, MIcon/selection visuals and family tokens. No local registry/model, DOM traversal or per-item global listener.</reuse>

<promotion-gate>Finalize with list semantic update and root keyboard/selection contracts.</promotion-gate>

