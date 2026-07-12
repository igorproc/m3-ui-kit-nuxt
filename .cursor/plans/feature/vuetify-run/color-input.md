# MColorInput

<identity>
Vuetify: `VColorInput` · Target: `MColorInput` · Phase: 2 · Type: public compact field-trigger · Status: planned with mandatory pre-implementation review
</identity>

<review-gate>
**Обязательно повторно обсудить перед реализацией.** Нужно подтвердить, что готовая form-обёртка действительно нужна после утверждения/реализации `MColorPicker`, и что composition не лучше оставить документированным рецептом `MTextField + MButtonIcon + MMenu/MOverlay + MColorPicker`.

Если roadmap выполняется в автономном режиме без доступного человека для review, `MColorInput` **пропускается**, не считается blocker всей фазы и не реализуется по предположениям. Возврат к нему происходит после human confirmation.
</review-gate>

<problem>
В формах настройки темы, категории, календаря или графика полноценный color picker слишком велик для постоянного layout. Нужен компактный field, который показывает/принимает конкретное цветовое значение, визуализирует swatch и по запросу открывает общий `MColorPicker`, не заставляя consumer вручную повторять parsing, overlay, focus restore и alpha preview.
</problem>

<solution>
`MColorInput` — специализированная field-trigger композиция по принципу dropdown:

```text
MColorInput
├── private MField/MTextField chrome
├── text draft + color codec
├── swatch trigger
│   └── MButtonIcon → MButton
├── MMenu / future MOverlay
└── MColorPicker
```

Он не является leaf внутри picker. `MColorPicker` использует собственные private edit controls, иначе возникнет recursive composition.
</solution>

<visual-model>
```text
┌──────────────────────────────────┐
│ Основной цвет        #6750A4  ● │
└──────────────────────────────────┘
                              ↓ click
                    ┌─────────────────┐
                    │  MColorPicker   │
                    │  canvas         │
                    │  hue / alpha    │
                    │  edit fields    │
                    │  swatches       │
                    └─────────────────┘
```
</visual-model>

<models>
```ts
const model = defineModel<string | null>({ default: null })
const open = defineModel<boolean>('open', { default: false })
const focused = defineModel<boolean>('focused', { default: false })
```

Text draft остаётся private. Model/open/focused updates идут только через `defineModel`, без ручных update emits.
</models>

<api>
```ts
type ColorFormat = 'hex' | 'rgb' | 'hsl'

interface MColorInputProps {
  format?: ColorFormat | 'auto'
  formats?: ColorFormat[]
  commit?: 'change' | 'input'

  picker?: boolean
  swatches?: readonly ColorSwatch[]
  clearable?: boolean

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
}
```

`ColorFormat` совпадает с picker: `hex|hexa|rgb|rgba|hsl|hsla`. Defaults: `format: 'hex'`, все шесть formats, `commit: 'change'`, `picker: true`, `clearable: false`.

Не добавлять untyped `pickerProps`; глубокая customization проходит через typed picker slot.
</api>

<format-policy>
Explicit format всегда нормализует committed model в выбранную family. `format="auto"` определяет family при ручном commit и сохраняет её для последующих picker changes; если family ещё неизвестна, fallback hex.

Default hex обеспечивает предсказуемый model contract. Alpha capability определяется suffix format (`hexa/rgba/hsla`), отдельного boolean prop нет. Переход alpha → opaque повторяет picker policy: alpha сбрасывается до 1 и в dev выдаётся единичный `console.warn`.
</format-policy>

<draft-commit>
- incomplete text остаётся draft и не загрязняет model;
- default `commit='change'`: text commits на Enter/blur, picker changes live-update model;
- `commit='input'`: каждое полностью valid draft значение обновляет model;
- Escape восстанавливает committed formatted value;
- invalid blur восстанавливает committed display и emits invalid;
- empty + clearable → null; empty без clearable восстанавливается;
- paste/IME проходят тот же codec, parsing только после compositionend;
- external invalid model не исправляется молча и переводит field в explainable error state.
</draft-commit>

<trigger>
Default whole-control slot с safe button-family fallback:

