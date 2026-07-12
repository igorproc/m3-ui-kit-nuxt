# MDropdown: searchable/combobox mode

<identity>
Existing component: `MDropdown` · Covers Vuetify roles: `VSelect` + `VCombobox` · Type: public component update · Related new component: `MAutocomplete`
</identity>

<problem>
Текущий `MDropdown` уже закрывает single/multiple selection и отображение выбранных значений через chips, но trigger является readonly: внутренний `MTextField` не принимает текст. Чтобы получить combobox UX, consumer не должен переходить на второй почти идентичный компонент с отдельными menu, selection и chip implementations.
</problem>

<solution>
Развить `MDropdown` вариативно:

- default readonly mode сохраняет текущий select/dropdown UX;
- `searchable` делает trigger редактируемым и фильтрует options как autocomplete;
- `allowCustom` дополнительно разрешает commit свободного текста в model и закрывает роль `VCombobox`;
- multiple/chips остаются одной существующей системой.

Отдельный public `MCombobox` не создаётся.
</solution>

<modes>
```text
MDropdown
├── readonly select       searchable=false, allowCustom=false
├── searchable select     searchable=true,  allowCustom=false
└── combobox/free values  searchable=true,  allowCustom=true
```

`allowCustom` неявно включает searchable и выдаёт dev warning, если consumer передал противоречивую комбинацию.
</modes>

<models>
Все models оформляются через Vue `defineModel`:

```ts
const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })
```

Не объявлять вручную `update:modelValue`, `update:search`, `update:open`.
</models>

<generic-api>
Текущие `DropdownOption/DropdownItem` с `unknown` заменяются generic resolvers без потери compatibility adapters:

```ts
interface MDropdownProps<TItem, TValue = TItem> {
  items?: readonly TItem[]
  modelValue?: TValue | TValue[]

  itemTitle?: keyof TItem | ((item: TItem, index: number) => string)
  itemValue?: keyof TItem | ((item: TItem, index: number) => TValue)
  itemDisabled?: keyof TItem | ((item: TItem, index: number) => boolean)
  itemKey?: keyof TItem | ((item: TItem, index: number) => PropertyKey)

  multiple?: boolean
  mandatory?: boolean
  disabled?: boolean
  readonly?: boolean

  searchable?: boolean
  allowCustom?: boolean
  filter?: DropdownFilter<TItem> | false
  filterMode?: 'contains' | 'starts-with'

  createValue?: (search: string) => TValue | Promise<TValue>
  normalize?: (search: string) => string
  createOn?: Array<'enter' | 'delimiter' | 'blur'>
  delimiters?: string[]

  label?: string
  placeholder?: string
  helperText?: string
  clearable?: boolean
  loading?: boolean
  error?: unknown
  variant?: 'filled' | 'outlined'
  path?: string
}
```
</generic-api>

<readonly-dx>
Текущий API продолжает работать:

```vue
<MDropdown
  v-model="countryId"
  :items="countries"
  item-title="name"
  item-value="id"
/>
```

Trigger не редактируется, Space/Enter открывают listbox, выбранное значение показывается как field display.
</readonly-dx>

<searchable-dx>
```vue
<MDropdown
  v-model="countryId"
  v-model:search="search"
  :items="countries"
  item-title="name"
  item-value="id"
  searchable
/>
```

Editable trigger использует ту же filtering/listbox foundation, что `MAutocomplete`. Выбрать можно только существующий item. Search immediate; debounce/fetch остаются consumer-side.
</searchable-dx>

<combobox-dx>
String tags:

```vue
<MDropdown
  v-model="tags"
  :items="suggestedTags"
  multiple
  searchable
  allow-custom
/>
```

Object/custom value:

```vue
<MDropdown
  v-model="tags"
  :items="suggestions"
  :item-title="tag => tag.title"
  :item-value="tag => tag"
  :create-value="title => ({ id: crypto.randomUUID(), title })"
  multiple
  allow-custom
/>
```

`createValue` преобразует строку в model value и может вернуть Promise. Component ждёт результат, но не мутирует `items` и не навязывает persistence transport.
</combobox-dx>

