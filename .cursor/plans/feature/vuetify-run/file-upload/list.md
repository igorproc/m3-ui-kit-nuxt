# FileUploadList

<identity>
Vuetify: `VFileUploadList` · Target: private `FileUploadList<TResult>` · Parent: `MFileUpload` · Phase: 2 · Type: registered collection leaf
</identity>

<problem>
Queue list должна сохранять порядок entries, empty/aggregate state, item customization и предсказуемый focus после удаления. Если custom list получает mutable queue internals, он может обойти scheduler и разрушить lifecycle.
</problem>

<user-jobs>
- Просмотреть все выбранные/загружаемые файлы в стабильном порядке.
- Увидеть empty и aggregate progress/status.
- Использовать default items либо заменить item rendering.
- После удаления продолжить keyboard работу без потери focus.
</user-jobs>

<solution>
List strict-injects master-context, registers `role:'list'`, читает readonly entry ids и рендерит `FileUploadItem`. Каждый item самостоятельно registers свою role; list не создаёт duplicate tickets и не мутирует entries.
</solution>

<registration>
```ts
interface FileUploadListRegistration {
  role: 'list'
  element: Readonly<Ref<HTMLElement | null>>
}

const upload = useFileUploadContext<TResult>()
const ticket = upload.register({ role: 'list', element: root })
onScopeDispose(ticket.unregister)
```

Несколько list views технически допустимы (например compact + details), но каждый item rendering создаёт отдельный view-ticket с unique participant id и тем же entryId. Queue entry при этом один.
</registration>

<data-contract>
```ts
interface FileUploadListState<TResult> {
  entries: readonly Readonly<FileUploadEntry<TResult>>[]
  total: number
  queued: number
  uploading: number
  success: number
  failed: number
  aggregateProgress: number | null
  isUploading: boolean
  isComplete: boolean
}
```

Aggregates computed в queue/context, а не пересчитываются независимо каждым custom list.
</data-contract>

<ordering>
- default order — acceptance order;
- status transition не reorder;
- retry сохраняет position;
- remove compacts view indices;
- future explicit reorder должен идти через queue action, не DOM drag local state;
- keyed rendering использует stable entry.id, никогда array index.
</ordering>

<rendering>
Default:

```vue
<FileUploadItem
  v-for="entry in entries"
  :key="entry.id"
  :entry-id="entry.id"
/>
```

Empty state рендерится только при zero entries; selection rejection не создаёт phantom item. TransitionGroup допустим при reduced-motion policy и не должен задерживать queue disposal.
</rendering>

<slots>
```ts
interface FileUploadListSlots<TResult> {
  default(state: FileUploadListState<TResult>): unknown
  item(props: FileUploadItemSlot<TResult>): unknown
  empty(state: FileUploadListState<TResult>): unknown
  header(state: FileUploadListState<TResult>): unknown
  footer(state: FileUploadListState<TResult>): unknown
}
```

Default slot не меняет смысл в зависимости от items: group-level content один раз; `#item` per entry; `#empty` zero queue. Custom item получает readonly entry/actions, не controllers/transport.
</slots>

<focus-recovery>
Перед remove participant registry запоминает current item/ticket and focused descendant role. После DOM update:

1. focus same action следующего visible item;
2. иначе предыдущего item;
3. иначе list header/actions;
4. иначе dropzone/picker action.

Если removal вызван pointer и focus не находился внутри removed item, focus не перемещается насильно. Multiple list views recover только внутри той view, где был focus.
</focus-recovery>

<aggregate-announcements>
Один parent/list live region сообщает meaningful transitions: file added/rejected, upload started, completed/failed, all complete. Progress percentages не объявляются на каждый tick. Custom lists не создают дополнительные live regions по умолчанию.
</aggregate-announcements>

<a11y>
- semantic list (`ul/li` либо role list/listitem при custom root);
- item count/status summary доступен;
- empty text не маскирует rejection/error;
- visual ordering = DOM ordering;
- list itself не focusable без active-descendant use case;
- reduced motion for insertion/removal.
</a11y>

<m3-ux>
Default list композирует existing MList/MListItem, если contracts позволяют status/actions/progress без overrides. Dividers/gaps/empty surface используют file-upload tokens. Queue-level actions используют MButton family.
</m3-ux>

<styles>
Nested list map: container gap/padding, divider, header/footer/empty, insertion/removal motion. Item/button/progress tokens не копируются. `material-map()`/`g()`, `1rem = 1px макета`.
</styles>

<reuse>
Master-context aggregate projections, participant registry, FileUploadItem, MList/MListItem, MEmptyState where appropriate. Никакой validation/selection/transport/scheduler logic.
</reuse>

<edge-cases>
- queue changes during transition;
- same entry shown in multiple views;
- custom item filtered out while task lives;
- remove last focused entry;
- bulk clearCompleted;
- thousands of entries: virtualization is later explicit integration, not silent list behavior;
- SSR starts with empty/nonserializable File queue shell; client-owned entries do not hydrate from serialized Files.
</edge-cases>

<tests>
- strict context/list registration/onScopeDispose;
- stable order across statuses/retry;
- add/remove/clear and no index keys;
- default item self-registration, no duplicate list tickets;
- group/default/item/empty slot semantics;
- aggregate projections and announcements;
- pointer vs keyboard focus recovery and multiple lists;
- semantic list/a11y/reduced motion;
- custom item cannot mutate readonly entries;
- large list baseline and SSR shell.
</tests>

<done>
List самодостаточно описывает readonly queue presentation, slots, ordering, aggregates и focus lifecycle; selection/upload mechanics остаются строго в master-context foundations.
</done>

<questions></questions>
