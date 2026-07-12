# MFileUpload

<identity>Vuetify: `VFileUpload` · Target: `MFileUpload` · Phase: 2 · Type: public orchestrator · Family: `file-upload/`</identity>

<problem>Picker, dropzone, queue list и item actions работают с одним набором файлов. Если validation/add/transport lifecycle оставить в SFC leaves, появятся разные accept rules, progress states и AbortControllers.</problem>

<solution>`MFileUpload` — thin UI orchestrator над двумя вынесенными reactive foundations: `useFileSelection` для добавления/отклонения File objects и `useFileUploadQueue<TResult>` для queue/transport lifecycle. UI family только предоставляет context и default M3 rendering.</solution>

<architecture>
```text
useFileSelection
├── createFilePolicy
├── addFiles(File[])
├── deduplicate
└── structured rejections

useFileUploadQueue<TResult>
├── reactive entries
├── concurrency scheduler
├── progress/status/result
├── AbortController
└── start/cancel/retry/remove

MFileUpload
├── MFileInput (one native picker)
├── FileUploadDropzone
├── FileUploadList
│   └── FileUploadItem
└── provided upload context
```

Ни один leaf не содержит selection/upload logic.
</architecture>

<models>
```ts
const model = defineModel<File[]>({ default: () => [] })
```

Model содержит только File data. Runtime entries не загрязняют application model и доступны readonly через context/slots/expose.
</models>

<entry>
```ts
interface FileUploadEntry<TResult = unknown> {
  id: string
  file: File
  status: 'queued' | 'uploading' | 'success' | 'error' | 'cancelled'
  progress: number | null
  error: unknown
  result?: TResult
}
```

Entries — единый internal reactive source of truth `useFileUploadQueue`, не отдельные leaf refs.
</entry>

<api>
```ts
interface MFileUploadProps<TResult> {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  upload?: (file: File, context: FileUploadTaskContext) => Promise<TResult>
  autoStart?: boolean
  concurrency?: number
  disabled?: boolean
  readonly?: boolean
}

interface FileUploadTaskContext {
  signal: AbortSignal
  reportProgress: (progress: number) => void
}
```

Defaults: `autoStart: false`, `concurrency: 3`. Component не знает URL/headers/storage/backend.
</api>

<selection-foundation>
`useFileSelection` используется `MFileInput` и upload context. Picker/dropzone вызывают один `addFiles(files, source)`:

- shared accept/maxFiles/maxSize policy;
- duplicate key по name+size+lastModified+type;
- rejected не входят model/queue;
- structured reasons type/size/count/duplicate;
- batch result добавляет accepted atomically;
- browser accept не считается security validation.
</selection-foundation>

<queue-foundation>
`useFileUploadQueue<TResult>` не рендерит DOM и не зависит от M-компонентов:

```ts
interface UseFileUploadQueueReturn<TResult> {
  entries: Readonly<Ref<readonly FileUploadEntry<TResult>[]>>
  isUploading: Readonly<ComputedRef<boolean>>
  start: (id: string) => Promise<void>
  startAll: () => Promise<void>
  cancel: (id: string) => void
  cancelAll: () => void
  retry: (id: string) => Promise<void>
  remove: (id: string) => void
  clearCompleted: () => void
}
```

- scheduler соблюдает concurrency;
- reportProgress принимает 0…1, null означает indeterminate;
- remove uploading сначала abort;
- promise settlement после abort не меняет removed entry;
- все active tasks abort через `onScopeDispose`;
- persistence/store не создаются.
</queue-foundation>

<file-input-reuse>
`MFileUpload` содержит один `MFileInput` и вызывает exposed `open/clear`. Dropzone/open buttons делегируют ему native picker; второй hidden input запрещён. Presentation MFileInput может быть скрыта/заменена upload slots, но selection path остаётся один.
</file-input-reuse>

<context>
`MFileUpload` создаёт единый master-context для всего семейства через `createContext/createTrinity`: picker/input, dropzone, list, item и action controls inject один facade. Context request-safe, без Pinia и без прямой передачи mutable arrays/controllers.

```ts
interface FileUploadContext<TResult> {
  entries: Readonly<Ref<readonly FileUploadEntry<TResult>[]>>
  isUploading: Readonly<ComputedRef<boolean>>
  disabled: Readonly<ComputedRef<boolean>>
  readonly: Readonly<ComputedRef<boolean>>

  addFiles: (files: readonly File[], source: 'picker' | 'drop') => FileSelectionResult
  openPicker: () => void

  getEntry: (id: string) => Readonly<Ref<FileUploadEntry<TResult> | undefined>>
  register: (registration: FileUploadParticipantRegistration) => FileUploadParticipantTicket<TResult>

  start: (id: string) => Promise<void>
  cancel: (id: string) => void
  retry: (id: string) => Promise<void>
  remove: (id: string) => void
}
```

