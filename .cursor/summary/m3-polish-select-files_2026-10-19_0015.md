# M3-polish · select-files (w4) — 2026-10-19

Группа: MDropdown, MAutocomplete, MSearch, MFileInput, MFileUpload. Аудит —
`.cursor/handoff/m3-polish/audit/select-files.md` (57 находок; решения Q-1…Q-19 — по рекомендации, GO
оркестратора 2026-10-18; Q-7 вариант 4 — СТОП, не делался).

## Решения

- Q-1 резерв высоты filled + multiple — хуком w3 (TF-B1/B3): в multiple слот `#leading-content`
  передаётся всегда, пустой без чипов; своего резерва нет.
- Q-2 read-only: действия, меняющие значение, — disabled (как у MFileUpload); чипы в полной краске, без ×.
- Q-3 у механики dropdown нет нативного `readonly`: `inputmode=none`, `beforeinput` отменяется, итог
  IME-композиции откатывается; `readonly` ставится только по пропу.
- Q-4 панель не открывается «в пустоту» (нет строк, слота, фразы); у autocomplete ниже
  `minSearchLength` без `#hint`. Применено и к dropdown (пустой список без `messages.empty`/`#empty`).
- Q-5 запрос autocomplete — только напечатанное: выбор и blur пишут заголовок в поле, но не в `search`;
  повторное открытие — весь список с посадкой на значение.
- Q-6 общая панель — фрагмент `fragments/dropdown/Panel.vue`, блок `ui-dropdown-panel__*`.
- Q-7 фразы — проп `messages` (`MDropdownMessages`) без дефолтов + dev-warn; `MESSAGES.dropdown*` удалены.
- Q-8 `formatSize` (MFileInput) и `messages.size` (MFileUpload), дефолт — прежний `formatFileSize`.
- Q-9 сняты: `autocomplete` у MDropdown/MFileInput, `loading` у MSearch/MFileUpload,
  `ui-dropdown--multiple`, `ui-autocomplete--multiple`, `ui-search--empty`. `ui-autocomplete--open`
  остался — на нём поворот стрелки.
- Q-10 внутренности движка — `utils/dropdown/` и `utils/file-upload/context.ts` (вне автоимпорта).
  Публичные: `useDropdownControl`, `useAutocomplete`, `useTypeahead`, `useListbox`, `useFileUploadQueue`.
- Q-11 ошибка загрузки — рецепт через `#empty`/`#no-results`, без API.
- Q-12 Escape в MSearch очищает и испускает `clear`; пустой бар отпускает Esc дальше.
- Q-13 MFileInput: поле — кнопка пикера (клик в коробке, Enter, Space).
- Q-14 нативный `input type=file` держит файлы модели (`syncInputFiles`, DataTransfer, только клиент).
- Q-15 «Start uploads» остаётся при строках в очереди (off, когда ждать нечего), ширина по подписи;
  при `autoStart` не предлагается вовсе (ему нечего ждать — иначе вечно выключенная кнопка).
- Q-16 проп `queue` у MFileUpload (очередь приложения); демо CRM держит очередь в листе сделки.
- Q-17 пикер MFileUpload — голый sr-only `input type=file`, политика файлов — один раз.
- Q-18 удаление незапущенной строки — только `remove`, без `cancel`/«Cancelled».
- Q-19 accepting у dropzone — сплошная рамка.

## Что сделано (файлы)

- Движок: `composables/dropdown/{useDropdownControl,types}.ts` (canOpen, landOnValue, select-only
  attrs, указатель активирует без прокрутки, явные импорты типов), `composables/listbox/useListbox.ts`
  (`setActive(index, { scroll })`, явный тип возврата), `composables/autocomplete/useAutocomplete.ts`.
- Перенос: `utils/dropdown/{useDropdownChips (RTL),useDropdownEntries,useDropdownKeyboard,
  useDropdownSelection (тип возврата),usePanelStatus}.ts`; новые `utils/dropdown/{panelState
  (+spec),useSelectionShell}.ts`; `utils/file-upload/context.ts`.
- Фрагменты: `components/fragments/dropdown/{Panel,Chips}.vue`.
- Компоненты: `components/ui/{dropdown,autocomplete}/{index.vue,props.ts}` (defineSlots, messages,
  клик по коробке/рамке, очистка возвращает фокус, корень не пересылает клавиши), `search/{index.vue,
  props.ts}`, `file-input/{index.vue,props.ts}`, `file-upload/{index.vue,props.ts}`,
  `fragments/file-upload/{List,Item,Dropzone}.vue`, `composables/file-upload/useFileUploadQueue.ts`
  (`subscribe`, `canUpload`, тип `FileUploadQueue`).
- Стили: `dropdown/{_index,_field}.scss` (+ удалён `_panel.scss`), `file-upload/{_index,_parts}.scss`,
  `file-input/_index.scss`.
- `shared/utils/file/index.ts` (+ `syncInputFiles`), `shared/constants/messages.ts` (−5 ключей).
- Демо: `playground/app/demo/crm/{details/CrmDealFiles,details/CrmDealSheet}.vue`,
  `composables/useCrmDealUploads.ts`.
- Фикстуры `playground/fixtures/<name>/cases.vue` (5 шт.), `messages` в фикстурах dropdown/autocomplete.

