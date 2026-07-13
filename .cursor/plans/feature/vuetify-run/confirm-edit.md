# MConfirmEdit

<identity>
Vuetify: `VConfirmEdit` · Target: `MConfirmEdit<T>` · Phase: 2 · Type: public adaptive editor + shared transaction foundation
</identity>

<implementation-status state="done" updated="2026-07-14">
Public adaptive editor and reusable transaction composable cover isolated
drafts, async save, external conflicts, dirty dismissal, focused tests and docs.
</implementation-status>

<problem>
Подтверждаемое редактирование почти всегда живёт во временной surface: короткое изменение — anchored popover, сложная форма — dialog. Один renderless draft helper заставил бы consumer каждый раз заново соединять clone/dirty/conflict/async save с activator, overlay, actions, dismiss guard и focus restore.
</problem>

<user-jobs>
- Открыть редактор из понятного activator.
- Изменять изолированный draft без мутации committed object.
- Сохранить sync/async и закрыть surface только после успеха.
- Явно отменить или защититься от случайного outside/Escape закрытия dirty draft.
- Использовать compact popover или полноценный dialog с тем же transaction contract.
- Заменить editor/actions/error presentation через slots.
- Переиспользовать transaction logic в programmatic `$modals` flow.
</user-jobs>

<solution>
`MConfirmEdit` объединяет internal `useConfirmEditTransaction<T>` и adaptive host:

```text
MConfirmEdit
├── activator slot
├── useConfirmEditTransaction
│   ├── clone/compare
│   ├── draft/dirty/conflict
│   └── async save/cancel/reset
├── presentation
│   ├── popover → MOverlay mode=popover + role=dialog surface
│   └── dialog  → MDialog
└── MButton actions + slots
```

`MMenu` не используется: menu role/keyboard model предназначены для списка команд, а не arbitrary form editor.
</solution>

<models>
```ts
const model = defineModel<T>()
const open = defineModel<boolean>('open', { default: false })
```

Draft создаётся/синхронизируется при opening lifecycle. Model/open updates — только defineModel.
</models>

<api>
```ts
type ConfirmEditPresentation = 'auto' | 'popover' | 'dialog'
type DirtyCloseBehavior = 'confirm' | 'prevent' | 'discard'

interface MConfirmEditProps<T> {
  presentation?: ConfirmEditPresentation
  dirtyCloseBehavior?: DirtyCloseBehavior

  clone?: (value: T) => T
  compare?: (draft: T, committed: T) => boolean
  save?: (
    draft: T,
    committed: T,
  ) => T | void | Promise<T | void>

  disabled?: boolean
  title?: string
  saveText?: string
  cancelText?: string
  discardTitle?: string
  discardText?: string
}
```

Defaults: `presentation:'auto'`, `dirtyCloseBehavior:'confirm'`, shared clone/deep-equality, localized action/discard texts.
</api>

<transaction-foundation>
```ts
interface ConfirmEditTransaction<T> {
  draft: Readonly<Ref<T>>
  committed: Readonly<ComputedRef<T>>
  dirty: Readonly<ComputedRef<boolean>>
  saving: Readonly<Ref<boolean>>
  conflicted: Readonly<Ref<boolean>>
  error: Readonly<Ref<unknown>>

  setDraft: (value: T) => void
  patchDraft: (patch: Partial<T>) => void
  save: () => Promise<boolean>
  cancel: () => void
  reset: () => void
  sync: () => void
}
```

Composable не создаёт DOM/overlay/store. Его используют public MConfirmEdit и custom programmatic dialog implementations.
</transaction-foundation>

<clone-equality>
- default clone использует shared deep-clone policy/`structuredClone` where supported;
- non-cloneable class/function/proxy values требуют explicit clone и dev diagnostic;
- входной committed object никогда не мутируется draft editor;
- default shared deep equality определяет dirty для plain data;
- custom compare поддерживает domain normalization;
- clone/compare errors не проглатываются и не открывают editor с shared reference.
</clone-equality>

<presentation>
`popover`: anchored к activator, nonmodal overlay infrastructure, content surface имеет dialog semantics/focus policy. Подходит коротким edits.

`dialog`: `MDialog` с focus trap/scrim. Подходит large forms.

`auto`: responsive policy из shared breakpoint/presentation utility; wide → popover, narrow → dialog. Переключение presentation во время открытого dirty edit сохраняет один transaction instance и корректно переносит focus, не пересоздаёт draft.
</presentation>

<activator>
```ts
interface ConfirmEditActivatorSlot {
  props: {
    ariaHaspopup: 'dialog'
    ariaExpanded: boolean
    ariaControls: string
    disabled: boolean
  }
  open: () => void
  close: () => Promise<boolean>
  isOpen: boolean
}
```

Consumer применяет props к MButton/MListItem/etc. Opening snapshot/clone выполняется до editor render. Focus после close возвращается activator через shared overlay runtime.
</activator>

<editor-slot>
```ts
interface ConfirmEditEditorSlot<T> {
  draft: T
  committed: T
  dirty: boolean
  saving: boolean
  conflicted: boolean
  error: unknown
  setDraft: (value: T) => void
  patchDraft: (patch: Partial<T>) => void
  save: () => Promise<boolean>
  cancel: () => void
  reset: () => void
  sync: () => void
}
```

`#editor` является обязательным content slot; default universal JSON/form renderer не создаётся.
</editor-slot>

<actions>
Default actions используют MButton:

```text
[Отмена text] [Сохранить filled]
```

