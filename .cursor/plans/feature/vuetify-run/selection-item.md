# MSelectionItem

<identity>
Vuetify: `VItem` · Target: `MSelectionItem` · Phase: 1 · Type: public renderless child · Parent: `MSelectionGroup`
</identity>

<implementation-status state="done" updated="2026-07-13">
Public renderless child and manual-composition tests are present.
</implementation-status>

<problem>
Manual template composition должна получать reactive selection ticket без прямого вызова context register и без знания внутренних ids. Item не может навязывать DOM/ARIA, потому что selectable consumer может быть card, chip, checkbox, tab или option.
</problem>

<solution>
`MSelectionItem<TValue>` injects ближайший public selection context, реактивно регистрирует value/disabled и отдаёт ticket state/actions через default slot. DOM не создаётся.
</solution>

<api>
```ts
interface MSelectionItemProps<TValue> {
  value: TValue
  disabled?: boolean
}

interface MSelectionItemSlot<TValue> {
  value: TValue
  isSelected: boolean
  isDisabled: boolean
  isSelectionBlocked: boolean
  blockReason: 'disabled' | 'max' | null
  select: () => void
  unselect: () => void
  toggle: () => void
}
```
</api>

<dx>
```vue
<MSelectionItem
  v-slot="{ isSelected, isDisabled, toggle }"
  :value="plan.id"
  :disabled="plan.unavailable"
>
  <MCard
    :variant="isSelected ? 'filled' : 'outlined'"
    :disabled="isDisabled"
    @click="toggle"
  />
</MSelectionItem>
```
</dx>

<reactivity>
- `value` и `disabled` остаются reactive inputs ticket;
- selected/blocked states — readonly computed projections context;
- ticket регистрируется в текущем Vue effect scope;
- unregister выполняется только через `onScopeDispose`;
- отсутствие parent context вызывает понятную dev error с указанием `MSelectionGroup`.
</reactivity>

<semantics>
Item не возвращает универсальный `props` bundle с ARIA: правильный role/state зависит от consumer. Он также не добавляет click, tabindex, keyboard navigation, selected class или wrapper element.
</semantics>

<reuse>
Public `useSelectionContext<TValue>()` facade и существующий registry ticket. Data-driven item path `MSelectionGroup` создаёт tickets с тем же контрактом; отдельная selection implementation запрещена.
</reuse>

<styles>
Нет DOM и styles. Consumer владеет M3 selected/disabled/interaction tokens.
</styles>

<tests>
- parent injection и missing-parent error;
- generic value typing;
- reactive selected/disabled/max-blocked states;
- select/unselect/toggle;
- value update без leaked registration;
- cleanup через `onScopeDispose`;
- renderless single-slot behavior.
</tests>

<done>
Manual selectable child подключается к общей реактивной selection system одним renderless wrapper без ARIA/layout assumptions.
</done>

<questions></questions>