<selection-and-search>
- `model` — committed values; `search` — draft input;
- single mode не уничтожает selection при первом символе; blur/Escape без commit возвращают committed display;
- multiple mode сохраняет существующие chips и очищает search после commit;
- Backspace при пустом search фокусирует последний removable chip, повторный Backspace/Delete удаляет;
- disabled selected item/chip не удаляется;
- component не хранит selected-item cache: consumer сохраняет нужные records в `items` либо кастомизирует selection slot.
</selection-and-search>

<creation-policy>
- default `normalize`: trim;
- default `createOn`: `['enter']`;
- blur creation opt-in, чтобы незавершённый ввод не сохранялся случайно;
- delimiter creation поддерживает batch paste и не работает во время IME composition;
- exact known option имеет приоритет над custom creation;
- synthetic create-option участвует в active-descendant navigation;
- duplicates запрещены по `valueComparator/itemValue`, без object-identity default;
- `items` prop никогда не мутируется.
</creation-policy>

<async-creation>
`createValue` допускает Promise. Во время выполнения synthetic option получает creating/progress state, повторный commit блокируется. Resolve добавляет value и очищает query; reject сохраняет query и показывает default create error/retry slot. Закрытие menu не обязано отменять consumer Promise.
</async-creation>

<filtering>
Default searchable filter — deterministic locale-aware contains по resolved title, stable order. `starts-with` и custom function поддерживаются. `filter=false` предназначен для remote/pre-filtered items. Fuzzy scoring не входит в default.
</filtering>

<slots>
Существующие selection/chip/item slots сохраняются и типизируются. Добавляются:

- `loading`, `empty`, `no-results`, `error` с default M3/locale content;
- `create-option` с default «Добавить “{search}”»;
- `creating` и `create-error`;
- `selection` получает `item | undefined`, value, title, remove;
- custom item/create content не заменяет внутренний semantic option root.
</slots>

<keyboard-a11y>
Readonly mode сохраняет select-like trigger behavior. Searchable/custom mode использует editable ARIA combobox:

- ArrowDown/ArrowUp, Home/End, Enter, Escape, Tab;
- Space вводит пробел, а не выбирает option;
- Enter выбирает active known option до custom creation;
- IME Enter игнорируется до compositionend;
- delimiter не обрабатывается во время composition;
- listbox uses active descendant, multiple adds `aria-multiselectable`.
</keyboard-a11y>

<reactivity-and-lifecycle>
Перевести ручные `ticketIds Map + syncTickets` на shared reactive listbox/selection registry. Registrations привязываются к item effect scopes и очищаются через `onScopeDispose`, включая data replacement и component scope teardown.
</reactivity-and-lifecycle>

<reuse>
Существующие `MTextField`, `MMenu`/future `MOverlay`, chips/multiple UX, registry selection и dropdown leaves. Shared `createListbox` выделяется совместно с `MAutocomplete`; не создавать отдельный combobox engine, menu или SCSS family.
</reuse>

<styles>
Расширять текущую nested dropdown `$tokens` map searchable/create/loading ветками. Field tokens остаются в `MTextField`, option state tokens — в shared listbox/menu layer. Все values через `material-map()`/`g()`, правило `1rem = 1px макета`, без runtime component-state variables.
</styles>

<migration>
1. Ввести generic item normalization с compatibility для текущих `options/items`.
2. Выделить shared listbox foundation вместе с `MAutocomplete`.
3. Перевести readonly mode без изменения behavior.
4. Добавить searchable mode.
5. Добавить allowCustom/createValue и async creation states.
6. Deprecated `options` оставить на migration window, рекомендуя единый `items` API.
</migration>

<tests>
- полная regression текущего readonly single/multiple/chips API;
- generic inference and defineModel models;
- searchable local/remote filtering;
- custom string/object/async creation;
- duplicate/delimiter/blur/IME policies;
- committed selection vs search draft;
- loading/empty/no-results/error/create slots defaults;
- keyboard and ARIA differences readonly/searchable;
- reactive registry reconciliation and `onScopeDispose` cleanup;
- SSR initial items/hydration.
</tests>

<done>
Один `MDropdown` закрывает readonly select, searchable select и combobox/free-value scenarios, сохраняя существующие multiple/chips возможности и используя общую listbox foundation с autocomplete.
</done>

<questions></questions>
