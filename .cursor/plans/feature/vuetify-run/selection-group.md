# MSelectionGroup

<identity>
Vuetify: `VItemGroup` · Target: `MSelectionGroup` · Phase: 1 · Type: public renderless component over kit reactive registry
</identity>

<implementation-status state="done" updated="2026-07-13">
Public renderless component, shared registry/context and focused tests are present.
</implementation-status>

<problem>
Kit уже имеет мощную реактивную selection infrastructure (`createSelection`, `createGroup`, `createSingle`, proxy registry и context trinity), но она требует знания внутренних tickets/ids/namespaces. Для custom selectable cards, filters, tiles и toolbars нужен template-first API с generic type flow и без копирования selection state.
</problem>

<solution>
`MSelectionGroup<TItem, TValue>` становится public renderless adapter над существующей реактивной registry-системой. Он поддерживает data-driven `items + #item`, ручные `MSelectionItem` и advanced custom children через стабильный `useSelectionContext<TValue>()`. Все три пути используют один context и одни tickets.
</solution>

<reactivity-system>
Компонент обязательно встроен в текущую систему реактивности kit:

- `createGroup/createSelection` остаются единственным source of truth;
- `createTrinity` предоставляет/inject context по дереву Vue;
- selected ids/mixed ids остаются reactive sets существующего registry;
- public `selected`, `isAllSelected`, `isMixed`, `selectionLimitReached` являются readonly computed projections;
- reactive `items`, item values, disabled state, `multiple`, `mandatory`, `max` и external model синхронизируются без второго массива selection state;
- `MSelectionGroup` не создаёт Pinia store и не копирует registry в локальные refs;
- public facade скрывает внутренние ids, namespaces и proxy implementation.
</reactivity-system>

<types>
```ts
type ItemValueResolver<TItem, TValue>
  = keyof TItem | ((item: TItem, index: number) => TValue)

type ItemDisabledResolver<TItem>
  = keyof TItem | ((item: TItem, index: number) => boolean)

type ItemKeyResolver<TItem>
  = keyof TItem | ((item: TItem, index: number) => PropertyKey)

interface MSelectionGroupProps<TItem, TValue = TItem> {
  items?: readonly TItem[]
  modelValue?: TValue | TValue[]
  itemValue?: ItemValueResolver<TItem, TValue>
  itemDisabled?: ItemDisabledResolver<TItem>
  itemKey?: ItemKeyResolver<TItem>
  multiple?: boolean
  mandatory?: boolean | 'force'
  disabled?: boolean
  max?: number
  valueComparator?: (left: TValue, right: TValue) => boolean
}

interface MSelectionGroupEmits<TValue> {
  (event: 'update:modelValue', value: TValue | TValue[]): void
  (event: 'change', value: TValue | TValue[]): void
}
```

Vue SFC использует generic declaration `TItem, TValue = TItem`. Type flow обязан сохраняться по цепочке `items → itemValue → modelValue → #item`; type tests проверяют inference для object item и primitive/object value.
</types>

<data-driven-dx>
```vue
<MSelectionGroup
  v-model="selectedPlan"
  :items="plans"
  :item-value="plan => plan.id"
  :item-disabled="plan => plan.unavailable"
  mandatory
>
  <template #item="{ item, isSelected, isDisabled, toggle }">
    <MCard
      :variant="isSelected ? 'filled' : 'outlined'"
      :disabled="isDisabled"
      @click="toggle"
    >
      {{ item.title }}
    </MCard>
  </template>
</MSelectionGroup>
```

`item` выводится как исходный `TItem`, model — как `TValue`. Group сам создаёт и reconciles tickets; consumer не видит registry ceremony.
</data-driven-dx>

<manual-dx>
```vue
<MSelectionGroup v-model="selected" multiple>
  <MSelectionItem
    v-for="plan in plans"
    :key="plan.id"
    v-slot="selection"
    :value="plan.id"
  >
    <PlanCard
      :plan="plan"
      :selected="selection.isSelected"
      @click="selection.toggle"
    />
  </MSelectionItem>
</MSelectionGroup>
```
</manual-dx>

<advanced-dx>
Custom child получает public facade, а не сырой `createGroup`:

```ts
const selection = useSelectionContext<number>()

const ticket = selection.register({
  value: () => props.plan.id,
  disabled: () => props.plan.unavailable,
})
```

