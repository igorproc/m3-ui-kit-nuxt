# Sweep run 2 · G4 (поля и пикеры) — решения по рекомендации

Для переноса оркестратором в `docs/system/{en-US,ru-RU}/decisions.md`. Пункты с id взяты из
`kit-bugs/questions.md` и аудита планов; без id — новые развилки, решённые по рекомендации.

| Пункт | Решение | Причина |
|---|---|---|
| Q30-А | `MDropdown` / `MAutocomplete` отправляют по одному `<input type="hidden">` на выбранное значение под `name ?? path`; целый элемент без `item-value` — его `id`; видимый инпут без `name`; в disabled скрытые поля `disabled` | семантика `<select multiple>`, форма получает значение, а не заголовок |
| Q32-А | Без английских дефолтов: number-input (`incrementLabel`, `decrementLabel`, `unitLabel`), textarea (`resizeLabel`), date-picker (все 11 фраз), time-picker (`ariaLabel`, `hourLabel`, `minuteLabel`, `periodLabel`, `hourError`, `minuteError`), dialog-date (`cancelLabel`, `confirmLabel`). Ключи удалены из `MESSAGES` (остались только `hotkeyKeys` — G5). Dev-предупреждение — общий `utils/phrases/missing.ts` (по разу на проп, только для частей на экране) | правило «кит не поставляет английский текст»; `locale: 'en-US'` остаётся — это формат |
| Q32-А · буквы шаблона даты | `MESSAGES.datePattern*` удалены. Новый проп `patternLetters: { day, month, year }` без дефолта: буквы раскладываются в порядке и с разделителем локали. Без него и без `placeholder` шаблона нет | «DD/MM/YYYY» — английские буквы; проп сохраняет раскладку по локали, а не только целую строку `placeholder` |
| Q32-А · отказ без слов | Поле даты и поля времени отказывают и без текста: состояние ошибки, `aria-invalid` и глиф остаются, текста нет (`refusal` отделён от сообщения) | иначе при отсутствии `errorPattern`/`hourError` отказ стал бы невидимым |
| Q37-А | `MDatePicker.modeToggle` по умолчанию `false`, подписи переключателя без дефолта, dev-предупреждение при включении | одна логика с `MTimePicker` |
| Q38-А | без изменений; тест закрепляет 11 AM → ArrowUp → 12 AM | как в нативном `<input type=time>` |
| Q51-Б (N.7) | Проп `valueType: 'date' \| 'string' \| 'number'` (по умолчанию `'date'`) у `MDatePicker` и `MDialogDate`: тип записи в пустую модель; модель со значением сохраняет свой тип | явный формат для форм с `null`, умолчание прежнее |
| Q52-А (N.10) | Токен `panel.min-width: 200rem` в карте dropdown, правило `&__menu { min-width }` в общем миксине поля: `min-width` перекрывает `width: anchor-size(width)`. `overflow-wrap` не трогал (modern-web: при заданной ширине `anywhere` и `break-word` рвут одинаково) | панель узкого поля читается |
| Q33-А | `MTextField type="search"`: `::-webkit-search-cancel-button` и `-decoration` — `appearance: none` | очистка — у `MSearch` или кнопки в `#append` |
| Q34-А | При вставке пробелы (любые `\s`, в т.ч. NBSP), дефис и `‐`/`‑` (U+2010/U+2011) отбрасываются без `invalid`; прочие символы называются в `invalid`. Набор с клавиатуры не меняется | отформатированный код из SMS — не ошибка; U+2010/2011 — те же дефисы, их ставит почтовый клиент |
| Q31-А | `units` задан, `v-model:unit` пуст → первый вариант пишется в модель в `onMounted` фрагмента `Unit.vue` | сервер уже рисует первый вариант; запись после монтирования не меняет состояние родителя посреди SSR-рендера (иначе `useState` родителя расходится с его серверным HTML) |
| B6.4a | `aria-valuetext` = значение + единица («42 kg»; у меню — подпись выбранной, при пустой модели — первой) | единица, видимая только глазами, не слышна |
| B6.4d | `ui/number-input/unit.vue` → `fragments/number-input/Unit.vue` | не публичный компонент; имя больше не конфликтует с типом `MNumberInputUnit` |
| scrub (modern-web §3.2) | `touch-action: pan-y` на метке-скрабе вместо `none` | горизонтальный жест, вертикальный свайп прокручивает страницу |
| B6.3a/b | Автокомплит: `onInput` ставит флаг «пользователь хочет список» и решает в `nextTick` по `canOpen()` (который знает `#hint`); пока флаг стоит и поле в фокусе, панель открывается, как только `canOpen()` станет `true` (удалённый `loading`, пришедший позже). Флаг снимается при dismiss/blur | первый удалённый символ открывал панель только при синхронном ответе родителя |
| B6.3c | `panelState` получает `queried`: пустой список при набранном запросе — `no-results`, `empty` — только без запроса | ответ сервера «ничего» на запрос — «нет результатов» |
| IME (modern-web) | Общий предикат `utils/keyboard/ime.ts`: `isComposing \|\| (key === 'Enter' && keyCode === 229)`; 229 — только под Enter (виртуальные клавиатуры шлют 229 для обычных символов) | Safari (WebKit 165004) присылает подтверждающий Enter после `compositionend` |
| Аудит autocomplete | Заголовок обновляется и при смене `displayTitle` (элементы пришли после значения), не только модели | поле показывало id до blur |
| B7.1a | `MTimePicker`: `errorMessage` без `error` — ошибка (текст, `aria-invalid`, рамка полей) | как у `MDatePicker` |
| B7.1d | `radiogroup` селекторов назван как пикер: `aria-labelledby` заголовка, иначе `aria-label` | безымянная группа |
| B7.1f | `selectYear` зажимает месяц в `[min, max]` | сетка не открывается на месяце без доступных дней |
| Аудит time-picker | PageUp/PageDown на циферблате — ±5 (минут или часов) с переходом через ноль, перехват в `useTimeDialControl` | по плану; общий `createRangeKeyboardController` (зона G1) не тронут |
| Аудит date-picker | Недоступный день и весь disabled-пикер — цветовыми ролями (`color-mix` на 38 %: on-surface, primary, on-primary), без `opacity`; мишень 48 — общий миксин `touch-target` (G1, coarse pointer): день по обеим осям, год — по блочной | `opacity` гасит и кольцо фокуса; S8 |
| B7.2a | Смена формата в селекторе пикера, переписавшая модель, эмитит `change`; смена формата родителем — нет | пользовательское действие = коммит |
| B7.2b | `format="auto"` стартует с семейства модели | — |
| B7.2c | Blur коммитит только изменённый черновик; заодно исправлен корень: синхронизация черновика срабатывала на blur раньше коммита, и правка на blur терялась | «#abc» не переписывается фокусом; правка не пропадает |
| B7.2d | `:picker="false"` — образец `<span aria-hidden>`, без кнопки | — |
| B7.2e | Формат без альфы рисует цвет непрозрачным (пикер и образец поля) | — |
| Аудит color-picker | Образец «выбран», если цвет совпадает в записи текущего формата (`formatColor` обоих) | hsl/hsla round trip даёт дробное расхождение |
| B7.3a | `MFileInput.clear()` возвращает фокус в поле | кнопка очистки уходит вместе с файлами |
| B7.3d | `upload` читается при каждом старте (геттер в опциях очереди; `canUpload` очереди — геттер); `queue` — при setup, задокументировано | — |
| B7.3f | `start(id)` сбрасывает `error` и `progress`, как `retry` | строка, ждущая слота, не показывает прошлую ошибку |
| Q39-А | `multiple: false`: новый выбор заменяет файл (его загрузка отменяется, `remove` эмитится), `maxFiles` не считает заменяемый | как нативный single input |
| Аудит files | Строка отказа называет все отказанные файлы последнего выбора: «a.txt: тип; b.png: размер» (`describeRejection` в `shared/utils/file`); слот `#rejection` получает `rejections` вместо `rejection` (до 1.0 без алиаса) | при пакетном отказе была видна одна причина |
| Аудит otp | Разделитель в disabled — цвет disabled-content | был ярче ячеек |
| MMenu (G2) | `absolute` убран, `origin` → `placement` (`bottom-end` у меню единиц number-input — это настоящее меню с `menuitemradio`), ручная RTL-компенсация удалена | новое API G2 |
| Q14-А (G2) · меню единиц number-input | Пункты — `MMenuItem role="menuitemradio" :selected` внутри `MMenuGroup`; галочка — ведущий глиф `MMenuItem` вместо своей в конце строки; заливка выбранного (`secondary-container`) оставлена составным селектором `.ui-number-input__unit-option.ui-menu__item.ui-menu__item--selected`; токен `unit.selected.check` удалён | один рецепт пункта меню в ките |
| W17-Б (G1) · чипы dropdown/autocomplete | `fragments/dropdown/Chips.vue` на оси `removal`: `'whole'` (вне read-only `'none'`), имя удаления — новая фраза `messages.remove` с `{title}` («Remove {title}»), как `{name}` у `MFileUpload`; без фразы чип называется своим заголовком, предупреждает сам `MChip`. Свой `#trailing`-глиф и `@click` удаления сняты | один источник поведения удаления — `MChip`; фраза без дефолта |
| Q16-Б (G2) · панели полей | `MDropdown` / `MAutocomplete` открывают listbox в приватном `fragments/popover` без `trapFocus` (без роли и клавиатуры меню; фокус остаётся в комбобоксе); `match-width` и `min-width` N.10 сохранены (класс `__menu` теперь на `.ui-popover`). Известное нарушение axe `aria-required-children: .ui-menu__surface` ушло, e2e ждут `[]` | listbox не лежит внутри `role="menu"` (modern-web, viewport-aware-dropdowns) |
| Q16-Б (G2) · MColorInput (план color-input, шаг 1) | Пикер в `Popover` с `trap-focus`, на поверхности `role="dialog"` и `aria-label` = `pickerLabel`; фокус при открытии — на первый контрол пикера; гашение навигационных клавиш и RAF-возврат фокуса удалены (Esc и кнопка возвращают фокус средствами панели, клик снаружи — нет) | набор контролов — диалог, а не меню; Tab ходит внутри |
