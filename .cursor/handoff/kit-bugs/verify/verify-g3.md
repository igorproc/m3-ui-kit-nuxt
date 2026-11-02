# verify-g3: B6, B7, N.7, N.9, N.10 vs working tree (HEAD 64fb4dc + uncommitted), 2026-10-23
Paths relative to `src/runtime/`. «MESSAGES-вопрос» is asked once at B6.4c; B6.6c, B7.1b, B7.1c refer to it. This branch already dropped `dropdown*` from `shared/constants/messages.ts`; older components still use `MESSAGES`.

## B6. Fields and selection

### B6.1a Checkbox/radio/switch: aria-invalid, no error message
status: present — `components/ui/checkbox/index.vue:16`, `radio/index.vue:17`, `switch/index.vue:17`; no support line in any template
kind: fork
question: Показывать ли у MCheckbox/MSwitch/MRadio текст ошибки? (при `path` причина сейчас видна только цветом и aria-invalid)
А: нет, текст рисует приложение (как в M3; ошибка адаптера снаружи недоступна).
Б: да, строка поддержки (`helperText`/`errorMessage`/`error`), резерв только когда есть что показать (решение 2026-10-19).
В: не рисовать, отдать `errorMessage` через слот.
Рекомендация: Б — consent-чекбокс с валидацией иначе не назовёт причину; правило резерва уже есть.

### B6.1b Switch has no error look
status: present — `switch/index.vue:64-69` (only checked/disabled); checkbox has `--error` (`checkbox/index.vue:68-73`)
kind: bug
fix: `ui-switch--error` modifier + error track/outline tokens in the switch map, as checkbox.

### B6.1c User `id` replaced; `name` without `path` dropped
status: present — `checkbox/index.vue:9,13`, `switch/index.vue:9,13`: `:id="fieldId"`/`:name="path"` follow `v-bind="controlAttrs()"` and win. Radio: only `id` (`radio/index.vue:9`; its `name` is a prop).
kind: bug
fix: `id = attrs.id ?? useId()`; declare a `name` prop (as radio), bind `name ?? path`.

### B6.1d Default slot renders only with `label`
status: present — `checkbox/index.vue:30-36`, `switch/index.vue:27-33`, `radio/index.vue:29-35` (`<span v-if="label"><slot>`)
kind: bug
fix: `v-if="label || $slots.default"`.

### B6.1e `loading` ignored
status: present — checkbox/switch take it from `makeStateProps()` (`checkbox/props.ts:13`, `switch/props.ts:13`) but never read it; radio has no such prop (`radio/props.ts:12`), so `loading` falls onto the native input
kind: fork
question: Что делать с `loading` у MCheckbox/MSwitch?
А: реализовать (MLoading вместо ручки/галочки, aria-busy).
Б: убрать из пропсов (только `disabled`, как radio) — до 1.0 без шимов.
Рекомендация: Б — мёртвый проп хуже отсутствующего.

### B6.1f No indeterminate
status: present — absent in `checkbox/props.ts`, `checkbox/index.vue`
kind: gap
fix: `indeterminate` prop → `input.indeterminate`, dash glyph, `aria-checked="mixed"` (M3 has the state).

### B6.2a `name` sits on the visible input (forms post the label)
status: present — `components/ui/dropdown/index.vue:26`, `autocomplete/index.vue:23` (`:name="name ?? path"` on the text input); date/time-picker, rating, slider use `type="hidden"` (`date-picker/index.vue:15`)
kind: fork
question: `name` у MDropdown/MAutocomplete постит заголовок, а не значение — как отдавать значение форме?
А: скрытые `<input type="hidden">` со значением (объект без `itemValue` — `item.id`), по одному на значение при `multiple`; видимый input без `name`.
Б: оставить, документировать «отправляйте из v-model».
Рекомендация: А — единый приём в ките, семантика `<select multiple>`.

### B6.2b Without `messages` clear/toggle are nameless
status: present, by design — `dropdown/index.vue:81`, `autocomplete/index.vue:80,94` (`messages?.clear|toggle`, no default); dev-warning: `utils/dropdown/useSelectionShell.ts` `useUnnamedControlWarning`, called `dropdown/index.vue:230`, `autocomplete/index.vue:266`
kind: doc
fix: keep (no English copy); document «pass `messages.clear`/`toggle`».

