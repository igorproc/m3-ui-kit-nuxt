# ColorPickerSwatches

<identity>Vuetify: `VColorPickerSwatches` · Target: private `ColorPickerSwatches` · Parent: `MColorPicker` · Phase: 2 · Type: sub</identity>

<problem>Приложению может понадобиться быстрый выбор брендовых/preset цветов, но picker не должен навязывать случайную универсальную palette или обходить единый HSVA state.</problem>

<solution>Private optional swatch grid рендерится только при переданном `swatches`, нормализует colors через shared codec и выбирает их через parent context. Без prop секция отсутствует полностью.</solution>

<api>
```ts
type ColorSwatch = string | {
  value: string
  label: string
  disabled?: boolean
}

interface ColorSwatchGroup {
  label?: string
  colors: readonly ColorSwatch[]
}
```

Parent принимает flat palette или groups. Default `swatches: undefined`; встроенной M3/general palette нет.
</api>

<composition>Child `MColorPicker`, default implementation parent `#swatches`. It injects the required master `MColorPickerContext`; its selection/roving registry is view-local and commits through `selectColor`. `#swatch` меняет content semantic button; `#swatches` заменяет весь block с a safe projection of the same typed context.</composition>

<selection>
- equality по normalized RGBA, не input string;
- select обновляет parent HSVA, затем active format model;
- transparent swatch недоступен в opaque format, чтобы не терять alpha;
- disabled/invalid swatches пропускаются; invalid input даёт dev warning с индексом/group без raw render crash;
- selection registry/roving focus используются вместо local selected array.
</selection>

<reuse>Parent HSVA context, shared color codec, selection/roving registry и button semantics. Не создавать palette default, local parser/model или listener на каждый swatch.</reuse>

<styles>Nested swatch `$tokens`: responsive grid columns/gap, swatch size/shape, checkerboard, selected/focus/disabled outline. Dynamic chosen colors не design tokens. Все layout values через `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>
- semantic button per swatch with generated/explicit accessible name;
- arrows move grid focus, Home/End row, Ctrl+Home/End whole palette;
- Enter/Space select;
- disabled skipped;
- group labels доступны;
- white/transparent остаются видимы через internal contrast outline/checkerboard без exported `isLight`.
</ux>

<dx>Consumer передаёт только domain palette. Для theme-derived palette позже возможна отдельная `createM3Swatches(theme)` utility, но picker не импортирует её и не генерирует colors сам.</dx>

<tests>No-prop renders no section; flat/group palettes; RGBA equality; alpha/opaque policy; invalid/disabled; keyboard grid; labels; slots; parent model/context synchronization.</tests>

<done>Swatches являются полностью opt-in быстрым путем к тому же HSVA state и не навязывают palette, parser или selection implementation.</done>

<questions></questions>
