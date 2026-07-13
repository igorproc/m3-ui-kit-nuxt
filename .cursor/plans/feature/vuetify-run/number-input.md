# MNumberInput

<identity>
Vuetify: `VNumberInput` · Target: `MNumberInput` · Phase: 2 · Type: public numeric field
</identity>

<implementation-status state="done" updated="2026-07-14">
Public component, locale-aware codec, split/stacked button-family controls,
focused tests and docs_v2 page are present.
</implementation-status>

<problem>
`MTextField type="number"` остаётся string field и наследует непоследовательные browser steppers/parsing. Пользователь редактирует временную строку (`-`, `1,`, empty), но business model должен получать только конечный `number | null`, никогда `NaN`.
</problem>

<solution>
Отдельный `MNumberInput` с внутренним string draft, locale-aware pure number codec и explicit commit boundary. Field chrome переиспользуется из `MTextField`; increment/decrement defaults используют `MButtonIcon → MButton`, а whole-control slots остаются advanced escape hatch.
</solution>

<models>
```ts
const model = defineModel<number | null>({ default: null })
const focused = defineModel<boolean>('focused', { default: false })
```

Draft — private string state, не третий model. Ручные update emits не объявляются.
</models>

<api>
```ts
type NumberInputControls = 'split' | 'stacked' | false

interface MNumberInputProps {
  min?: number
  max?: number
  step?: number
  precision?: number
  locale?: string
  useGrouping?: boolean
  controls?: NumberInputControls
  clamp?: boolean

  disabled?: boolean
  readonly?: boolean
  required?: boolean
  label?: string
  placeholder?: string
  helperText?: string
  variant?: 'filled' | 'outlined'
  path?: string
  name?: string
  error?: boolean
  errorMessage?: string
  autofocus?: boolean
}
```

Defaults: `step: 1`, `controls: 'split'`, `clamp: true`, `useGrouping: true`. Currency/percent formatting не входит в v1; model всегда обычное decimal number.
</api>

<draft-commit>
- завершённый parseable draft обновляет model сразу;
- incomplete draft (`''`, `'-'`, `'12,'`) сохраняется визуально, model остаётся последним valid value;
- blur: empty → null; valid → precision normalization и optional min/max clamp; invalid → восстановить committed display и emit invalid;
- Escape восстанавливает committed draft;
- unfocused display форматируется, focused display остаётся editable без grouping/affixes;
- external model update не перезаписывает dirty focused draft; source/version marker предотвращает watcher loops.
</draft-commit>

<native-input>
Использовать `type="text"` + `inputmode="numeric|decimal"`, не native number input. Это позволяет locale separator, incomplete drafts, controlled steppers и исключает browser wheel mutation. IME parsing откладывается до compositionend.
</native-input>

<locale-codec>
Pure `createNumberCodec()` строит decimal/group/minus symbols через `Intl.NumberFormat.formatToParts`, строго парсит draft и форматирует display/editable forms. Locale resolution deterministic для SSR: explicit prop → будущий kit locale context → configured default; `navigator.language` не меняет initial hydration output.
</locale-codec>

<precision-step>
- `step > 0`;
- precision выводится из step либо берётся explicit;
- decimal scaling/string arithmetic исключает floating drift (`0.1 + 0.2`);
- increment/decrement clamps min/max независимо от blur policy;
- null step action сначала устанавливает `min ?? 0`, затем следующие actions двигают значение;
- controls disabled at corresponding boundary.
</precision-step>

<controls>
Default split layout:

```text
[ MButtonIcon − ] [ numeric input ] [ MButtonIcon + ]
```

Default controls обязаны переиспользовать button family:

```text
MButtonIcon
└── MButton
    ├── semantic button/type
    ├── disabled/loading
    ├── ripple
    ├── focus-visible
    └── M3 state layers
```

Не создавать native button вручную и не копировать button tokens. `type="button"` предотвращает form submit.

`stacked` размещает два полноразмерных `MButtonIcon` вертикально и позволяет
field вырасти по высоте. Touch target не ужимается локальными overrides.
</controls>

<control-slots>
Whole-control slots оборачивают safe defaults:

```vue
<slot
  name="decrement"
  :props="decrementButtonProps"
  :step="decrement"
>
  <MButtonIcon
    v-bind="decrementButtonProps"
    @click="decrement"
  >
    <MIcon name="remove" />
  </MButtonIcon>
</slot>
```

```ts
interface NumberControlSlot {
  props: {
    type: 'button'
    disabled: boolean
    ariaLabel: string
  }
  value: number | null
  nextValue: number
  step: () => void
}
```

Slots: `decrement`, `increment`, `prepend`, `append`, `helper`, `error`.

Consumer, заменяющий whole control, обязан применить `props`, сохранить semantic button/focus/touch target и вызвать `step`. Docs показывают default-content customization через собственный `MButtonIcon`, чтобы консистентность оставалась очевидной.
</control-slots>

<keyboard>
- ArrowUp/ArrowDown: ±step;
- PageUp/PageDown: ±step×10;
- Home/End: min/max, если определены;
- Enter: commit/format без blur;
- Escape: restore committed draft;
- wheel не изменяет value;
- clipboard/caret shortcuts сохраняются;
- composition-safe parsing.
</keyboard>

<clamp-validation>
`clamp=true` применяется на blur и step actions, не на каждый промежуточный символ (иначе `min=10` мешает набрать `12`). `clamp=false` сохраняет out-of-range number, позволяя validation показать ошибку. Pending validation plan подключается позднее; v1 использует текущий field integration.
</clamp-validation>

<emits>
```ts
interface MNumberInputEmits {
  (event: 'increment', value: number): void
  (event: 'decrement', value: number): void
  (event: 'invalid', draft: string, reason: NumberInputInvalidReason): void
}
```

Model/focused updates идут только через defineModel.
</emits>

<a11y>
Input получает spinbutton semantics (`role`, `aria-valuemin/max/now/text`) поверх text input. Default control labels локализованы. Disabled/readonly отличаются; helper/error ids идут через shared field. Slots не снимают ответственность component за input semantics, но whole-button replacement ответственность явно передаёт consumer.
</a11y>

<m3-ux>
Field filled/outlined chrome общий с `MTextField`. Default buttons используют MButton state layers/touch targets. Number-input-own tokens описывают только control placement, dividers и input layout. Numeric alignment не навязывается.
</m3-ux>

<styles>
Nested `$tokens` map:

```scss
$tokens: (
  md-number-input: (
    container: (...),
    input: (...),
    controls: (
      split: (...),
      stacked: (...),
      divider: (...),
    ),
  ),
);
```

Не объявлять button colors/states. Все own values через `material-map()`/`g()`, `1rem = 1px макета`, без literal component values/runtime state variables.
</styles>

<reuse>
Private shared field chrome, current field validation bridge, `MButtonIcon`/`MButton`, `MIcon`, pure shared number codec. Не создавать второй button/numeric parser и не использовать watcher loops.
</reuse>

<tests>
- defineModel number|null/focused, no NaN;
- incomplete/valid/empty/invalid draft lifecycle;
- locale decimal/group/minus and SSR deterministic display;
- precision/step floating drift, min/max/clamp/null base;
- default MButtonIcon controls and disabled boundaries;
- whole-control slots receive/apply props/action;
- keyboard, wheel, IME, paste;
- external model while focused/dirty;
- field validation/helper/error ARIA;
- split и distinct stacked layouts.
</tests>

<done>
Числовое поле хранит чистый numeric model, допускает естественное редактирование draft и получает консистентные M3 controls из button family с advanced whole-control slots.
</done>

<questions></questions>
