# MAutocomplete

<identity>
Vuetify: `VAutocomplete` · Target: `MAutocomplete` · Phase: 2 · Type: public generic field
</identity>

<implementation-status state="done" updated="2026-07-14">
Public generic field, native-input combobox semantics, shared headless listbox,
local/remote filtering modes, multiple selection and focused tests are present.
</implementation-status>

<problem>
`MDropdown` выбирает из готового списка через readonly trigger, а `MSearch/MTextField` работают с текстом. Нет field, где editable search draft и committed selection являются разными состояниями, поддерживают local/remote items и полноценный combobox/listbox keyboard UX.
</problem>

<solution>
`MAutocomplete<TItem, TValue>` композирует editable `MTextField`, `MMenu`/overlay и shared headless listbox-selection foundation. Он выбирает только значения из `items`. Combobox/free-value роль закрывается развитием существующего `MDropdown` по плану `feature/components-should-update/dropdown.md`. Transport/debounce/cache выбранных remote records принадлежат consumer.
</solution>

<architecture>
Не вкладывать DOM `MDropdown` внутрь autocomplete: текущий dropdown trigger не редактируется. Из dropdown выделяется shared `createListbox` foundation:

```text
createListbox
├── option registry
├── active descendant
├── keyboard movement
├── selection tickets
├── generic item normalization
└── listbox ids/state

MDropdown     → readonly field trigger
MAutocomplete → editable text trigger
MDropdown searchable/custom mode → editable trigger + optional custom values
```

Все три используют `MMenu`/будущий `MOverlay`, registry и один listbox keyboard engine.
</architecture>

<models>
Использовать Vue `defineModel`, а не ручные `update:*` emits:

```ts
const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })
```

Single/multiple typing уточняется generic/discriminated overloads, насколько поддерживает Vue/Volar. `search` обновляется immediate на каждый ввод; debounce остаётся снаружи.
</models>

<api>
```ts
type ItemResolver<TItem, TResult>
  = keyof TItem | ((item: TItem, index: number) => TResult)

type AutocompleteFilter<TItem> = (
  item: TItem,
  query: string,
  normalizedTitle: string,
) => boolean

interface MAutocompleteProps<TItem, TValue = TItem> {
  items: readonly TItem[]
  itemTitle?: ItemResolver<TItem, string>
  itemValue?: ItemResolver<TItem, TValue>
  itemDisabled?: ItemResolver<TItem, boolean>
  itemKey?: ItemResolver<TItem, PropertyKey>

  multiple?: boolean
  mandatory?: boolean
  disabled?: boolean
  readonly?: boolean

  filter?: AutocompleteFilter<TItem> | false
  filterMode?: 'contains' | 'starts-with'
  hideSelected?: boolean
  openOnFocus?: boolean
  autoSelectFirst?: boolean
  minSearchLength?: number

  loading?: boolean
  error?: unknown
  clearable?: boolean

  label?: string
  placeholder?: string
  helperText?: string
  variant?: 'filled' | 'outlined'
  path?: string
}
```
</api>

<emits>
Кроме событий моделей:

```ts
interface MAutocompleteEmits<TItem> {
  (event: 'select', item: TItem): void
  (event: 'remove', item: TItem): void
  (event: 'clear'): void
  (event: 'open'): void
  (event: 'close'): void
}
```

`update:modelValue`, `update:search`, `update:open` вручную не объявляются: их генерирует `defineModel`.
</emits>

<filtering>
Default local filter — deterministic locale-aware `contains` по resolved title, без fuzzy scoring и изменения исходного порядка. Пустой query показывает все items.

```vue
<MAutocomplete filter-mode="starts-with" />
```

Custom:

```vue
<MAutocomplete
  :filter="(item, query, title) =>
    title.includes(query) || item.email.includes(query)"
/>
```

Remote:

```vue
<MAutocomplete
  v-model:search="search"
  :items="results"
  :filter="false"
/>
```

`filter=false` означает, что consumer/server уже сформировал и упорядочил список.
</filtering>

<remote-dx>
`search` всегда immediate. Компонент не имеет `fetch`, URL или `debounce` props. Docs дают recipe с `refDebounced/watchDebounced` и `useAsyncData`:

```ts
const search = ref('')
const debouncedSearch = refDebounced(search, 300)

const { data: users, status, error } = await useAsyncData(
  'users',
  () => api.users.search(debouncedSearch.value),
  { watch: [debouncedSearch] },
)
```
</remote-dx>

<single-selection>
Selection и search draft не смешиваются:

