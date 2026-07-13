# MColorPicker

<identity>
Vuetify: `VColorPicker` · Target: `MColorPicker` · Phase: 2 · Type: public visual editor with private leaves
</identity>

<implementation-status state="done" updated="2026-07-14">
Public component, one shared HSVA context, context-only private leaves,
zero-runtime design tokens and focused integration/leaf behavior tests are present.
</implementation-status>

<problem>
Visual color selection требует синхронизировать saturation/value canvas, hue/alpha sliders, textual channels, preview и swatches. Если каждый leaf хранит локальный color state или parser, значения расходятся, а pointer и keyboard paths дают разный результат.
</problem>

<solution>
`MColorPicker` владеет одним reactive HSVA context и string model выбранного format. Private Canvas/Edit/Preview/Swatches leaves читают/изменяют только context. Снаружи model остаётся CSS-ready строкой; structured state доступен slots/context.
</solution>

<formats>
```ts
type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
```

Alpha не является отдельным boolean prop. Возможность прозрачности определяется format:

- opaque: `hex`, `rgb`, `hsl`;
- alpha: `hexa`, `rgba`, `hsla`.

Современный slash syntax используется внутри rgba/hsla formatting, но explicit names сохраняют понятный API capability.
</formats>

<models>
```ts
const model = defineModel<string | null>({ default: null })
const format = defineModel<ColorFormat>('format', { default: 'hex' })
```

Ручные update emits не объявляются.
</models>

<api>
```ts
interface MColorPickerProps {
  formats?: ColorFormat[]
  swatches?: readonly ColorSwatch[]
  disabled?: boolean
  hideCanvas?: boolean
  hideInputs?: boolean
  hidePreview?: boolean
  hideSwatches?: boolean
}
```

Default formats: `['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla']`. Format selector скрывается, если доступен один format.
</api>

<state>
Canonical internal interactive state:

```ts
interface HSVA {
  h: number
  s: number
  v: number
  a: number
}
```

```text
external string
      ↓ shared parse
     HSVA context
 ┌────┼──────────────┐
Canvas Hue Alpha Edit Preview Swatches
 └────┼──────────────┘
      ↓ shared format
external string
```

RGBA/HSL values вычисляются pure conversions. Не хранить несколько mutable color representations.
</state>

<context>
The parent creates and provides one typed master context. This is the only shared committed/interacting color state used by Canvas, Edit, Preview and Swatches:

```ts
interface MColorPickerContext {
  hsva: Readonly<Ref<HSVA>>
  rgba: Readonly<ComputedRef<RGBA>>
  value: Readonly<ComputedRef<string | null>>
  cssColor: Readonly<ComputedRef<string>>
  format: WritableComputedRef<ColorFormat>
  formats: Readonly<ComputedRef<readonly ColorFormat[]>>
  disabled: Readonly<ComputedRef<boolean>>
  valid: Readonly<ComputedRef<boolean>>
  parseError: Readonly<ComputedRef<ColorParseError | null>>
  setHSVA: (value: HSVA) => void
  setHue: (value: number) => void
  setSaturation: (value: number) => void
  setValue: (value: number) => void
  setAlpha: (value: number) => void
  setRGBA: (value: RGBA) => void
  setFormat: (value: ColorFormat) => void
  selectColor: (value: string) => boolean
  commit: (reason: ColorCommitReason) => void
  reportInvalid: (draft: string, reason: ColorParseError) => void
}

type ColorCommitReason = 'pointer' | 'keyboard' | 'edit' | 'swatch'
```

Create the pair with the canonical context helper under a family-specific key. `MColorPicker` calls provide once; every default private leaf uses the required inject helper and throws a clear family error outside the parent. Whole-block slots receive readonly state and safe actions projected from this same context rather than a second object/state implementation.

Setters clamp/normalize at the parent boundary and synchronously update the external formatted model. `commit` emits the current formatted value but does not create a snapshot. Edit-only incomplete drafts remain local to Edit and never enter context until valid commit. Swatch roving tickets remain local view registry state; they select through `selectColor`. All registrations/listeners clean up with `onScopeDispose`.
</context>

<format-switch>
Format switch не меняет hue/saturation/value, только external representation. Переход alpha → opaque при `a < 1` разрешён и устанавливает `a = 1`.

