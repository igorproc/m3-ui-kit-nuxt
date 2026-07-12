# MEmptyState: low priority

<identity>
Status: low priority · Vuetify reference: `VEmptyState` · Candidate target: public `MEmptyState`
</identity>

<reason-for-low-priority>
Empty-state layouts are useful, but the current capability can be composed from existing `MSurface`, `MIcon`, typography and `MButton` without introducing missing runtime infrastructure. The component is therefore less urgent than collection, navigation and data-view foundations in the active `vuetify-run` roadmap.
</reason-for-low-priority>

<candidate-scope>
If promoted, `MEmptyState` is a standalone design block for absent primary content: optional image/icon, title, description and actions, with plain/tonal surfaces and canonical sizes. It may represent empty data, no results, permission/offline states or a recoverable whole-view error.
</candidate-scope>

<boundaries>
- It is not `MAlert`, `MBanner`, `MSnackbar` or `MCard`.
- It does not own loading, items, errors, fetching or retry callbacks.
- Loading remains with `MLoading`/`MSkeletonLoader`.
- Actions are composed from `MButton` through slots.
- No fixed catalogue such as `empty|error|offline` is required.
</boundaries>

<candidate-api>
Props: `title?`, `text?`, `icon?`, `image?`, `imageAlt?`, canonical `size`, `variant: plain|tonal`, `announce: off|polite`. Slots: `media`, `title`, default description and `actions`. Native image load/error may be emitted; broken image falls back to icon without retry policy.
</candidate-api>

<reuse>
`MSurface`, `MIcon`, `MButton`, canonical size/theme tokens and later `MImg` if it exists by implementation time. Do not duplicate image, loading or data-state engines.
</reuse>

<promotion-gate>
Return to the active roadmap when repeated product screens demonstrate enough duplicated empty-state layout, media, responsive action and accessibility wiring to justify a dedicated public component.
</promotion-gate>