1. unfocused field показывает title выбранного item;
2. focus сохраняет display и позволяет начать новый query;
3. typing не очищает committed model;
4. option commit заменяет model и display;
5. blur/Escape без commit восстанавливает title текущего selection;
6. clear affordance явно очищает model и search.

Компонент не хранит selected-item cache. Title разрешается только из текущих `items`. Для remote search consumer обязан сохранять выбранный record среди переданных items либо кастомизировать `#selection`; если item отсутствует, default display использует `String(value)` и dev warning объясняет потерю metadata.
</single-selection>

<multiple-selection>
- selected records показываются chips;
- query очищается после commit;
- Enter выбирает active option;
- Backspace при пустом query сначала фокусирует последний removable chip, повторный Backspace/Delete удаляет его;
- typing возвращает input mode;
- disabled selection нельзя удалить;
- `hideSelected` исключает выбранные options из видимого списка.
</multiple-selection>

<slots>
```ts
interface MAutocompleteSlots<TItem, TValue> {
  item(props: AutocompleteItemSlot<TItem, TValue>): unknown
  selection(props: AutocompleteSelectionSlot<TItem, TValue>): unknown
  loading(props: { search: string }): unknown
  empty(props: { search: string }): unknown
  noResults(props: { search: string }): unknown
  error(props: { error: unknown, search: string }): unknown
  prepend(): unknown
  append(): unknown
}
```

Все state slots имеют M3-like defaults:

- `loading`: progress/skeleton с текстом «Загрузка…»;
- `empty`: «Нет доступных вариантов» при пустом source/query;
- `no-results`: «По запросу “{search}” ничего не найдено»;
- `error`: безопасное «Не удалось загрузить варианты» без вывода raw error;
- background loading сохраняет старые items и показывает progress indicator, а не заменяет listbox.

Тексты проходят через kit locale/messages layer и могут быть заменены slots. `empty` и `noResults` не смешиваются.
</slots>

<option-semantics>
Custom `#item` меняет content, но не заменяет semantic root. Внутренний option wrapper сохраняет `role="option"`, ids, `aria-selected`, disabled state, pointer selection и registry lifecycle. Slot получает:

```ts
interface AutocompleteItemSlot<TItem, TValue> {
  item: TItem
  value: TValue
  title: string
  index: number
  isActive: boolean
  isSelected: boolean
  isDisabled: boolean
}
```

Не передавать второй `select()` в content slot без необходимости: interactive semantics остаются у wrapper, чтобы slot не создавал nested controls и двойной event path.
</option-semantics>

<keyboard-a11y>
Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`. Panel: `role="listbox"`, multiple mode добавляет `aria-multiselectable`.

- ArrowDown/ArrowUp открывают panel и двигают active option;
- Home/End переходят к границам;
- Enter commit active option;
- Escape закрывает и восстанавливает committed display;
- Tab закрывает без неожиданного commit;
- printable keys изменяют search;
- Space вводит пробел, а не выбирает option;
- во время IME composition Enter не выбирает до `compositionend`;
- disabled options пропускаются navigation.
</keyboard-a11y>

<state-priority>
```text
error
→ loading without items
→ ready items + background loading indicator
→ empty source
→ no filtered results
→ ready
```

Error не маскируется empty state. Loading без items не показывает no-results. Background request не очищает уже доступный listbox.
</state-priority>

<reuse>
`MTextField` field surface/validation/messages, `MMenu`/`MOverlay`, current dropdown option registry/active-descendant behavior, selection registry, `MChip`, `MProgressCircular`/skeleton и locale messages. Не копировать field/menu/selection engines и не вводить transport/cache layer.
</reuse>

<styles>
Autocomplete `$tokens` map содержит только family-specific listbox constraints, loading region и selection layout. Field tokens остаются у `MTextField`, option state tokens переиспользуют list/menu foundation. Все maps nested, подключаются через `material-map()`/`g()`, соблюдают `1rem = 1px макета`; literal component values запрещены.
</styles>

<tests>
- generic item/value inference и defineModel single/multiple/search/open;
- local contains/starts-with/custom/false filter;
- immediate search и remote item replacement;
- committed selection vs draft restore on blur/Escape;
- отсутствующий selected record: String fallback + warning, без internal cache;
- multiple chip focus/removal;
- loading/background/empty/no-results/error default slots and overrides;
- keyboard contract, disabled options, IME composition;
- ARIA combobox/listbox/active descendant;
- option slot не ломает semantic wrapper;
- SSR initial items and hydration.
</tests>

<done>
Autocomplete даёт typed local/remote searchable selection с предсказуемыми draft/commit semantics, default M3 states и полной keyboard accessibility, не забирая transport/cache ответственность у приложения.
</done>

<questions></questions>