Это осознанная потеря данных, поэтому development build вызывает единичный понятный `console.warn`, содержащий old/new format и факт сброса alpha. Production не показывает modal/confirmation и не блокирует действие. Повторный render не должен спамить warning; он возникает только на user/programmatic format transition.
</format-switch>

<composition>
```text
MColorPicker
├── ColorPickerCanvas (S/V)
├── Hue slider
├── Alpha slider (alpha formats only)
├── ColorPickerPreview
├── ColorPickerEdit
└── ColorPickerSwatches
```

Leaves private/sub and explicitly imported. Public auto-imports для них не создаются.
</composition>

<slots>
- `canvas`: HSVA + setters + disabled;
- `controls`: hue/alpha states and setters;
- `preview`: color string, CSS color, RGBA/HSVA, contrast hint;
- `inputs`: format, channel values, commit/revert;
- `swatches`: palette, selected state, select;

Slot replacement сохраняет parent state ownership; leaf не получает независимый v-model.
</slots>

<interaction>
- canvas pointer drag updates model live через RAF-limited context setter;
- canvas keyboard arrows дают equivalent saturation/value path;
- hue/alpha используют `MSlider`, если gradient track/thumb slots можно переиспользовать без форка;
- edit fields сохраняют incomplete draft до Enter/blur, Escape reverts;
- swatches используют keyboard grid navigation и selection registry;
- disabled блокирует pointer, keyboard и textual commits;
- `change` emit происходит на pointer release, keyboard commit, edit commit или swatch select; continuous model всё равно live.
</interaction>

<emits>
```ts
interface MColorPickerEmits {
  (event: 'change', value: string | null): void
  (event: 'invalid', draft: string, reason: ColorParseError): void
}
```
</emits>

<swatches>
```ts
type ColorSwatch = string | {
  value: string
  label: string
}
```

Labelled object даёт лучший accessible name; string fallback использует normalized color text. Selection проходит через тот же HSVA setter/model formatting path, не пишет model напрямую.
</swatches>

<codec>
Shared pure codec поддерживает HEX/HEXA, modern+legacy RGB(A), HSL(A). Named colors, CSS variables, currentColor и advanced color spaces не входят в v1: picker редактирует конкретный resolved color. Invalid external model не заменяется выдуманным цветом; picker показывает error state и ждёт valid input/swatch action.
</codec>

<a11y-ux>
- canvas имеет two-dimensional slider semantics с текстовым текущим color;
- hue/alpha имеют accessible range labels/values;
- pointer и keyboard дают одинаковый reachable диапазон;
- preview содержит текстовое имя, цвет не является единственным сигналом;
- white/transparent видимы через outline/checkerboard;
- swatches — keyboard grid с selected state;
- reduced motion не влияет на точность/feedback.
</a11y-ux>

<m3-ux>
Picker является M3-like surface, но overlay ему не принадлежит: standalone usage не создаёт menu/dialog. Format selector переиспользует `MButtonSegmented`/selection foundation, hue/alpha — `MSlider`, edit — shared field family, actions — `MButton`. Не копировать их state tokens.
</m3-ux>

<styles>
Root `components/color-picker/_index.scss` владеет layout/surface/spacing; leaves владеют nested maps своих визуальных ролей. Все через `material-map()`/`g()`, `1rem = 1px макета`, без raw component colors. Dynamic chosen color допустим только как inline CSS value/gradient input, не как design token.
</styles>

<reuse>
Shared color codec and the single provided `MColorPickerContext`, `MSlider`, `MButtonSegmented/MButton`, shared field/MNumberInput where applicable, selection/roving registry. Не создавать overlay, второй parser или parallel leaf state/context.
</reuse>

<tests>
- defineModel value/format;
- all formats parse/format roundtrip;
- alpha controls based on format, not prop;
- alpha→opaque resets to 1 and emits one dev console warning;
- leaf synchronization through one HSVA context;
- continuous model vs change commits;
- disabled, invalid external model;
- pointer/keyboard equivalent ranges;
- swatch grid/labels, preview contrast;
- slots preserve context ownership;
- SSR initial parsing/hydration.
</tests>

<done>
Canvas, controls, edit, preview and swatches синхронизированы через один HSVA source; external model остаётся format-controlled string, а alpha capability явно определяется форматом.
</done>

<questions></questions>
