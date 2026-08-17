# MOtpInput

<identity>Vuetify: `VOtpInput` · Target: `MOtpInput` · Phase: 2 · Type: public orchestrator · Family: `otp-input/`</identity>

<implementation-status state="done" updated="2026-07-14">
Public aggregate native input, caret-aware segmented presentation, Unicode
normalization, grouping/masking, completion events, focused tests and docs are present.
</implementation-status>

<problem>One-time code требует segmented visual UI, но несколько настоящих inputs ухудшают SMS autofill, paste, screen reader navigation и создают сложный focus graph.</problem>

<solution>Один native input владеет aggregate string/caret/autofill; private OtpField cells только визуализируют characters/active state. OtpGroup/Separator управляют layout без model/focus logic.</solution>

<user-jobs>
- Ввести код вручную с physical/mobile keyboard.
- Вставить код целиком либо принять SMS/password-manager autofill.
- Исправить любую позицию обычным caret/backspace, не переходя между шестью tab stops.
- Понять длину, заполненность и ошибку кода.
- Визуально сгруппировать или замаскировать символы без изменения отправляемого значения.
- Полностью заменить appearance cells/mask/separator, сохранив native input semantics.
</user-jobs>

<models>
```ts
const model = defineModel<string>({ default: '' })
const focused = defineModel<boolean>('focused', { default: false })
```

Array model и ручные update emits запрещены.
</models>

<api>
```ts
interface MOtpInputProps {
  length?: number
  mode?: 'numeric' | 'alphanumeric'
  groups?: number[]
  separator?: string
  mask?: boolean | string
  disabled?: boolean
  readonly?: boolean
  autofocus?: boolean
  label?: string
  error?: boolean
  errorMessage?: string
  path?: string
}
```

Defaults: `length: 6`, `mode: 'numeric'`, no groups, `mask: false`.
</api>

<native-input>
Один `input[type=text]` с `autocomplete="one-time-code"`; numeric mode использует inputmode numeric/pattern, alphanumeric — text. Input остаётся единственным focusable/accessible form control, визуально интегрирован/скрыт без удаления из accessibility tree.

Input нельзя делать `display:none`, `visibility:hidden` или `aria-hidden`: это ломает autofill/focus/AT. Допустим visually-transparent/overlay approach с сохранением caret APIs. DOM input содержит реальный model, visual cells имеют `aria-hidden` content.
</native-input>

<caret-mapping>
`selectionStart` является active cell index, clamp `0…length-1`; при caret в конце полного code активна последняя cell. Click/tap по cell вызывает parent `focus(index)` и после focus `setSelectionRange(index,index)`.

Selection range из нескольких characters не создаёт несколько active cells: визуально активна start position, следующий input заменяет native selection стандартным browser behavior. Programmatic model change сохраняет caret, если index остаётся допустим, иначе clamp в конец.
</caret-mapping>

<normalization>
- model max length clamp;
- numeric принимает цифры и нормализует распространённые Unicode decimal digits в ASCII;
- invalid characters фильтруются и emits invalid;
- alphanumeric не меняет регистр автоматически;
- paste обрабатывается одной batch normalization;
- IME не commit до compositionend.
</normalization>

<groups>
`groups=[3,3]` при length 6 создаёт две OtpGroup и separator. Сумма обязана совпадать с length; invalid config даёт dev warning и flat fallback. Без groups separators отсутствуют.
</groups>

<context>
```ts
interface OtpContext {
  value: Readonly<ComputedRef<string>>
  characters: Readonly<ComputedRef<string[]>>
  activeIndex: Readonly<Ref<number>>
  length: Readonly<ComputedRef<number>>
  disabled: Readonly<ComputedRef<boolean>>
  readonly: Readonly<ComputedRef<boolean>>
  focus: (index?: number) => void
  clear: () => void
}
```

Context предоставляется через createContext; отдельный field registry не нужен, потому что cells детерминированы length и parent generation.
</context>

<mask>
Mask изменяет только visual cells, model/native input сохраняют настоящий code.

- `mask=true` использует default bullet;
- string mask использует заданный символ/content text;
- `#mask` slot заменяет mask content и позволяет `MIcon`, `MShape` или custom composition;
- slot вызывается только для заполненной masked cell;
- mask content декоративен и hidden от screen reader, который работает с единым input.

```vue
<template #mask="{ index, active, filled }">
  <MIcon name="circle" />
</template>
```
</mask>

<slots>
- `field`: visual cell content/root customization state;
- `mask`: masked filled content;
- `group`: group presentation;
- `separator`: visual separator.

Semantic native input не заменяется slots.
</slots>

<interaction>
- native caret/backspace/arrows/paste;
- click cell вызывает focus(index)+setSelectionRange;
- cells не входят tab order;
- completion emit только при transition incomplete→complete; после удаления и нового completion повторяется;
- clear возвращает empty code/focus policy;
- readonly допускает selection/copy, disabled блокирует.
</interaction>

<events>
```ts
interface MOtpInputEmits {
  (event: 'complete', value: string): void
  (event: 'invalid', input: string, rejected: string[]): void
  (event: 'clear'): void
}
```

Completion определяется transition `previousLength < length && nextLength === length`, не watch на каждую render. Autofill/paste вызывает один complete. Изменение полного code на другой полный code через selection replacement вызывает change модели, но complete policy должна быть протестирована и документирована как новый valid completion только если операция прошла через user input commit.
</events>

<validation-a11y>
Root имеет одну label/description/error связь с native input. Error state отражается на всех visual cells, но `aria-invalid` находится на input. Supporting error не повторяется per cell. Numeric keyboard hints не заменяют validation: form/server проверяет code. Pending verification/loading не входит OTP input и принадлежит submit action/form.
</validation-a11y>

<ssr-hydration>
SSR рендерит native input и детерминированные empty/initial cells из string model без browser APIs. Autofocus выполняется только client browser API с нормальным lifecycle. SMS autofill events проходят обычный input path после hydration. Генерируемые ids стабильны через `useId`.
</ssr-hydration>

<edge-cases>
- length меняется: model clamp, groups revalidate, caret clamp;
- empty/zero/negative length → dev warning + safe minimum;
- paste содержит spaces/hyphens: v1 фильтрует non-allowed chars, не интерпретирует separator как model;
- browser autofill отдаёт весь code одним event;
- composition, selection replacement, undo/redo;
- readonly позволяет focus/select/copy, но input mutation откатывается native/readOnly;
- custom mask component не получает настоящий character, если это не требуется contract; slot получает state и index, а actual character можно передавать только осознанно для custom visual.
</edge-cases>

<reuse>Native input, current field validation conventions, createContext, MIcon/MShape only through defaults/slots. Не создавать multi-input focus registry или array model.</reuse>

<styles>Root/group/field/separator nested token maps. Field state tokens cover empty/filled/active/error/disabled; mask content uses currentColor/slot. `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<tests>Single accessible native input; numeric Unicode/alphanumeric; paste/truncate/IME/undo/selection replacement; caret/cell click/end/full mapping; length changes; groups config; completion transitions/autofill once; boolean/string/custom MIcon/MShape mask slot; disabled/readonly/error; label/describedby; autofill attributes; SSR ids/hydration/autofocus.</tests>

<done>OTP вводится одним доступным/autofill-friendly native control, а segmented/grouped/masked presentation остаётся полностью customizable без multi-input desync.</done>

<questions></questions>