- Save disabled when !dirty/disabled/saving/conflicted policy;
- loading on save button;
- Cancel explicit discard не требует второго confirm;
- whole `#save`, `#cancel`, `#actions` slots получают safe button props/actions;
- actions остаются внутри editor focus boundary.
</actions>

<save-flow>
```text
editing
  ↓ save
saving
  ├── success → commit → dirty false → close
  └── error   → preserve draft/open → error slot
```

- без save callback commit draft;
- callback returns T → commit returned normalized value;
- returns void → commit draft after success;
- Promise reject не мутирует model и не закрывает;
- repeated save blocked while pending;
- close/cancel during save default prevented; explicit future abort belongs callback contract and is not assumed.
</save-flow>

<external-conflict>
Когда external model меняется:

- editor closed → next open uses new committed;
- editor open and clean → sync draft automatically;
- editor open and dirty → preserve draft, update committed reference, set `conflicted=true`;
- `sync()` discards draft and adopts external;
- `cancel()` returns to newest committed;
- `save()` while conflicted is disabled by default to prevent blind overwrite; custom action may intentionally resolve/force through domain save callback after explicit UX.

Default conflict message/slot explains external change; no silent draft loss.
</external-conflict>

<dirty-close>
Close requests: activator toggle, outside, Escape, overlay/programmatic route.

- clean → close;
- explicit Cancel → discard/reset and close;
- dirty + `prevent` → stay open;
- dirty + `discard` → reset and close;
- dirty + `confirm` → `$modals.confirm` nested through same overlay stack.

Default confirm:

```text
Отменить изменения?
Несохранённые изменения будут потеряны.
[Продолжить редактирование] [Отменить изменения]
```

Nested confirmation result reason handled deterministically; parent editor stays mounted underneath. If `$modals` unavailable due custom root setup, shared modal service is still expected from kit plugin; no local confirm implementation.
</dirty-close>

<keyboard>
MConfirmEdit не навешивает global useHotkey и не превращает Enter/Escape редактора в универсальные commands:

- Escape приходит overlay dismiss request и проходит dirty-close policy;
- Enter внутри textarea remains newline;
- form/editor может вызвать save на submit;
- buttons provide native keyboard semantics;
- popover/dialog focus management belongs MOverlay/MDialog.
</keyboard>

<programmatic-use>
Для one-off programmatic forms рекомендуется custom editor dialog через `$modals.open()`, использующий `useConfirmEditTransaction`. Public activator-oriented MConfirmEdit не обязан искусственно монтировать activator в programmatic flow.

Оба пути сходятся в one transaction foundation and overlay/modal service; parallel draft implementations запрещены.
</programmatic-use>

<slots>
- `activator`;
- `title`;
- `editor`;
- `actions`;
- `save`, `cancel` whole controls;
- `error` receives unknown + retry/save;
- `conflict` receives draft/committed/sync resolution;
- `discard-confirm` optional content customization if modal service supports slots.
</slots>

<emits>
```ts
interface MConfirmEditEmits<T> {
  (event: 'save', value: T): void
  (event: 'cancel', committed: T): void
  (event: 'open'): void
  (event: 'close'): void
  (event: 'error', error: unknown): void
  (event: 'conflict', external: T, draft: T): void
}
```

Model/open updates не дублируются.
</emits>

<a11y-ux>
- activator wiring/return focus;
- editor surface labelled title, role dialog for both presentations;
- saving aria-busy, errors associated/announced once;
- dirty is not announced on every keystroke; close attempt surfaces clear confirmation;
- conflict is explicit and actionable;
- popover editor remains keyboard reachable and does not use role menu;
- responsive auto preserves logical content/focus.
</a11y-ux>

<styles>
Transaction foundation no styles. MConfirmEdit tokens only editor popover surface/layout/actions/error/conflict placement; MDialog/MButton states not copied. Nested map through `material-map()`/`g()`, `1rem=1px макета`. Dialog appearance belongs MDialog.
</styles>

<reuse>
`MOverlay`, `MDialog`, `$modals.confirm`, MButton family, breakpoint utility, shared clone/equality helpers. Не использовать MMenu semantics, global hotkeys, Pinia or duplicate modal/draft engine.
</reuse>

<edge-cases>
- object clone failure/circular values;
- external update clean vs dirty;
- async save resolve after attempted close/unmount;
- presentation changes at breakpoint while open;
- nested discard confirmation;
- activator unmount before close → focus nearest safe ancestor;
- model null/undefined/generic arrays;
- custom compare considers normalized values equal;
- route/unmount while dirty follows app navigation policy, component scope cleanup cannot block browser navigation itself.
</edge-cases>

<tests>
- generic primitive/object/array model and no input mutation;
- clone/compare customization/failures;
- activator ARIA/open/focus return;
- popover/dialog/auto responsive without draft loss;
- default MButton actions and whole slots;
- sync/async save success/normalize/error/re-entry;
- clean/external dirty conflict and resolution;
- dirty close confirm/prevent/discard, nested modal stack;
- Escape/textarea Enter/form submit boundaries;
- programmatic transaction reuse;
- disabled/saving/error/conflict a11y;
- SSR closed/open controlled hydration and scope cleanup.
</tests>

<done>
MConfirmEdit закрывает полный adaptive edit flow: activator, isolated transaction, popover/dialog host, MButton actions, async save, external conflict и защищённое dirty dismissal на общей overlay/modal infrastructure.
</done>

<questions></questions>
