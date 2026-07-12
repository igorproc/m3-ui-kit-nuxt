# ColorPickerCanvas

<identity>Vuetify: `VColorPickerCanvas` · Target: private `ColorPickerCanvas` · Parent: `MColorPicker` · Phase: 2 · Type: sub</identity>

<problem>Picker нужен точный двухмерный saturation/value control. Pointer и keyboard должны менять один parent color state, не создавая собственный model/parser и не включая hue/alpha.</problem>

<solution>Private canvas leaf читает HSVA из `MColorPicker` context и изменяет только S/V. Hue и alpha остаются отдельными `MSlider` controls родителя. Public auto-import/v-model не создаётся.</solution>

<api>
```ts
interface ColorPickerCanvasContext {
  hsva: Readonly<Ref<HSVA>>
  disabled: Readonly<Ref<boolean>>
  setSaturation: (value: number) => void
  setValue: (value: number) => void
  commit: () => void
}
```
Setters clamp `0…1` в parent context. Canvas не форматирует external model.
</api>

<composition>Child `MColorPicker`; parent `#canvas` replacement получает HSVA, disabled, setters и commit. Default leaf импортируется явно and injects the required master `MColorPickerContext`; the smaller interface above is its projected dependency subset, not a separately provided context.</composition>

<reuse>Parent HSVA context, shared color conversions, `useRaf`, pointer helpers и scope cleanup. Hue/alpha переиспользуют `MSlider`; parser/model не дублируются.</reuse>

<styles>Nested canvas `$tokens`: aspect/dimensions, shape, thumb size/outline/shadow, focus/disabled. Dynamic hue gradient допустим как вычисляемый CSS color, не design token. Все значения через `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>
- pointerdown capture и immediate S/V update;
- pointermove RAF-limited;
- pointerup/cancel освобождает capture и вызывает один commit;
- coordinates clamp по актуальному bounding rect;
- cleanup через `onScopeDispose`;
- Left/Right меняют saturation, Up/Down value, Shift увеличивает step, Home/End идут к границе;
- focusable thumb сообщает composite `aria-valuetext`: saturation, value и итоговый color;
- disabled блокирует pointer/keyboard.
</ux>

<dx>Canvas не принимает v-model. Точные отдельные channels доступны через `ColorPickerEdit`; canvas остаётся быстрым visual control только S/V.</dx>

<tests>Corner/resize coordinate mapping, pointer capture/cancel/cleanup, RAF coalescing, single commit, keyboard mapping, disabled, composite aria-valuetext, parent synchronization.</tests>

<done>Canvas даёт эквивалентные pointer/keyboard S/V interactions через один HSVA context; hue, alpha, parsing и external formatting остаются вне leaf.</done>

<questions></questions>
