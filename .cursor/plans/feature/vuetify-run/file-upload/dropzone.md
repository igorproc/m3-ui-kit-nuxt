# FileUploadDropzone

<identity>
Vuetify: `VFileUploadDropzone` · Target: private `FileUploadDropzone` · Parent: `MFileUpload` · Phase: 2 · Type: sub-component registered in upload master-context
</identity>

<problem>
Drag-and-drop должен быть равноценным способом добавить файлы, а не второй независимой реализацией file selection. Наивный dropzone часто дублирует accept/size/count validation, создаёт собственный hidden input, мигает при переходах над дочерними DOM-узлами и позволяет browser открыть dropped файл вместо приложения.
</problem>

<user-jobs>
- Перетащить один или несколько файлов в понятную область.
- Увидеть, что drop сейчас допустим и область активна.
- Получить ту же validation/rejection обратную связь, что при native picker.
- Открыть picker кнопкой или клавиатурой, если drag недоступен.
- Использовать custom presentation, не переписывая add-files logic.
</user-jobs>

<solution>
Private leaf занимается только HTML Drag and Drop lifecycle. Он strict-injects `FileUploadContext`, registers participant role `dropzone`, преобразует `DataTransfer.files` в `File[]` и вызывает master-context `addFiles(files, 'drop')`. Policy, model и queue находятся у родителя.
</solution>

<context-contract>
```ts
interface FileUploadDropzoneRegistration {
  role: 'dropzone'
  element: Readonly<Ref<HTMLElement | null>>
}

interface FileUploadDropzoneTicket {
  id: string
  role: 'dropzone'
  index: Readonly<Ref<number>>
  unregister: () => void
}
```

Setup lifecycle:

```ts
const upload = useFileUploadContext<TResult>()
const root = useTemplateRef<HTMLElement>('root')
const ticket = upload.register({ role: 'dropzone', element: root })

onScopeDispose(ticket.unregister)
```

Missing parent — development error с указанием использования внутри `MFileUpload`. Несколько dropzones допустимы: например compact top target и empty-state target; все отправляют данные в один context.
</context-contract>

<state>
```ts
interface FileUploadDropzoneState {
  isDragging: Readonly<Ref<boolean>>
  dragDepth: Readonly<Ref<number>>
  disabled: Readonly<ComputedRef<boolean>>
  readonly: Readonly<ComputedRef<boolean>>
  canDrop: Readonly<ComputedRef<boolean>>
}
```

Dropzone не хранит accepted/rejected files. Результат `addFiles` может использоваться только для immediate announcement/emit path parent context.
</state>

<drag-flow>
1. `dragenter`: проверить, что payload содержит Files; увеличить nesting depth.
2. Первый valid enter включает `isDragging`.
3. `dragover`: `preventDefault()` только для file payload и выставить допустимый drop effect.
4. `dragleave`: уменьшить depth; выключить state только при возврате к нулю.
5. `drop`: всегда очистить depth/state, предотвратить browser navigation, snapshot File[], вызвать `upload.addFiles(files, 'drop')`.
6. `dragend`, scope dispose и window blur очищают stale visual state.

Counter нужен потому, что `dragleave` срабатывает при переходе pointer между descendants и без него вызывает flicker.
</drag-flow>

<payload-policy>
- использовать стандартный `DataTransfer.files` в v1;
- non-file drag не активирует UI;
- empty FileList не вызывает add;
- directories/DataTransferItem.webkitGetAsEntry traversal не поддерживаются;
- dropped directory/recoverable unsupported item попадает в structured rejection `unsupported` только если browser предоставляет различимый item; иначе игнорируется;
- component не читает file bytes и не создаёт object URLs.
</payload-policy>

<picker-parity>
Default dropzone включает `MButton`, вызывающий `upload.openPicker()`. Это открывает primary participant `MFileInput`; dropzone не рендерит второй hidden native input. Enter/Space на root либо кнопке используют тот же action. Если primary picker ещё не registered, action no-op и dev diagnostic принадлежит master-context.
</picker-parity>

<slots>
Parent `#dropzone` получает:

```ts
interface FileUploadDropzoneSlot {
  isDragging: boolean
  canDrop: boolean
  disabled: boolean
  readonly: boolean
  accept?: string
  maxFiles?: number
  maxSize?: number
  openPicker: () => void
}
```

Default presentation содержит `MIcon`, supporting constraints text и `MButton`. Whole slot replacement получает behavior state/actions; consumer отвечает за visible instructions и keyboard target, но не получает raw policy mutation.
</slots>

<keyboard-a11y>
- root является group/region с label, не fake button, если внутри уже есть MButton;
- Enter/Space behavior принадлежит visible button; если custom root сам интерактивен, slot consumer применяет props;
- active drag state не сообщается live на каждый dragenter descendant;
- drop result/rejections анонсирует parent aggregate live region один раз;
- accepted formats/limits доступны текстом, не только цветом/icon;
- disabled/readonly remove drop affordance and keyboard action.
</keyboard-a11y>

<m3-ux>
Default surface использует M3 outline/surface roles. Idle, hover, dragging, rejection feedback и disabled — отдельные token states. Dragging не имитирует focus-visible; keyboard focus остаётся на настоящей кнопке. Reduced motion отключает декоративное scale/pulse.
</m3-ux>

<styles>
Co-located family map:

```scss
$tokens: (
  md-file-upload-dropzone: (
    container: (
      min-height: ...,
      padding: ...,
      shape: ...,
      outline: (...),
      dragging: (...),
      disabled: (...),
    ),
    icon: (...),
    text: (...),
    actions: (...),
  ),
);
```

Button/icon own states не копируются. Все values через `material-map()`/`g()`, `1rem = 1px макета`; raw hardcoded colors/sizes в SFC запрещены.
</styles>

<reuse>
Upload master-context, shared `useFileSelection/createFilePolicy` только через `addFiles`, registered primary `MFileInput`, `MButton`, `MIcon`, lifecycle-safe event helpers. Не создавать policy, queue, transport, native input или global store.
</reuse>

<edge-cases>
- nested children drag flicker;
- drop outside после enter;
- window loses focus during drag;
- same files dropped repeatedly → duplicate policy parent;
- mixed accepted/rejected batch remains atomic per shared selection result;
- disabled changes while dragging clears state;
- dropzone conditional unmount unregisters without touching queue;
- multiple custom dropzones share state only through files/queue, not local dragging flags.
</edge-cases>

<tests>
- strict context injection and missing-parent diagnostic;
- role registration/index and `onScopeDispose` unregister;
- multiple dropzones;
- nested dragenter/leaves without flicker;
- file vs non-file payload;
- prevent browser navigation on valid drop;
- picker parity/no second input;
- accept/size/count/duplicate result delegated to context;
- directory/empty payload policy;
- disabled/readonly changes and scope cleanup;
- default/custom slot keyboard/a11y;
- SCSS map/state coverage.
</tests>

<done>
Dropzone является полностью доступным drag adapter над единым upload master-context: он не владеет files, validation, native picker, queue или transport и безопасно регистрируется/снимается вместе со своим scope.
</done>

<questions></questions>
