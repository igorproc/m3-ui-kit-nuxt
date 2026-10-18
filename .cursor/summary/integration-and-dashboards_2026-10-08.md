# Интеграция data + inputs и два демо-дашборда — 2026-10-08

Оркестратор свёл итоги групп data и inputs (подробности — в их summary:
`data-group-m3_2026-10-07_2157.md`, `inputs-group-m3_2026-10-08_0016.md`, разделы «E2E и
доработки 2026-10-08»), прогнал e2e, раздал падения и решения владельца, а два агента собрали
демо-дашборды на ките. Коммитов нет.

## Решения владельца (этот раунд)

| Тема | Решение |
|---|---|
| Выбор строк `MTable` | живёт в модели и переживает смену страницы; «выбрать все» — текущая страница; исчезнувшие строки таблица не удаляет |
| Хелперы таблицы | `composables/table/tableModel` → `utils/table/{model,warnings}` (не автоимпортируются) |
| `MLoading` | без английского `aria-label` по умолчанию; хост прячет индикатор `aria-hidden`, без имени — dev-предупреждение |
| Тонкая обводка | `max(1px, 1rem)` во всех outlined-компонентах; перевод остальных карт — отдельной задачей |
| 4% у отключённого filled-поля | новый системный ключ `disabled-container-subtle` — единственное исключение из «без новых токенов» |
| Длинная очередь file-upload | `max-height` из токена и своя прокрутка (CT-08) |
| Textarea disabled | подвал с контролами 38% + `inert`; подсказка и счётчик 38%, но в дереве доступности |
| Очередь file-upload запускала чужие строки | баг старше редизайна — чинить (починен) |
| Подсказка отключённого поля 38% vs axe | принять исключение WCAG 1.4.3; e2e пропускает `color-contrast` внутри `--disabled` |
| Кольцо фокуса 1px на 1201–1279px и в prod на 1280 | «ничего, пока это edge-case» |
| `spacing()` у потребителя | любой шаг (`spacing(96)` → `96rem`); строгая шкала — только для `src/runtime` в `lint:scss` (`$spacing-strict`) |
| Дашборды | две страницы playground в git, свои SVG-графики, без зависимостей; смотреть их не требуется |

Открыто: **подвал таблицы — встроить `MPagination` или свои «первая/последняя»** (см. ниже ответ агента B).

## Что сделал оркестратор

- `components/ui/loading/{props.ts,index.vue,index.spec.ts}` — без дефолтной подписи, DOM-проверка в dev.
- `abstracts/{_functions,_variables}.scss` — `spacing()` принимает любой шаг, флаг `$spacing-strict`.
- `shell/scss-smoke.mjs` — компилирует ещё и `playground/app` (обычная прелюдия потребителя);
  код кита — с `$spacing-strict: true`.
- `playground/e2e/support.ts` — `remInPx`, `waitForMotion` пропускает scroll-driven анимации,
  `expectNoAxeViolations` пропускает `color-contrast` внутри `--disabled`.
- `vitest.config.ts` — `hookTimeout: 30_000`.
- `playground/app/pages/index.vue` — ссылки на демо.
- `docs/system/{ru-RU,en-US}/{decisions,color-and-state}.md` — решения агентов и владельца.

## Как гонять e2e с агентами

Один dev-сервер оркестратора на `127.0.0.1:3200`, агенты запускают только свои спеки
(`--trace=off --output <свой каталог>` — общий `test-results` давал ENOENT). Полный прогон на
production-сборке: `npx nuxi build playground` (≈3 мин; webServer в CI-режиме падает по таймауту
180 с), `node playground/.output/server/index.mjs` с `PORT=3200 HOST=127.0.0.1`, затем
`npx playwright test --workers=4` (≈6 мин). В такой локальной prod-сборке падают ожидаемо: ~11
проверок «кольцо ≥ 2px» (edge-case выше) и dev-only тест карточки (он пропускается только при `CI`).

## Дашборды

| | `/demo/orders` (агент A) | `/demo/crm` (агент B) |
|---|---|---|
| Файлы | 35 файлов, 3474 строки, max 229 | 46 файлов, 4523 строки, max 293 |
| Где | `playground/app/demo/orders/**`, графики `demo/charts/{Sparkline,Bar}Chart.vue` | `playground/app/demo/crm/**`, графики `demo/charts/Crm*` |
| Главное | оболочка rail/bar, фильтры, KPI со спарклайнами, `MTable` со всеми состояниями, sheet деталей, форма заказа на 11 полях | rail/drawer по ширине, вкладки, воронка/прогноз/donut, доска сделок, `MTable` + внешний `MPagination`, задачи, sheet сделки с инлайн-правкой, `MFormRenderer` |

Ни одна страница не открывалась в браузере: проверены eslint, stylelint, typecheck и компиляция Sass
(`lint:scss` теперь включает `playground/app`). Глазами не проверены: вёрстка на телефоне, меню,
вложенный `MDialogDate` в `MDialog`, свайп sheet против его прокрутки, совпадение `Intl` ru-RU на
сервере и в браузере.

### Ответы на вопросы владельца (агент B)

- **`MPagination` снаружи `MTable` — работает чисто:** таблица не режет данные сама; приложению нужны
  свой выбор размера страницы и текст «1–10 из 42». Встроить `MPagination` в подвал мешают:
  английские имена страниц без пропа, camelCase `ariaLabel`/`ariaCurrent` в слоте (ломается в SSR),
  нет компактного режима «только ‹ ›», как в подвале M3. Рекомендация агента: делить чистые хелперы,
  а не компонент, пока у `MPagination` нет локализуемых имён и компактного режима.