```ts
interface MSelectionContext<TValue> {
  register: (
    registration: SelectionItemRegistration<TValue>,
  ) => SelectionItemTicket<TValue>
  selected: Readonly<ComputedRef<TValue[]>>
  disabled: Readonly<ComputedRef<boolean>>
  multiple: Readonly<ComputedRef<boolean>>
  selectionLimitReached: Readonly<ComputedRef<boolean>>
  isSelected: (value: TValue) => boolean
  select: (value: TValue) => void
  unselect: (value: TValue) => void
  toggle: (value: TValue) => void
  selectAll: () => void
  unselectAll: () => void
  toggleAll: () => void
}
```
</advanced-dx>

<slots>
Не менять смысл default slot в зависимости от наличия `items`.

```ts
interface MSelectionGroupSlots<TItem, TValue> {
  default(group: SelectionGroupSlot<TValue>): unknown
  item(item: SelectionItemSlot<TItem, TValue>): unknown
  empty(group: SelectionGroupSlot<TValue>): unknown
}
```

- `default` всегда group-level content/controls и вызывается один раз;
- `item` вызывается для каждой data-driven записи;
- `empty` используется при пустом data-driven списке;
- manual `MSelectionItem` размещаются в stable default slot.
</slots>

<item-slot>
```ts
interface SelectionItemSlot<TItem, TValue> {
  item: TItem
  value: TValue
  index: number
  isSelected: boolean
  isDisabled: boolean
  isSelectionBlocked: boolean
  blockReason: 'disabled' | 'max' | null
  select: () => void
  unselect: () => void
  toggle: () => void
}
```
</item-slot>

<model-policy>
- single mode emits `TValue | undefined`; exact public typing uses overload/discriminated props where Volar позволяет;
- multiple mode emits `TValue[]`;
- `mandatory: true` запрещает снять последний выбор;
- `mandatory: 'force'` дополнительно выбирает первый доступный item при регистрации;
- если выбранный dynamic item исчез, mandatory group выбирает ближайший доступный item, чтобы invariant не нарушался не по воле пользователя;
- duplicate values вызывают dev warning; stable identity определяется `itemKey`, затем resolved value, затем fallback key с warning для object items.
</model-policy>

<max-policy>
`max` применяется только в multiple mode. При достижении лимита выбранные items остаются управляемыми, а невыбранные получают `isSelectionBlocked`/`blockReason: 'max'`. Group отдаёт `selectionLimitReached`, чтобы consumer показал supporting message; generic layer не навязывает disabled visuals.
</max-policy>

<reconciliation>
Data-driven `items` проходят keyed reconciliation:

- новая запись создаёт item effect scope и register ticket;
- удалённая запись останавливает scope;
- изменение value/disabled обновляет reactive ticket;
- reorder обновляет registry order без потери selection;
- external model changes применяются через существующий selection `apply`, а не пересоздают tickets.

Каждая регистрация живёт в Vue effect scope. Cleanup выполняется только через `onScopeDispose`; прямой `onUnmounted` не используется. Это одинаково работает при component unmount, conditional scope teardown и data-driven removal.
</reconciliation>

<selection-vs-navigation>
Group управляет только selection. Он не выбирает ARIA role и keyboard pattern: tab, checkbox, option, radio, pressed button и card grid имеют разные semantics. Специализированный consumer отвечает за focus/roving navigation и применяет `aria-selected`, `aria-checked` или `aria-pressed` по своей роли.
</selection-vs-navigation>

<reuse>
`createGroup`, `createSelection`, `createTrinity`, registry tickets, `useProxyRegistry` и текущие batch/mixed aggregates. Не создавать вторую reactive collection, новый Pinia store или новый injection symbol для каждого component instance. Existing tabs/dropdown/radio могут мигрировать только без потери специализированного a11y/keyboard UX.
</reuse>

<styles>
Renderless component не имеет DOM и SCSS. Visual M3 tokens принадлежат card/chip/button/checkbox consumer. SelectionGroup не генерирует selected classes или colors.
</styles>

<tests>
- generic inference `TItem/TValue` и model typing;
- data-driven/manual/custom context используют один registry;
- single/multiple, mandatory/force, max и comparator;
- readonly reactive selected/all/mixed/limit projections;
- keyed add/remove/reorder/value/disabled updates;
- `onScopeDispose` unregister при component и item scope teardown;
- external model sync без duplicate state;
- stable default/item/empty slot semantics;
- duplicate values/unstable object keys warnings;
- SSR context isolation.
</tests>

<done>
Разработчик выбирает data-driven, manual или advanced composition без потери generic typing; все варианты подключены к существующей реактивной registry-системе kit и очищают tickets через scope disposal.
</done>

<questions></questions>
