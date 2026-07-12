# OtpField

<identity>
Vuetify: `VOtpField` · Target: private visual `OtpField` · Parent: `MOtpInput/OtpGroup` · Phase: 2 · Type: deterministic presentation leaf, not form input
</identity>

<problem>
Каждая позиция кода должна показывать empty/filled/active/masked/error states и реагировать на click, но отдельный native input создаст лишний tab stop, нарушит autofill/paste и продублирует aggregate model.
</problem>

<solution>
`OtpField` — passive cell, генерируемая parent по index. Она читает readonly context, отображает character/mask и делегирует click в `context.focus(index)`. Registration, v-model и input listeners отсутствуют, потому что количество/order полностью определяет `length`.
</solution>

<context-contract>
```ts
interface OtpFieldState {
  index: number
  position: number
  character: string
  filled: boolean
  active: boolean
  masked: boolean
  disabled: boolean
  readonly: boolean
  invalid: boolean
}
```

State вычисляется parent/context: `character = characters[index] ?? ''`, `active = focused && activeIndex===index`. Leaf не пишет context напрямую, кроме вызова focus action.
</context-contract>

<dom-semantics>
Default root — presentation span/div с `aria-hidden="true"`. Он не получает tabindex, role textbox, aria-label позиции или native name. Pointer handler допустим для caret placement; keyboard handler отсутствует, потому что keyboard focus всегда на единственном native input.

Если overlay input покрывает визуальный ряд и сам принимает pointer, parent вычисляет clicked index по geometry; если cells принимают click, они вызывают focus(index). Выбирается один механизм, двойной handler не допускается.
</dom-semantics>

<rendering>
```text
empty   → placeholder/no glyph
filled  → character
masked  → default mask glyph или #mask slot
active  → focus indicator/caret treatment
error   → error outline/state
disabled→ disabled emphasis
```

Mask меняет только visual content. Actual code остаётся в native input/model. Default mask glyph не hardcodeится в CSS pseudo-content; приходит из parent normalized mask policy.
</rendering>

<slots>
Parent `#field` получает полный `OtpFieldState` и default rendering helpers. Parent `#mask` вызывается внутри filled masked field:

```ts
interface OtpMaskSlot {
  index: number
  position: number
  active: boolean
  filled: true
  disabled: boolean
}
```

Slot позволяет `MIcon`, `MShape`, SVG/custom component. По умолчанию actual character не нужен mask slot, чтобы accidental debug/render leakage было менее вероятно; whole `#field` остаётся explicit advanced escape hatch.
</slots>

<pointer-flow>
- pointerdown предотвращает unintended text selection visual cells, но не ломает focus native input;
- click calls `context.focus(index)`;
- disabled blocks focus action;
- readonly может разрешать focus/caret selection parent input;
- touch target принадлежит всей cell/group geometry, не только glyph;
- double click не выделяет decorative text.
</pointer-flow>

<m3-ux>
Cell — M3-like outlined/filled code container с ясным active indicator. Filled не означает selected. Error/focus/disabled colors идут из tokens. Mask custom content наследует currentColor и не обязано знать theme. Motion между states короткое и reduced-motion safe.
</m3-ux>

<styles>
```scss
$tokens: (
  md-otp-field: (
    container: (
      size: ...,
      shape: ...,
      empty: (...),
      filled: (...),
      active: (...),
      error: (...),
      disabled: (...),
    ),
    character: (...),
    mask: (...),
  ),
);
```

All states nested, `material-map()`/`g()`, `1rem = 1px макета`; no literal sizes/colors or runtime state variables.
</styles>

<reuse>
OTP context, parent focus action, MIcon/MShape through slots/default composition, shared typography/shape tokens. Не использовать MTextField, потому что cell не является input; не создавать registry/model/focus graph.
</reuse>

<edge-cases>
- index beyond changed length → leaf unmounts, no stale state;
- surrogate/grapheme alphanumeric input: normalization policy parent defines one accepted unit; v1 ASCII alphanumeric avoids split ambiguity;
- mask slot async/custom component must remain decorative;
- active last cell when caret is at full-code end;
- error + active priority both remain visible;
- readonly vs disabled click behavior.
</edge-cases>

<tests>
- derived empty/filled/active/error/disabled/readonly states;
- actual vs boolean/string/custom mask rendering;
- MIcon/MShape mask slot and no accidental character prop;
- click caret focus delegation and disabled;
- no native input/tabindex/duplicate accessibility;
- active/error combined state;
- length change unmount;
- token map covers all visual states and reduced motion.
</tests>

<done>
Cell является полноценной самодостаточной visual specification, но не вторым form control: aggregate code, caret, autofill и accessibility остаются у единственного parent input.
</done>

<questions></questions>