- **`MFormRenderer` настоящую форму «новой сделки» не выражает:** схема знает только
  text/textarea/number/checkbox/switch/radio/search; `textarea` рисуется однострочным полем, `number` —
  снятым `type="number"`; свои поля только в слоте после схемы.

## Находки по киту (объединено A + B, проверено выборочно по коду)

**Дефекты — major**

| Компонент | Что не так | Где |
|---|---|---|
| `MDialog`, `MSheet` | высокое содержимое обрезается и не прокручивается (`overflow: hidden`, нет max-height) | `dialog/index.vue:95`, `sheet/index.vue:55-62` |
| `MMenu` | фокус возвращается `parentElement` триггера, а не триггеру; `role="menu"` нельзя назвать; нет `MMenuItem`; `absolute` по умолчанию `false` | `menu/index.vue:140-145`, `:31`, `props.ts:9` |
| `MTooltip` | `aria-describedby` на обёртке, а не на фокусируемом элементе — подсказка не озвучивается | `tooltip/index.vue:8-14` |
| `MPagination`, `MAlert`, `MBanner` | camelCase `ariaLabel`/`ariaCurrent` в слотовых привязках — в SSR-HTML уходят `arialabel=` | `pagination/props.ts:38-47`, `alert/props.ts:42-48` |
| `MPagination` | имена страниц («Page N…») захардкожены по-английски | `pagination/index.vue:120-122` |
| `MDropdown`, `MAutocomplete` | имена кнопок очистки/раскрытия и статус загрузки — английский хардкод без пропа | `dropdown/index.vue:88,135`, `autocomplete/index.vue:85,99,142` |
| `MDialogDate` | не пробрасывает подписи `MDatePicker`; `confirm` при одностороннем `:date` отдаёт старую дату | `dialog/date/index.vue:13-21`, `:128-129` |
| `MSnackbar` | live-регион монтируется вместе с текстом (`v-if`); нет таймаута; перекрывает `MNavigationBar` | `snackbar/index.vue:14-18,117` |
| `MLayoutMain` | `container-type: inline-size` делает main контейнером для `position: fixed` (FAB); `overflow-y: auto` всегда — `sticky` внутри не работает | `layout/main.vue:26-34` |
| `MTabs` | начальный `v-model` не применяется в SSR — сервер рисует первую вкладку (по чтению кода) | `tabs/index.vue:52-58` |
| `useHotkey` | сравнивает только `key`, не `code` — на русской раскладке «N» не срабатывает | `composables/hotkey/format.ts` |
| `MFileUpload` | статус загрузки не в модели: ремаунт (переключение `MTabsPanel`) перезапускает `auto-start` | `file-upload/index.vue:248-253` |
| `MFormRenderer` | однострочный `textarea`, снятый `type="number"`, нет `novalidate`, радио без общего `name`, `required` не помечает поле | `fragments/form-renderer/field/index.vue`, `useFormSchema.ts` |
| `MChip` | одиночный filter-чип не выставляет `aria-pressed` | `chip/index.vue:8` |

**Дефекты — minor**: `MBadge` всегда `role=status aria-live` без подписи; `MToolbar` без
`role=toolbar` и с захардкоженными отступами; `MTable` — `statusText` заменяет объявление ошибки,
при `aria-labelledby` область прокрутки без имени, `TableData` не принимает интерфейсы; `MSearch`
теряет `id`; `MSlider` без `aria-valuetext`; `MTabs` — tablist нельзя назвать, стрелки не RTL;
layout — `--m3-layout-inset-left/right` с логическими значениями, зоны выкидываются по брейкпоинту
без отключения; миксин `bp-tablet` срабатывает только с десктопа; `MDialog`/`MSheet` — `aria-label="Dialog"`
и необъявляемые `cancel`/`confirm`.

**Английские дефолты** (переопределяются пропом): rail/bar `'Primary'`, drawer, dialog, breadcrumbs,
progress, rating, alert/banner `'Close'`, number-input, date/time-picker; `locale: 'en-US'` по
умолчанию в date/time/number/dialog-date — общей настройки локали на уровне приложения нет.

**Пожелания к API**: диапазон дат и docked-поле даты, боковой sheet, стандартный (не модальный)
drawer, область поиска и уровень заголовка в `MAppBar`, ссылки (`to`) у пунктов rail/bar, пассивная
метка статуса (не `<button>`), валюта в `MNumberInput`, роли success/warning/info в `MColor`, публичный
экспорт типов (`TableColumn`, `SortState`, `MButtonGroupItem`… сейчас только глубокими путями),
вывод generic-типа выбора из `items`, а не из модели.

## Проверка

- eslint, stylelint, `lint:scss` (152 стиля), typecheck — чисто вне `playground/render/**` и
  `coverage/**` (вне git); 7 старых предупреждений `no-explicit-any` в нетронутых файлах.
- Агенты: data — table/timeline/avatar/пикеры 114 + 45 зелёных; inputs — 9 спеков, 236 зелёных.
- Итоговые полный vitest и полный e2e — в отчёте оркестратора (чат).

## Хвосты

- Отметка «частично выбрано» у «выбрать все» ждёт `indeterminate` в `MCheckbox` (план `form/checkbox.md`).
- Перевод остальных обводок на `max(1px, 1rem)`.
- Находки дашбордов выше — кандидаты в планы групп navigation / overlays / feedback / form.
- Репозиторий `docs` по-прежнему отстаёт от кита.