```ts
type FileUploadParticipantRole
  = 'picker' | 'dropzone' | 'list' | 'item' | 'actions'

type FileUploadParticipantRegistration
  = FileUploadPickerRegistration
    | FileUploadDropzoneRegistration
    | FileUploadListRegistration
    | FileUploadItemRegistration
    | FileUploadActionsRegistration
```

`register()` не создаёт queue entry. Queue создаёт entries из accepted File[]; participant registry связывает rendered family nodes/capabilities с master-context, DOM order, focus metadata и lifecycle.
</context>

<participant-subscription>
Каждый family participant injects context и регистрируется в собственном Vue effect scope:

```ts
const upload = useFileUploadContext<TResult>()
const ticket = upload.register({
  role: 'dropzone',
  element: rootRef,
})

onScopeDispose(ticket.unregister)
```

Role capabilities:

- `picker`: MFileInput/native picker `open`, `clear`, input element; только один primary picker, duplicate даёт dev warning;
- `dropzone`: element/isDragging/drop availability; может быть несколько custom zones;
- `list`: list element/order/focus recovery boundary;
- `item`: entryId/element/index and queue actions;
- `actions`: startAll/cancelAll/clearCompleted control cluster metadata.

Tickets отдают общие id/role/index/unregister и role-specific readonly facade. Picker/dropzone/input/list не получают локальные copies files/entries; они подписаны на master reactive context.

При удалении queue entry rendered item исчезает, scope disposal снимает item ticket. Если item/list/dropzone scope исчез раньше queue state, upload tasks продолжают жить. Уход primary picker делает `openPicker` безопасным no-op + dev diagnostic до регистрации replacement.

Parent `onScopeDispose` сначала abort/dispose queue, затем очищает item registry/context listeners. Прямой `onUnmounted` для registration cleanup не используется.
</participant-subscription>

<input-context-mode>
`MFileInput` остаётся самостоятельным компонентом, но внутри `MFileUpload` optional injects master-context:

- registers role `picker` с open/clear/native element;
- selected FileList отправляет в context `addFiles(files, 'picker')`;
- отображает общий File[] model/context selection;
- standalone вне context продолжает использовать собственный defineModel/policy;
- upload context mode не создаёт второй selection state и не требует второго hidden input.

Optional context helper не бросает missing-parent error для standalone FileInput; private upload leaves используют strict injection.
</input-context-mode>

<slots>
- `dropzone`, `list`, `item`, `empty`, `actions`, `rejection`;
- defaults используют MButton/MButtonIcon/MProgressLinear/MIcon;
- item slot получает entry + start/cancel/retry/remove;
- whole-control slots получают safe props/actions.
</slots>

<emits>
Model update через defineModel. Дополнительно: `add`, `reject`, `start`, `progress`, `success`, `error`, `cancel`, `remove`, `complete`. `complete` — нет queued/uploading entries.
</emits>

<lifecycle>
```text
selected → queued → uploading → success
                       ├──────→ error → retry
                       └──────→ cancelled
```

Queue не сохраняется между route/unmount автоматически; File нельзя надёжно сериализовать. Consumer хранит model/results снаружи при необходимости.
</lifecycle>

<reuse>`MFileInput`, shared `useFileSelection/createFilePolicy`, extracted `useFileUploadQueue`, `createContext`, MButton family, MProgressLinear, MIcon. Не создавать store, второй native input, leaf transport или duplicated policy.</reuse>

<styles>Root tokens только layout/aggregate states; dropzone/item/list имеют nested family maps. Button/progress states не копируются. `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>Picker/drop parity, explicit start by default, accessible progress/status, retry/cancel/remove, focus recovery, rejection announcement, unknown progress indeterminate. Folder traversal не входит v1.</ux>

<tests>Shared picker/drop selection; policies/dedup; File[] model vs readonly entries; scheduler/concurrency; progress clamp; abort/races/retry; master context provide/inject; picker/dropzone/list/item/actions role registration; every role unregisters through onScopeDispose; duplicate primary picker diagnostic; optional standalone FileInput context; view removal does not cancel task; focus registry ordering; context isolation/disposal; custom/default slots; keyboard/a11y; SSR queue shell.</tests>

<done>Одна selection foundation и одна upload queue обслуживают picker, dropzone, list и items; MFileUpload остаётся UI orchestrator без transport/state duplication.</done>

<questions></questions>
