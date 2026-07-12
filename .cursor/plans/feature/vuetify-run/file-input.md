# MFileInput

<identity>Vuetify: `VFileInput` · Target: `MFileInput` · Phase: 2 · Type: public field wrapper over `MTextField`</identity>

<problem>Native file input возвращает `FileList`, но плохо вписывается в M3 field UI. При этом новый компонент не должен копировать label, variants, helper/error и focus states уже готового `MTextField`.</problem>

<solution>`MFileInput` — надстройка над public `MTextField`: computed filename display передаётся в readonly text field, hidden native `input[type=file]` остаётся источником File objects, а browse/clear actions композируются через button family.</solution>

<composition>
```text
MFileInput
├── MTextField
│   ├── filled/outlined, label
│   ├── helper/error/validation
│   └── prepend/append/value slots
├── hidden native input[type=file]
├── MButton / MButtonIcon
└── shared createFilePolicy
```

Не извлекать/копировать field chrome внутри FileInput.
</composition>

<upload-context-mode>
Standalone `MFileInput` не требует parent. Внутри `MFileUpload` он optional injects upload master-context, registers participant role `picker` и unregisters через `onScopeDispose`. Native selection вызывает context `addFiles(..., 'picker')`, поэтому picker/dropzone используют одну reactive selection. Второй hidden input/model запрещён.
</upload-context-mode>

<models>
```ts
const model = defineModel<File | File[] | null>({ default: null })
const focused = defineModel<boolean>('focused', { default: false })
```

Single/multiple props дают Volar overloads `File|null` vs `File[]`. Fake path/display string никогда не выходит model.
</models>

<api>
Shared field props берутся через `makeMTextFieldProps`, file-specific:

```ts
interface MFileInputProps {
  accept?: string
  multiple?: boolean
  capture?: boolean | 'user' | 'environment'
  maxFiles?: number
  maxSize?: number
  showSize?: boolean
  clearable?: boolean
}
```

Public readonly запрещает picker; внутренний `MTextField` всегда получает readonly, потому что filenames не редактируются вручную.
</api>

<display>
Computed display:

- empty → placeholder;
- one file → filename (+ formatted size when enabled);
- multiple small set → joined names;
- long set → localized `Выбрано файлов: N`.

`#selection` заменяет value content для chips/custom summary, но не меняет File model.
</display>

<native-input>
- реальный hidden `input[type=file]` принимает accept/multiple/capture/required/name;
- visible MButton вызывает `.click()` только из user action;
- перед open native value очищается для повторного выбора того же файла;
- clear сбрасывает model и native value;
- external File model отображается, но не записывается обратно в native input;
- disabled/readonly блокируют open.
</native-input>

<policy>
Shared `createFilePolicy({ accept, maxFiles, maxSize })` используется здесь и `MFileUpload`. Rejected files не входят model; emit `reject` содержит file и structured reasons type/size/count. Browser accept — hint, не security validation; server обязан проверить повторно.
</policy>

<slots>
- `selection`: files/defaultText;
- `browse`: whole MButton default с props/open;
- `clear`: whole MButtonIcon default с props/clear;
- `actions`: при необходимости заменяет action cluster;
- `prepend`, `helper`, `error` forwarded/composed через MTextField.

Whole-control slots получают safe props/actions; custom replacement отвечает за button/a11y semantics.
</slots>

<reuse>`MTextField` напрямую, `MButton`, `MButtonIcon`, shared file policy и file-size formatter. Не копировать text-field template/tokens, не создавать upload queue, object URLs или drag listeners.</reuse>

<styles>File-input tokens только для selection/actions layout. Field/button colors/states не копируются. Nested map, `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>Keyboard focus на visible browse action; label/helper/error через MTextField; rejection анонсируется один раз; same-file reselection работает; compact input не показывает preview/chip queue по умолчанию.</ux>

<tests>MTextField prop forwarding/value slot; single/multiple model typing; native picker/clear/same file; accept/size/count policy; readonly/disabled; whole slots; filenames/sizes; reject ARIA; SSR shell.</tests>

<done>File selection использует готовый MTextField UI и возвращает только File data, добавляя минимальную native/policy надстройку без upload responsibilities.</done>

<questions></questions>
