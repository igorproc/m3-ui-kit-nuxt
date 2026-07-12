# OtpSeparator

<identity>
Vuetify: `VOtpSeparator` · Target: private `OtpSeparator` · Parent: `MOtpInput` · Phase: 2 · Type: decorative presentation leaf
</identity>

<problem>
Разделитель делает длинный код читаемым, но при неправильной семантике становится лишним character, tab stop или повторно озвучивается screen reader.
</problem>

<solution>
Parent вставляет aria-hidden non-focusable leaf только между validated groups. Separator не читает/меняет OTP context и никогда не участвует в index, length, paste или caret math.
</solution>

<contract>
```ts
interface OtpSeparatorProps {
  groupBefore: number
  groupAfter: number
  value?: string
}

interface OtpSeparatorSlot {
  index: number
  groupBefore: number
  groupAfter: number
  value: string
}
```

Props internal. Default value берётся parent `separator` prop/localized visual policy. `#separator` заменяет content.
</contract>

<dom-semantics>
- `aria-hidden="true"` всегда;
- no tabindex/role/input/button;
- pointer-events none по умолчанию;
- decorative text не попадает в clipboard native input value;
- separator отсутствует до first и после last group;
- не рендерится при одном group/no grouping.
</dom-semantics>

<custom-content>
Slot допускает text, MIcon, MShape или SVG, но весь wrapper остаётся aria-hidden. Interactive content внутри separator запрещён и получает dev guidance в docs; actions между OTP groups принадлежат внешнему layout, не separator.
</custom-content>

<layout>
Separator visually связывается с соседними groups так, чтобы responsive wrap не оставлял glyph в одиночестве. Выбирается wrapper/grid strategy parent. Размер не влияет на cell indices. RTL/LTR orientation следует parent OTP direction.
</layout>

<styles>
Nested separator tokens: inline margins/gap, color, typography/icon size, responsive visibility. No literals; `material-map()`/`g()`, `1rem = 1px макета`. Separator не копирует field states; disabled/error могут наследовать currentColor только если parent presentation требует.
</styles>

<reuse>
Parent validated grouping/layout and optional MIcon/MShape in slot. No context mutation, registry, listener or model.
</reuse>

<edge-cases>
- custom empty separator still preserves intentional group gap according to slot output policy;
- reactive group changes remount exact separators;
- separator string consists of multiple glyphs;
- narrow wrapping;
- mask/error/disabled have no behavioral effect;
- screen reader/browser copy reads only native input code.
</edge-cases>

<tests>
- exact N-1 placement between groups;
- aria-hidden/no role/tabindex/pointer interaction;
- excluded from code/caret/paste/clipboard;
- custom text/MIcon/MShape slot stays hidden;
- reactive groups and responsive attachment;
- no separators without grouping;
- separator-only token map.
</tests>

<done>
Separator полностью описан как decorative leaf: он улучшает visual reading, но имеет нулевое влияние на form value, focus и accessibility announcement.
</done>

<questions></questions>
