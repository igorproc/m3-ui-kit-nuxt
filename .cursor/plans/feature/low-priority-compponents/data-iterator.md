# Data iterator foundation: low priority

<identity>
Status: low priority · Vuetify reference: `VDataIterator` · Candidate target: preferably headless `useDataIterator`, optionally a thin renderless `MDataIterator`
</identity>

<reason-for-low-priority>
The capability becomes valuable when several non-table collections need the same local filtering, stable sorting and pagination pipeline. Current consumers can keep transformations application-owned, while the correct shared abstraction depends on future `MTable`, `MPagination` and client/server data-mode decisions.
</reason-for-low-priority>

<preferred-direction>
Review a composable before adding a Vue component:

```ts
const {
  items,
  page,
  pageCount,
  totalItems,
} = useDataIterator({
  items: () => source.value,
  page,
  itemsPerPage,
  sort,
  filter,
})
```

Most behavior is nonvisual and does not inherently require DOM, slots, M3 tokens or component lifecycle. A renderless component is justified only if template-first scoped-slot DX proves materially better.
</preferred-direction>

<candidate-scope>
Pure typed item transformation: filtering, stable single/multi sorting, pagination, page clamping/reset policy and metadata. It may be shared by card grids, lists and `MTable` client mode. Selection, rendering, loading/error UI and persistence remain outside.
</candidate-scope>

<architecture-to-decide>
- Composable-only versus optional renderless component facade.
- Client transformation versus server/query-state mode.
- Sort descriptors, comparators and locale-aware string policy.
- Filter contract and whether fuzzy scoring is ever built in.
- Controlled page/items-per-page/sort/filter models.
- Page reset/clamp rules when source/filter/page size changes.
- Stable item identity and immutable input/output policy.
- Integration boundary with `MTable`, `MPagination` and remote `useFetch` data.
- Whether an established headless data engine is preferable to custom utilities.
</architecture-to-decide>

<non-goals>
- no fetching, caching or server record store;
- no table/list/card markup;
- no selection registry;
- no Pinia store;
- no input mutation;
- no loading/error/empty presentation ownership.
</non-goals>

<reuse>
Shared future sort/filter/pagination descriptors, `MTable` query contracts, `MPagination` and Vue computed state. Do not duplicate a full table/data-grid engine.
</reuse>

<promotion-gate>
Promote after at least two non-table collections and the table family require the same transformation/query behavior. Approve client/server boundaries and composable-vs-component form before final API planning.
</promotion-gate>

