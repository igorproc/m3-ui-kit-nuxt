# OtpGroup

<identity>
Vuetify: `VOtpGroup` · Target: private layout `OtpGroup` · Parent: `MOtpInput` · Phase: 2 · Type: deterministic presentation leaf
</identity>

<problem>
Коды вроде банковских/резервных удобнее читать блоками, но визуальная grouping не должна менять aggregate string, native caret indices, completion length или создавать вложенные field contexts.
</problem>

<solution>
Parent валидирует `groups`, строит linear index ranges и передаёт их private OtpGroup. Group только размещает OtpField для `[start,end)`, сохраняя глобальный index. Separators остаются siblings между groups.
</solution>

<range-contract>
```ts
interface OtpGroupProps {
  groupIndex: number
  start: number
  end: number
}

interface OtpGroupState {
  groupIndex: number
  start: number
  end: number
  length: number
  filledCount: number
  complete: boolean
}
```

Internal props создаёт только parent. Invalid/overlapping/out-of-range ranges не должны доходить до leaf; dev assertion допустим.
</range-contract>

<example>
`length=8`, `groups=[4,4]`:

```text
group 0: global indices 0,1,2,3
separator
group 1: global indices 4,5,6,7
```

Caret index 5 остаётся model position 5, а не local group position 1.
</example>

<slots>
Parent `#group` получает `OtpGroupState` и rendering helpers. Default group сам рендерит range OtpFields. Custom group не получает отдельный model/focus API; cell click всё равно использует global index.
</slots>

<accessibility>
Group по умолчанию presentation/aria-hidden вместе с visual cells; единый native input уже объявляет code. Не добавлять повторяющиеся «group 1» announcements. Если product требует semantic grouping instruction, она задаётся единой supporting description parent input, не leaf label.
</accessibility>

<responsive-layout>
- cells внутри group не разрываются без явной narrow policy;
- groups могут переноситься целиком на новую строку;
- separator переносится вместе с последующей/предыдущей группой по CSS wrapper policy, не остаётся один;
- DOM order всегда равен model order;
- visual RTL policy обсуждается с input direction: OTP codes обычно LTR even in RTL locale, parent sets direction consistently.
</responsive-layout>

<styles>
Nested group tokens: inline gap, inter-group behavior, wrap, block gap and optional shape. No field/separator colors copied. `material-map()`/`g()`, `1rem = 1px макета`.
</styles>

<reuse>
Parent group normalization/context, OtpField and CSS layout. Не создавать group model, selection registry, local indices or focus algorithm.
</reuse>

<edge-cases>
- groups omitted → parent may skip group wrappers or create one full range consistently;
- length/group props change reactively;
- zero-length group rejected by parent;
- custom slot accidentally reorders cells: docs/tests require global order;
- narrow wrap and separators;
- masked/error/disabled states flow per cell unchanged.
</edge-cases>

<tests>
- exact ranges/global indices for multiple configs;
- no model/caret remapping;
- reactive length/groups rebuild;
- complete/filledCount slot state;
- responsive wrap, separator attachment and DOM order;
- no duplicate accessibility/tab stops;
- custom group maintains indices;
- styles use group-only tokens.
</tests>

<done>
OtpGroup полностью документирует readable layout grouping, оставаясь нулевым behavioral layer: model, caret, validation и completion не знают о группах.
</done>

<questions></questions>
