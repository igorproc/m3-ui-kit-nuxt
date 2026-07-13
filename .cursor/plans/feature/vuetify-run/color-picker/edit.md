# ColorPickerEdit

<identity>Vuetify: `VColorPickerEdit` · Target: private `ColorPickerEdit` · Parent: `MColorPicker` · Phase: 2 · Type: sub</identity>

<implementation-status state="done" updated="2026-07-14">
HEX draft commit and numeric RGB/HSL(A) editing use the shared context and
the field/number-input foundations, with focused format/channel tests.
</implementation-status>

<problem>Canvas даёт быстрый visual selection, но точное значение требует редактируемых HEX/RGB/HSL channels. Incomplete/invalid draft не должен ломать единый HSVA state.</problem>

<solution>Private edit leaf выбирает поля по parent format, хранит только временные drafts и commit-ит valid channels в parent context. Собственного color model/parser нет.</solution>

<composition>
- `hex/hexa`: один `MTextField`;
- `rgb/rgba`: `MNumberInput` для R/G/B и alpha;
- `hsl/hsla`: `MNumberInput` для H/S/L и alpha;
- format selector использует `MButtonSegmented` и parent `defineModel('format')`;
- leaf является default implementation parent `#inputs`, не public auto-import.
</composition>

<ranges>
```text
R/G/B: 0–255
H:     0–360
S/L:   0–100%
Alpha: 0–100%
```

Alpha в UI всегда показывается явно в процентах. Parent HSVA хранит `a` в `0…1`; conversion `uiPercent ↔ normalizedAlpha` происходит только на field/context boundary.
</ranges>

<draft-policy>
- incomplete text остаётся local draft;
- Enter/blur commits valid value;
- Escape восстанавливает parent-derived value;
- invalid channel не изменяет общий color и сообщает field error;
- parent change от canvas/swatches обновляет field, если конкретный draft не dirty/focused;
- после local commit все sibling channels пересчитываются из parent HSVA;
- format switch сбрасывает stale drafts и следует parent alpha-loss warning policy.
</draft-policy>

<api>Context-only projection of the required master `MColorPickerContext`: HSVA/RGBA, format, supported formats, disabled, channel setters, format setter, commit and invalid reporting. Revert restores parent-derived values from context; it is local draft behavior, not a second provided action/state. Public props/v-model/emits отсутствуют.</api>

<reuse>`MTextField`, `MNumberInput`, `MButtonSegmented`, parent HSVA context и shared color codec. Не создавать native inputs, второй parser или parallel committed state.</reuse>

<styles>Nested edit `$tokens` map описывает responsive channel grid, labels, gaps и format selector placement. Field/button states остаются в их token maps. Все values через `material-map()`/`g()`, `1rem = 1px макета`.</styles>

<ux>Labels channels доступны screen reader; `%` отображается suffix/label и входит в accessible value; tab order следует visual order; disabled блокирует edits; narrow layout переносит channels без потери label.</ux>

<dx>Consumer заменяет весь block через parent `#inputs` и получает typed edit context. Private leaf не имеет собственных customization slots.</dx>

<tests>All format field sets, exact ranges, alpha percent conversion, incomplete/invalid drafts, Enter/blur/Escape, canvas synchronization while focused/dirty, format switch, disabled, keyboard/tab/a11y.</tests>

<done>Точный HEX/RGB/HSL(A) ввод синхронизирован с единым HSVA context; alpha всегда понятен пользователю как процент и никогда не хранится вторым committed state.</done>

<questions></questions>