```vue
<slot
  name="picker-trigger"
  :props="pickerButtonProps"
  :color="model"
  :open="openPicker"
>
  <MButtonIcon
    v-bind="pickerButtonProps"
    @click="openPicker"
  >
    <slot name="swatch" v-bind="swatchState">
      <span class="m-color-input__swatch" />
    </slot>
  </MButtonIcon>
</slot>
```

`picker-trigger` заменяет всю кнопку, `swatch` — только content. Whole-control replacement получает `type`, disabled, `aria-label`, `aria-haspopup`, `aria-expanded` и action; consumer обязан сохранить button/a11y/touch semantics.
</trigger>

<picker-slot>
```ts
interface ColorPickerSlot {
  value: string | null
  parsed: MColor | null
  format: ColorFormat
  supportsAlpha: boolean
  update: (value: string) => void
  close: () => void
  clear: () => void
}
```

Default slot content — `MColorPicker` с согласованными format/alpha/swatches. Custom picker не получает untyped prop bag.
</picker-slot>

<overlay>
Default desktop presentation — anchored `MMenu`/popover с общим overlay stack, outside/Escape dismissal и focus restore. Responsive dialog/bottom-sheet presentation не решается локально до обсуждения `MColorPicker/MOverlay`; consumer может заменить picker slot/composition. `MColorInput` не создаёт собственный teleport, z-index или modal engine.
</overlay>

<codec>
Одна pure shared utility парсит/форматирует color input и picker edit fields. Canonical boundary state — RGBA:

```ts
interface MColor {
  r: number
  g: number
  b: number
  a: number
}
```

HSL/HSV вычисляются conversion utilities, а не хранятся параллельно в mutable object.

V1 formats: short/full HEX with optional alpha, modern/legacy RGB, modern/legacy HSL. Не поддерживать named colors, CSS variables, currentColor, lab/lch/oklab/oklch/display-p3: picker редактирует конкретный resolved color, а не cascade expression.
</codec>

<slots>
- `picker-trigger` whole control;
- `swatch` inner preview;
- `picker` picker content;
- `prepend`, `helper`, `error` shared field content.

Swatch slot props: color string, safe CSS color, parsed RGBA, alpha, light/dark contrast hint. Default swatch использует checkerboard и contrast outline.
</slots>

<emits>
```ts
interface MColorInputEmits {
  (event: 'invalid', draft: string, reason: ColorParseError): void
  (event: 'change', value: string | null): void
  (event: 'clear'): void
  (event: 'open'): void
  (event: 'close'): void
}
```

Update events models не дублируются.
</emits>

<a11y-ux>
- swatch не является единственным сообщением значения; trigger label содержит текст текущего color;
- transparent/white сохраняют видимый outline/checkerboard;
- readonly позволяет select/copy text, но picker не открывает;
- disabled блокирует field/trigger;
- invalid draft сохраняется до commit boundary для исправления;
- focus после overlay возвращается trigger;
- button and field keyboard semantics переиспользуются.
</a11y-ux>

<styles>
Color-input nested `$tokens` map содержит только swatch size/shape/outline/checkerboard, trigger placement и family-specific draft layout. Shared field/button/picker state tokens не копируются. Все values через `material-map()`/`g()`, `1rem = 1px макета`, без raw hex fallback color и runtime component-state variables.
</styles>

<reuse>
Private shared field/MTextField chrome, `MButtonIcon → MButton`, `MMenu/MOverlay`, `MColorPicker`, shared color codec. Не создавать recursive picker/input relation, собственный overlay или parallel parser.
</reuse>

<tests>
- mandatory review gate присутствует в execution plan/checklist;
- defineModel value/open/focused;
- hex/rgb/hsl explicit/auto formatting;
- alpha accept/reject without loss;
- draft Enter/blur/Escape/input modes;
- default trigger and whole-control/swatch slots;
- picker round-trip/open/close/focus restore;
- invalid external model;
- readonly/disabled/clearable;
- checkerboard/contrast/a11y labels;
- SSR parser/display and overlay hydration.
</tests>

<done>
После повторного human confirmation compact color field безопасно round-trip-ит concrete color и открывает общий picker как dropdown-like overlay composition, не дублируя field/button/overlay/picker infrastructure.
</done>

<questions>
Перед реализацией повторно решить: нужен ли public wrapper; default picker presentation; exact MColorPicker API; достаточно ли документированной ручной композиции вместо компонента.
</questions>