### B6.2c Generic `TItem` from the model, not `items`
status: present (deferred) — `components/ui/dropdown/props.ts:74` (`items: readonly DropdownItemBase[]`), SFC is `defineProps(mDropdownProps)` + `generic=` (`dropdown/index.vue:164`)
kind: gap
fix: type the SFC props through the existing `MDropdownProps<TItem,TValue>` (`props.ts:120`).

### B6.3a `#hint` vanishes on the first keystroke
status: present — `composables/autocomplete/useAutocomplete.ts:151-152`: `onInput` opens only if `queryReady && canOpen()`, else `closePanel()`; with `minSearchLength>0` the first character closes the panel, so `hint` (`utils/dropdown/panelState.ts:21`) never shows while typing.
kind: bug
fix: drop the `queryReady` term in `onInput` (`canOpen()` already knows the `hint` slot).

### B6.3b First remote keystroke may not open the panel
status: present — `useAutocomplete.ts:151`: `canOpen()` reads `props.loading`/`items` before the parent's `@update:search` handler re-renders → state `empty`, no content → `closePanel()`; nothing reopens it later.
kind: bug
fix: decide in a post-flush tick, or reopen when `canOpen()` turns true while focused and query ready.

### B6.3c `noResults` never shows with `:filter="false"`
status: present — `utils/dropdown/panelState.ts:23` (`items > 0 ? 'no-results' : 'empty'`); `filter=false` keeps every row (`utils/dropdown/matchRows.ts:33`), so a server's empty answer has `items=0` → `empty`
kind: bug
fix: pass «query typed and ready» into `panelState`: rows=0 + query → `no-results`, `empty` only without a query.