## Очередь: как сделано плавное удаление (не очевидно, не «упрощать»)

- Уходящая строка выходит из потока (`-row-leave-active { position: absolute }`), остальные съезжают
  FLIP-ом `TransitionGroup` (`-row-move`, transform).
- FLIP ломается, если группа рендерится дважды за один flush: второй рендер перезаписывает позиции,
  от которых строки должны ехать (проба w4-select-files-017/020/021). Поэтому: на группе нет `v-show`
  (пустой список — модификатор `--empty`), счётчик уходящих строк считается в watch до рендера, а не в
  `@before-leave` (изменение состояния посреди патча группы = второй рендер).
- Строки под слотом `#item` идут через функциональный компонент: `<slot v-for>` под группой — фрагмент,
  который сервер пишет, а клиент разворачивает (расхождение гидрации на каждой строке).
- Список, который помещается в свой бокс, на время оседания не обрезает строки (`--settling`,
  `overflow-y: visible`): иначе съезжающая строка пропадала и въезжала из-под нижнего края. Фокус соседу —
  `preventScroll` (иначе список прокручивался к ещё не доехавшей строке — скачок на 72rem).
- Содержимое под очередью (кнопка, соседние поля) сдвигается сразу при удалении — высоту в потоке не
  анимируем (решение владельца «только transform»).

## Закрытые пункты аудита

SEL-1…SEL-16, SEL-18…SEL-25 (SEL-5/SEL-6 — хуками w3), SR-1…SR-6, FI-1, FI-2, FI-4…FI-7,
FU-1…FU-19. Не сделано: SEL-17 (generic `TItem` из `items`) — типовые пропы требуют типового интерфейса
пропов поля (иначе два дома дефолтов); FI-3 (многоточие) — у w3.

## Тесты и гейты

- `npx eslint` и `npx stylelint` по путям группы — 0 ошибок; `lint:scss` — 154 компилируются, 0 deprecations
  (на момент прогона; чужие файлы в процессе правок у w1/w3/w5 временно падали — не мои).
- `npm run typecheck` — ошибки только в `playground/render/**`.
- Vitest: dropdown, autocomplete, search, file-input, file-upload, queue, utils/dropdown, shared/utils/file,
  color-picker — 16 файлов, 232 теста, зелёные.
- e2e у дирижёра: w4-select-files-009 (dropdown+autocomplete 73/76; 2 axe-флака прошли на повторе, 1 тест
  поправлен), 010 (89; 6 упавших — поле вне вьюпорта, тест поправлен), 011, 012, 013 — см. финальный ответ.

## Проверено скриншотами / не проверено

Скриншоты P1 (-001…-008). После правок визуально не смотрено: панель с новыми слоями (значения слоёв
проверены e2e), сплошная рамка accepting (computed-стиль проверен e2e), полоса прогресса поверх отступа,
«Start uploads» по ширине подписи.

## Ломающие изменения и миграция

- Классы панели: `ui-dropdown__{list,option,option--active,option--keyboard,check,state,progress,
  option-title}` и то же с `ui-autocomplete__` → `ui-dropdown-panel__{list,option,…,title}`.
- `MESSAGES.dropdownClear/Toggle/Loading/Empty/NoResults` удалены: передайте
  `:messages="{ clear, toggle, loading, empty, noResults }"`.
- Нет пропов `autocomplete` (MDropdown, MFileInput), `loading` (MSearch, MFileUpload); нет модификаторов
  `--multiple` и `ui-search--empty`.
- MDropdown: input больше не `readonly` (кроме пропа `readonly`).
- MAutocomplete: `update:search` больше не получает заголовок выбранного при выборе и blur.
- MFileUpload: внутри нет `MFileInput` (`.ui-file-input`); `addFiles` в `#dropzone` — один аргумент;
  удаление незапущенной строки не испускает `cancel`.
- Чипы dropdown/autocomplete не tab stop.
- `useDropdownChips`, `useDropdownEntries`, `useDropdownKeyboard`, `useDropdownSelection`,
  `compareByIdentity`, `usePanelStatus`, `provide/useFileUploadContext` — не в автоимпорте
  (`#kit/utils/dropdown/…`, `#kit/utils/file-upload/context`).

## Открытые вопросы, риски и долги

- Демо (не мои файлы): MAutocomplete/MDropdown в `demo/{orders,crm}` без `messages` — кнопки очистки и
  toggle без имени (dev-warn). Нужны русские фразы в демо — заявка оркестратору.
- `messages.ts`: шапка «every one of these is also a prop» неверна для оставшихся ключей.
- SEL-17, FI-3 — см. выше. CSS-размеры «после» — из финального прогона P3.
- Dropdown IME: композиция видна до `compositionend`, затем откатывается (страховка, не запрет).
- Рамка поля между коробкой и строкой поддержки открывает dropdown/autocomplete (стык с TF-B2 w3).

## Выходной CSS (база `baseline/css-sizes.json`)

dropdown 2449 B / 754 gz, autocomplete 2247 / 658, search 2582 / 793, file-upload (+ file-input) 6299 /
1212. Ожидание: CSS панели — один раз во фрагменте (−~1.9 KB), слой вместо 4 смесей, −0.76 KB
`use-scrollbar` у очереди. Факт — в финальном прогоне.
