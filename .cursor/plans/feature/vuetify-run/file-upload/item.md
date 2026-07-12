# FileUploadItem

<identity>
Vuetify: `VFileUploadItem` · Target: private `FileUploadItem<TResult>` · Parent: `FileUploadList/MFileUpload` · Phase: 2 · Type: registered presentation leaf
</identity>

<problem>
Каждый queue entry имеет несколько переходов и допустимых действий. Если item самостоятельно вызывает upload callback или хранит progress/status, он расходится с scheduler, переживает removal некорректно и оставляет AbortController/listeners.
</problem>

<user-jobs>
- Узнать filename, size и текущий upload status.
- Увидеть determinate или indeterminate progress.
- Запустить queued file, отменить active, повторить failed или удалить entry.
- Понять ошибку без показа raw exception.
- Кастомизировать строку, сохранив queue actions и accessibility.
</user-jobs>

<solution>
Item strict-injects master-context, registers `role:'item'` с entryId/element и получает readonly ticket. Он только отображает entry и вызывает context actions; queue state/transport остаются в `useFileUploadQueue`.
</solution>

<registration>
```ts
interface FileUploadItemRegistration {
  role: 'item'
  entryId: string
  element: Readonly<Ref<HTMLElement | null>>
}

interface FileUploadItemTicket<TResult> {
  id: string
  role: 'item'
  entryId: string
  entry: Readonly<ComputedRef<FileUploadEntry<TResult> | undefined>>
  index: Readonly<ComputedRef<number>>
  isFirst: Readonly<ComputedRef<boolean>>
  isLast: Readonly<ComputedRef<boolean>>
  start: () => Promise<void>
  cancel: () => void
  retry: () => Promise<void>
  remove: () => void
  unregister: () => void
}
```

```ts
const upload = useFileUploadContext<TResult>()
const ticket = upload.register({ role: 'item', entryId: props.entryId, element: root })
onScopeDispose(ticket.unregister)
```

Missing entry во время async removal приводит к graceful no-render/leave, не exception. View unregister не отменяет task; queue action `remove` делает abort отдельно.
</registration>

<status-machine>
```text
queued     → start available, remove available
uploading  → cancel available, progress visible
success    → remove/clear-completed available
error      → retry/remove available
cancelled  → retry/remove available
```

Disabled/readonly parent дополнительно блокирует mutation actions. Status transition принадлежит queue и не производится SFC напрямую.
</status-machine>

<progress>
- `progress: 0…1` → determinate `MProgressLinear`;
- `progress: null` → indeterminate;
- progress скрыт/complete treatment при success;
- update announcement throttled по meaningful percentage/phase, не на каждый callback;
- visual percentage может форматироваться locale utility;
- item не clamp/warn progress: это делает queue foundation до entry update.
</progress>

<default-layout>
```text
[file icon] filename.ext              [action]
            2.4 MB · Uploading 42%
            ━━━━━━━━━━━────────────
```

Leading icon определяется безопасной MIME category mapping, но не является security/type validation. Filename — основной accessible label; extension/icon не единственный сигнал.
</default-layout>

<actions>
Default actions используют button family:

- queued → MButton/MButtonIcon Start;
- uploading → Cancel;
- error/cancelled → Retry;
- non-active → Remove.

Каждый whole-control slot получает safe props/action:

```ts
interface FileUploadItemActionSlot {
  props: {
    type: 'button'
    disabled: boolean
    ariaLabel: string
  }
  entry: Readonly<FileUploadEntry>
  run: () => void | Promise<void>
}
```

Custom replacement отвечает за semantic button/touch/focus, но transport недоступен напрямую.
</actions>

<slots>
Parent/item rendering slots:

- `leading` — icon/thumbnail content (no object URL default);
- `name`, `metadata`, `status`, `progress`;
- `start`, `cancel`, `retry`, `remove` whole controls;
- `item` at parent can replace whole row using same ticket facade.

Default implementation не требует slots.
</slots>

<error-policy>
Entry хранит raw `unknown` для application diagnostics, но default UI показывает localized generic failure. Context/slot может предоставить mapped user message. Stack trace/raw server response никогда не выводится автоматически. Retry сохраняет File и создаёт новый task attempt в queue entry policy.
</error-policy>

<focus-a11y>
- root list item не становится button;
- filename не обрезается для accessible name, visual ellipsis имеет title/hidden full text;
- status text связан с row;
- progressbar получает label filename + value;
- после remove focus recovery решает list/participant registry: следующий item action, предыдущий, затем list/actions/dropzone;
- cancel/retry labels включают filename;
- success/error не выражаются только цветом.
</focus-a11y>

<m3-ux>
Использовать MListItem composition, если его layout/slots покрывают строку без token overrides; иначе private row композирует MIcon, MProgressLinear и MButton family. Status colors semantic; buttons сохраняют собственные M3 states. No per-item modal/snackbar.
</m3-ux>

<styles>
Nested item map: container spacing/divider, leading icon, filename/meta typography, status semantic treatment, progress placement. Не копировать MButton/MProgress/MListItem tokens. Все values `material-map()`/`g()`, `1rem = 1px макета`.
</styles>

<reuse>
Upload master-context/item ticket, `useFileUploadQueue` readonly entry, MListItem where possible, MIcon, MProgressLinear, MButton/MButtonIcon, file-size/status formatters. Никакой local status, upload callback или AbortController.
</reuse>

<edge-cases>
- entry removed while Promise settles;
- view filtered/unmounted while upload continues;
- filename extremely long/bidi/control characters safely rendered as text;
- zero-byte file;
- unknown MIME/progress;
- rapid retry/cancel races handled idempotently by queue;
- readonly/disabled changes mid-upload: active transport policy remains parent-defined, UI actions update reactively;
- success result type generic never stringified by default.
</edge-cases>

<tests>
- strict context and missing-parent diagnostics;
- item role register/onScopeDispose unregister;
- missing entry graceful teardown;
- every status/action availability;
- progress determinate/indeterminate/announcement throttle;
- retry/cancel/remove delegation and races;
- view disposal does not abort task;
- focus recovery metadata;
- long/unsafe filename rendering, size/MIME;
- default/whole-control slots and a11y labels;
- M3 token reuse/no duplicated states.
</tests>

<done>
Item — самодостаточный доступный renderer readonly queue entry, подписанный на master-context; lifecycle, progress и actions не создают второго transport/upload state.
</done>

<questions></questions>