### B6.4a Static `unit` not announced
status: present — `components/ui/number-input/unit.vue:2-8` (plain span); `composables/number-input/useNumberInputControl.ts:182,244` (describedby = message only, valuetext without unit)
kind: bug
fix: put the unit label into `aria-valuetext` (or an id'd span in `aria-describedby`).

### B6.4b `null` unit + `units`: shows the first, model stays null, nothing checked
status: present — `unit.vue:123-125` (`current` falls back to `options[0]`), `:57` (`aria-checked` vs `modelValue`)
kind: fork
question: `units` задан, `v-model:unit` = null — что считать выбранной единицей?
А: первая; компонент пишет её в модель при монтировании (модель = экран).
Б: ничего не выбрано — триггер пуст, пункты без галочки.
В: показывать первую без записи + dev-warning «передайте начальный unit».
Рекомендация: А — модель не расходится с тем, что видит пользователь.

### B6.4c English labels (+ `locale: 'en-US'`)
status: present — `number-input/props.ts:65,67,69` (`MESSAGES.numberUnit|numberIncrement|numberDecrement`), `:50` locale, `unit.vue:106`
kind: fork
question (MESSAGES-вопрос): что делать с английскими дефолтами `MESSAGES` (number-input, textarea, date/time-picker, dialog-date) и дефолтным `locale: 'en-US'`?
А: убрать дефолты фраз, как у dropdown/search (props/`messages` + dev-warning); `locale` оставить 'en-US' — стабильный SSR-дефолт, это формат, не копирайт.
Б: оставить fallback до общего источника фраз через `materialKit` config (B13.3).
Рекомендация: А — правило «без английского копирайта», прецедент в этой ветке.

### B6.4d `MNumberInputUnit` public by accident
status: present — `components/ui/number-input/unit.vue` is under `components/ui/**` (registered with prefix `m`, `src/module.ts:150-155`) → `<MNumberInputUnit>`; clashes with the type of the same name (`number-input/props.ts:39`)
kind: bug
fix: move to `components/fragments/number-input/Unit.vue` (fragments are not registered), import explicitly.

### B6.5a MSearch `v-model:focused=true` doesn't focus
status: fixed — model removed in search v2 (`components/ui/search/index.vue:159-160` only `modelValue`/`open`); `focus()` exposed (`:252`)
kind: doc
fix: none.

### B6.5b MSearch Enter: no `preventDefault`, submits when empty
status: partly — `preventDefault` done (`utils/search/useSearchControl.ts:194`); `submit` still emitted for `''` (`:196`)
kind: doc
fix: document «`submit` also fires for an empty query; guard in the handler».

### B6.5c MSearch clear button nameless without `clear-label`
status: partly — `clearLabel` → `messages.clear`; dev-warning stays by design (`search/index.vue:246-248`)
kind: doc
fix: none; pass `:messages="{ clear }"`.

### B6.6a `MTextField type="search"` keeps the native cancel button
status: present — no `::-webkit-search-cancel-button` rule in `assets/stylesheet/components/text-field/`; MSearch hides it (`search/index.vue:348`)
kind: fork
question: Прятать ли нативную «×» у `MTextField type="search"`?
А: прятать (как MSearch); очистка — `#append` или MSearch.
Б: оставить (рабочая, но без имени/локали/токенов кита).
Рекомендация: А — для поиска есть MSearch с настоящей кнопкой.

### B6.6b `MOtpInput` paste `123-456` emits `invalid ['-']`
status: present — `composables/otp-input/useOtpControl.ts:250` → `useOtpValue.ts:135` (`onInvalid` with `rejected`)
kind: fork
question: Вставка `123-456` проходит, но эмитит `invalid ['-']` — что считать ошибкой?
А: разделители (пробел, дефис, NBSP) при вставке молча игнорируются; `invalid` — для прочих символов.
Б: при вставке `invalid` не эмитится, если очищенный код полный.
В: оставить, потребитель фильтрует.
Рекомендация: А — отформатированный код из SMS/почты не ошибка.

### B6.6c `MTextarea resizeLabel` = "Resize"
status: present — `components/ui/textarea/props.ts:44` (`MESSAGES.textareaResize`)
kind: fork
question: см. MESSAGES-вопрос (B6.4c). Рекомендация: А.

### B6.7 Chip-row field asks ~60rem in auto-width contexts
status: present (accepted) — `assets/stylesheet/components/text-field/_parts.scss:33-37` (`contain-intrinsic-inline-size` = `input-min-width`, 60rem, `_index.scss:78`)
kind: doc
fix: none; size from the container.

### B6.8 Support line not reserved by default; composites' own errors shift layout
status: present (accepted) — `utils/text-field/supportLine.ts:48-55`
kind: doc
fix: none; bind `error`/`errorMessage` (even empty) or `path`.

### B6.9 Field axes use private `--ui-*` vars
status: present (deferred) — `assets/stylesheet/components/text-field/_index.scss:101-103`, `text-field/_label.scss:36-113`, number-input/textarea sheets; vs `docs/system/en-US/decisions.md:46` (density in pure Sass)
kind: fork
question: Оси полей живут в приватных `--ui-*` вопреки decisions.md (density в чистом Sass) — переписывать?
А: развернуть в Sass `@each` по осям (zero-runtime, но CSS полей вырастет кратно: density × shape × label × variant).
Б: принять как задокументированное исключение (живая геометрия от комбинации осей), записать в decisions.md.
Рекомендация: Б — А раздувает вывод ради принципа.

### B6.10a `textarea` is single-line
status: present — `components/fragments/form-renderer/field/index.vue:10-16` (renders `m-text-field`)
kind: bug
fix: render `MTextarea` for `textarea`.

### B6.10b `search` lacks `type`
status: present — `field/index.vue:2-8` (text and search share one branch, no `:type`)
kind: bug
fix: `:type="field.type === 'search' ? 'search' : undefined"`.

### B6.10c "Submit" is English
status: present — `components/ui/form-renderer/index.vue:21`
kind: bug
fix: `submitLabel` prop with no default (+ dev-warning when the default button is used without it).

### B6.10d Config is read once
status: present — `form-renderer/index.vue:40` (`useFormSchema(props.config, …)` in setup; adapter `createForm` is not reactive)
kind: fork
question: MFormRenderer читает `config` один раз — делать реактивным?
А: оставить (beta), документировать: смена схемы = `:key` на рендерере.
Б: пересоздавать форму при смене `config` (введённое теряется; нужна поддержка в адаптере).
Рекомендация: А — до конца beta реактивная схема не нужна, «собрать вручную» остаётся.

### B6.10e Optional `number` can't be empty
status: present — `composables/useFormSchema.ts:85-88` (empty number = `null`); `adapters/vee-validate/schema.ts:16-18` (`yup.number()` not nullable → `null` fails without `required`)
kind: bug
fix: `yup.number().nullable()` for non-required numbers (`required()` still rejects `null`).

### B6.10f No `onError`
status: present — props are `config`/`onSubmit` only (`form-renderer/index.vue:33-36`); `form.isError` only reaches the actions slot
kind: gap
fix: `onError` from the adapter's failed submit.

### B6.10g Radios get no shared `name`
status: present — `field/index.vue:51-57` (`m-radio v-for` with `path`, no `:name`); standalone radio takes `name` from its prop (`radio/index.vue:87-91`) → no native grouping/arrow navigation
kind: bug
fix: `:name="field.name"` on each radio, or `MRadioGroup`.

## B7. Pickers, colour, files

### B7.1a `MTimePicker` shows `errorMessage` only with `error`
status: present — `components/ui/time-picker/index.vue:159` (`props.error ? props.errorMessage : undefined`) vs `date-picker/index.vue:270-273` (`error || errorMessage`)
kind: bug
fix: accept `errorMessage` alone (in `hasError`/`supportShown`), as date picker does.

### B7.1b Mode toggle on + English in `MDatePicker`, off in `MTimePicker`
status: present (deferred) — `date-picker/props.ts:35-41` (`modeToggle: true`, English labels) vs `time-picker/props.ts:29-33` (`false`, no labels), dev-warning `time-picker/index.vue:123-127`
kind: fork
question: Выровнять MDatePicker с MTimePicker (toggle выключен по умолчанию, подписи обязательны, dev-warning)? Часть MESSAGES-вопроса (B6.4c). Рекомендация: А — как у времени.

### B7.1c `locale: 'en-US'` + English `MESSAGES` in pickers
status: present (deferred) — `date-picker/props.ts:33`, `time-picker/props.ts:38,46-53`, `components/ui/dialog/date/props.ts:28-29`
kind: fork
question: см. MESSAGES-вопрос (B6.4c). Рекомендация: А.

### B7.1d Time hours/minutes radiogroup unnamed
status: present — `components/fragments/time-picker/selectors/index.vue:2-5` (`role="radiogroup"`, no label)
kind: bug
fix: `aria-labelledby` = headline id, else `aria-label` = `ariaLabel`.

### B7.1e 12h ArrowUp 11 AM → 12 AM
status: present — `composables/time/useTimeDialControl.ts:101-117` (index wraps 0..11, period kept) + `utils/time/createClock.ts:85,122` (`toHours(0,'am')=0`)
kind: fork
question: На 12-часовом циферблате ArrowUp на 11 AM даёт 12 AM (период сохраняется) — менять?
А: оставить — период переключается отдельно, как в нативном `<input type=time>` и M3-диалоге.
Б: шаг через 12 переносит период (11 AM → 12 PM, 11 PM → 12 AM).
Рекомендация: А — совпадает с платформой.

### B7.1f `selectYear` doesn't clamp to min/max
status: present — `composables/date/index.ts:103-106` (`month.year(year)`, no bounds)
kind: bug
fix: clamp the month into `[bounds.min, bounds.max]` months.

### B7.2a Popover format change rewrites `v-model` without `change`
status: present — `utils/color-picker/context.ts:146-157` (`setFormat` → `syncModel()`, never `commit()`); MColorInput emits `change` only on the picker's `@change` (`color-input/index.vue:273`)
kind: bug
fix: `commit('format')` after `setFormat` rewrites the model.

### B7.2b `auto` starts as hex
status: present — `components/ui/color-input/index.vue:136` (`detectedFormat = ref('hex')`; detection only on commit, `:198-203`)
kind: bug
fix: init from `detectFamily(model.value) ?? 'hex'`.

### B7.2c Every blur commits (unchanged too)
status: present — `color-input/index.vue:177-179` (`commitDraft()` on each focus loss); rewrites a non-canonical model (`#abc` → `#aabbcc`) and re-emits `clear`/`invalid` per blur (`:213-236`)
kind: bug
fix: commit only when `draft !== displayValue`.

### B7.2d `:picker=false` leaves a live button
status: present — `color-input/index.vue:46-60` (trigger button always rendered; only `MMenu` has `v-if="picker"`, `:69`)
kind: bug
fix: render an aria-hidden swatch `<span>` when `!picker`.

### B7.2e Hex keeps alpha
status: present (reading inferred) — a `hex` model with alpha (`#ff000080`) loads `a=.5` (`utils/color-picker/context.ts:83-90`); text shows `#ff0000` (`shared/utils/color/index.ts:207`) but the swatch stays 50 % (`color-input/index.vue:147-150`) and no alpha slider exists to reset it
kind: bug
fix: with a no-alpha format, keep `a = 1`.

### B7.3a `MFileInput` clear drops focus to `body`
status: present — `file-input/index.vue:270-275` (`clear()` moves no focus; the button leaves via `v-if … files.length > 0`, `:71`)
kind: bug
fix: focus the field input in `clear()`.

### B7.3b `MFileUpload :multiple=false` limits each pick, not the queue
status: present — `components/ui/file-upload/index.vue:216` (`slice(0, 1)` per pick), `:220` appends to `model`
kind: fork
question: `:multiple="false"`: что делать со вторым выбором при занятой очереди?
А: новый файл заменяет прежний (идущая загрузка отменяется) — как нативный single input.
Б: отказ с причиной (`maxFiles`), пока прежний не удалён.
Рекомендация: А — привычная семантика одного файла.

### B7.3c `required` not exposed
status: partly (meaning inferred) — `file-upload/index.vue:14-19,33`: `required` only paints `*` and sets it on the hidden aria-hidden input; no `error`/`errorMessage`/`path`/`validate()` (MFileInput has them)
kind: gap
fix: error props (+ optional `path`), `aria-required`/`validate()` for the group.

### B7.3d `queue` (and `upload`) read once
status: present — `file-upload/index.vue:157-159` (`props.queue ?? useFileUploadQueue({ upload: props.upload … })` in setup)
kind: bug
fix: `upload: (f, ctx) => props.upload?.(f, ctx)`; document `queue` as setup-time.

### B7.3e Remount restarts `auto-start` (shared `queue`?)
status: partly — spec `file-upload/index.spec.ts:162-175` (queue + same `v-model` → nothing re-sent). Residual: shared queue + empty local `v-model` is pruned by the immediate watcher (`index.vue:265-270`); `onMounted` (`:276`) starts rows left `queued`
kind: doc
fix: document «keep `v-model` next to `:queue`».

### B7.3f `start(id)` keeps old `error`/`progress`
status: present — `composables/file-upload/useFileUploadQueue.ts:150` (`start(id)` sets `queued`, leaves `error`/`progress`; `retry` clears them)
kind: bug
fix: clear both in `start(id)` (or delegate to `retry`).

## N.7, N.9, N.10

### N.7 `m-dialog-date` returns `Date` for a `null` model
status: present (documented) — `utils/date/value.ts:26-31` (type follows the previous value; `null`/Date → Date), `date-picker/props.ts:8-10`; a `''` model already yields `YYYY-MM-DD`
kind: fork
question: `v-model:date = null` отдаёт `Date` — что отдавать при пустой модели?
А: оставить Date (обход — стартовать с `''`).
Б: проп `valueType: 'date'|'string'|'number'` (по умолчанию 'date') для пустой модели.
В: при `null` всегда `YYYY-MM-DD` (ломает ожидающих Date).
Рекомендация: Б — явный формат для форм с `null`, умолчание не меняется.

### N.9 `m-slider`: no value formatter, `ariaValuetext` not forwarded
status: present — `slider/index.vue:100` (`useSliderControl` called without `ariaValuetext`); `fragments/slider/thumb/index.vue:20-24` prints raw `{{ value }}`, its `#value` slot is not forwarded; `composables/slider/useSliderControl.ts:116,390` already supports `ariaValuetext`. Range thumb names fall back to English «start»/«end» (`index.vue:83-88`)
kind: gap
fix: `formatValue(value, index)` prop feeding thumb label and `ariaValuetext`; forward `#value`; drop the English fallback (dev-warning instead).

### N.10 `m-autocomplete`/`m-dropdown`: panel = field width, rows break mid-word
status: present — `composables/popover/usePopover.ts:196,222` (`match-width`: `anchor-size(width)` / measured px); `fragments/dropdown/Panel.vue:246` (`overflow-wrap: anywhere` collapses min-content); no `min-width`
kind: fork
question: Панель в узком поле равна его ширине и рвёт слова — как лечить?
А: компонентный токен `panel.min-width` (rem): `min-width` перекрывает `width: anchor-size(width)`, панель шире узкого поля.
Б: `overflow-wrap: break-word` вместо `anywhere` (слова не рвутся, пока помещаются).
В: оставить, документировать минимальную ширину поля.
Рекомендация: А + Б как сопутствующая правка — читаемость не зависит от ширины поля, системные токены не нужны.
