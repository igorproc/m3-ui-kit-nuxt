# ColorPickerPreview

<identity>Vuetify: `VColorPickerPreview` · Target: private `ColorPickerPreview` · Parent: `MColorPicker` · Phase: 2 · Type: sub</identity>

<implementation-status state="done" updated="2026-07-14">
Private context-only preview renders formatted value and alpha checkerboard
without mutable state; all design values are token-resolved.
</implementation-status>

<problem>Пользователь должен видеть итоговый цвет и реальную прозрачность, включая white/black/transparent extremes, без дополнительного mutable state.</problem>

<solution>Private passive leaf читает formatted value/RGBA/HSVA из parent context и показывает текущий цвет на checkerboard. Before/after comparison не входит: transactional snapshot/Apply/Cancel принадлежит dialog/form consumer.</solution>

<api>
Context-only state:

```ts
interface ColorPickerPreviewState {
  value: string
  cssColor: string
  rgba: Readonly<RGBA>
  hsva: Readonly<HSVA>
  alphaPercent: number
}
```

`isLight`/binary contrast hint не экспортируется: threshold спорен и навязывает presentation decision. Default outline рассчитывается private contrast utility.
</api>

<composition>Child `MColorPicker`, default implementation parent `#preview`. It injects the same required master `MColorPickerContext` and derives its passive preview projection; собственного v-model, context, emits и parser нет.</composition>

<reuse>Parent color context и shared contrast utility только для default outline. Clipboard/button functionality не входит; consumer при необходимости добавляет `MButtonIcon` в parent slot.</reuse>

<styles>Nested preview `$tokens`: dimensions, shape, outline, checkerboard, value label layout. Chosen color приходит dynamic CSS value; design values через `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>
- checkerboard всегда под цветом;
- white/black/transparent сохраняют видимую границу;
- рядом доступно formatted text и alpha percentage;
- root пассивный: нет tabindex/click/hover state;
- screen reader получает единое normalized color description без двойного чтения decorative layers.
</ux>

<dx>Parent `#preview` получает только конкретные color values/alpha и не получает спорную light/dark классификацию. Custom consumer самостоятельно выбирает contrast strategy.</dx>

<tests>Opaque/partial/transparent rendering, white/black outline, checkerboard, formatted/alpha text, accessible description, no interaction/state, parent slot props without isLight.</tests>

<done>Preview честно показывает текущий color/alpha без mutable state, transactional semantics и навязанной бинарной contrast-классификации.</done>

<questions></questions>
