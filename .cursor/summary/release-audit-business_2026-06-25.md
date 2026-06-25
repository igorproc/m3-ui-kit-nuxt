# Релизный аудит PrimeTime UI Kit — бизнес/продукт (2026-06-25)

Цель: что НЕ хватает до релизной Альфы M3 с точки зрения продукта/заказчика. Фокус: видимый результат, скорость до релиза, привлекательность. DX вне фокуса.

Скоуп роадмапа для Альфы: Фазы 1–3 (`kit/roadmap.md`). Фаза 4 (XR) — вне релиза.

---

## 1. Полнота библиотеки компонентов

### Что есть (компоненты в `kit/app/components/ui/`)
Actions: `button` (+ `icon`, `fab`, `extended-fab`, `segmented`, `split`), `fab-menu`.
Inputs/Selection: `text-field`, `search`, `checkbox`, `radio` (+group), `switch`, `slider` (+range), `dropdown`, `chip`, `date-picker`, `time-picker`.
Containment: `card`, `sheet`, `dialog` (+`dialog/date`), `divider`, `list` (+item), `table` (+header/pagination), `expansion-panel(s)`, `tooltip`, `badge`, `snackbar`.
Navigation: `app-bar`, `navigation-bar`, `navigation-rail`, `navigation-drawer`, `tabs` (+tab/panel), `menu`, `toolbar`, `system-bar`.
Feedback: `progress` (linear/circular), `loading`.
Layout/utility: `layout` (+header/aside/footer/main/item), `container`, `row`, `col`, `grid`, `spacer`, `responsive`, `shape`, `icon`, `form-renderer`.

Покрытие основных MD3-компонентов — **очень хорошее** (~33 публичных). Это сильная сторона для показа заказчику.

### Явные пробелы / неполнота (MD3-ожидаемое)
- **Carousel — ОТСУТСТВУЕТ как компонент**, но заявлен в доке и в сайдбаре (`/components/carousel`) и имеет `server/data/en|ru/carousel.json`. Битая витрина (см. §3, P0).
- **Menu** — компонент есть (`ui/menu`), но это базовое контекстное меню; нет отдельного «exposed dropdown menu» как в MD3 (частично закрыто `dropdown`).
- **Виртуализация таблицы (`MTable`)** — НЕ реализована. Роадмап Фаза 2 п.7 (`v-scroll` + «таблица на десятки тысяч строк») не сделан: поиск `virtual|v-scroll|recycle` по `kit` — совпадений нет. Сейчас `table/index.vue` рендерит все строки напрямую (`v-for row in data`). Это маркетинговое обещание доки («fast») не выполняется на больших данных.
- **Skeletons загрузки — НЕ реализованы нигде.** Роадмап Фаза 2 п.4 («скелетоны на все ui-components»). Поиск `skeleton` по компонентам — 0 совпадений. Есть только `loading`/`progress` (спиннеры).
- Мелочи MD3, которых обычно ждут и которых нет отдельными компонентами: **bottom-sheet/side-sheet** (есть generic `sheet`, но без модальных вариантов), **banner**, **full-screen dialog variant** (проверить вариативность `dialog`).

---

## 2. Визуальная завершённость / «красота»

- **Состояния (hover/pressed/focus/disabled)** — система заложена в Zero-Runtime M3 (`color-mix` на 8%/12%, см. CLAUDE.md и `button/_index.scss`). `button/index.vue` содержит ~15 совпадений по hover/focus/active/disabled — состояния проработаны. Это плюс. **Риск:** покрытие неравномерно по компонентам — нужен быстрый визуальный прогон всех 33 на 5 состояний (нет гаранта, что каждый отработан так же тщательно, как button).
- **Темизация / тёмная тема** — реализована и устойчива: `app/store/theme.ts` с валидацией cookie, `themes/base/_dark.scss`, контраст (low/medium/high), палитры из HEX через material-color-utilities. **Сильная сторона для демо заказчику.**
- **Анимации/motion** — есть `base/animation`, motion-токены (`--sys-motion-*`), foundations-страница motion. Базово ок.
- **Skeletons** — отсутствуют (см. §1). Для «красоты загрузки» и ощущения premium это заметный пробел.

---

## 3. Документация как продукт (user: «docs некорректна» — подтверждено)

Архитектура доки хорошая: единый плейграунд `DocsPg`, динамический рендер `pages/components/[name].vue` через `/api/docs/{locale}/{name}`, i18n (en/ru), вкладки Overview/Specs/API, качественный контент (напр. `button.json` — полноценные props/slots/tokens). НО есть **конкретные битые ссылки и рассинхрон**, которые заказчик увидит сразу:

**Битые ссылки в сайдбаре (`docs/app/components/DocsSidebar.vue`):**
- `/components/carousel` → JSON есть, **компонента нет** → resolver (`resolveComponent('MCarousel')`) вернёт null → hero и плейграунд рендерят пустой `<div>`. Витрина выглядит сломанной.
- `/components/extended-fab-menu` → **нет** `extended-fab-menu.json` (файл называется `extended-fab.json`) → страница уходит в ветку `error` → «Documentation is not available yet / Not Found».

**Рассинхрон сайдбара и контента (есть JSON, но НЕТ ссылки в навигации — компоненты «невидимы»):**
`expansion-panel`, `extended-fab`, `icon`, `loading`, `menu`, `toolbar`. Реально готовые компоненты не показаны заказчику.

**Компоненты БЕЗ доки (нет JSON вообще):** `avatar`, `expansion-panels`, `form-renderer`, `list-subheader`, `slide-group`, `surface`, `system-bar`, + layout-примитивы (`layout/container/row/col/grid/spacer/responsive/shape/main/avatar`). Часть — внутренние примитивы (ок), но `form-renderer`, `expansion-panels`, `system-bar`, `slide-group` — пользовательские.

**Числовое расхождение в маркетинге:** `pages/index.vue` заявляет «33 components following… spec» и «Full Spec Coverage» — при этом carousel битый, а ~6 готовых не показаны. Несоответствие заметно.

**Незакрытые роадмап-обещания доки (Фаза 3):** wireframes в доке (п.8) и полуавтогенерация токенов из SCSS-мап (п.9) — судя по статике JSON-токенов, токены вшиты вручную (риск рассинхрона дока↔код).

---

## 4. Что блокирует «релиз сегодня» + quick wins

### Топ-риски
1. Видимо битые страницы доки (carousel, extended-fab-menu) — первое, что увидит заказчик.
2. Готовые компоненты скрыты из навигации (6 шт.) — недопродаём продукт.
3. Нет skeletons и виртуализации таблицы — невыполненные обещания Фазы 2; «fast/beautiful» на витрине не подтверждается на нагрузке.
4. Неравномерность состояний/полировки по 33 компонентам — не верифицировано визуально.

### Quick wins (часы, не дни)
- Удалить/исправить ссылку `carousel` ИЛИ задизейблить пункт до готовности компонента.
- Переименовать ссылку `extended-fab-menu` → `extended-fab` (или создать `extended-fab-menu.json`).
- Добавить в сайдбар недостающие ссылки: `menu`, `toolbar`, `expansion-panel`, `icon`, `loading`, `extended-fab`.
- Поправить маркетинговый счётчик «33» под фактически показанные/рабочие.
- Прогнать визуально все компоненты в тёмной теме + 5 состояний (демо-страница `docs/mix.vue` уже есть — использовать как чек-лист).

---

## Приоритизация

### P0 — блокеры релиза (правятся в docs, быстро)
- [P0] `carousel` в сайдбаре ведёт на несуществующий компонент → пустая/битая страница. Убрать ссылку или скрыть до реализации. (`DocsSidebar.vue` L142; `server/data/*/carousel.json`)
- [P0] `extended-fab-menu` → 404 «Not Found» (нет JSON). Исправить slug на `extended-fab` или добавить JSON. (`DocsSidebar.vue` L125)
- [P0] Маркетинговое заявление «Full Spec Coverage / 33 components» при битой витрине — привести в соответствие. (`docs/app/pages/index.vue` L83-90)

### P1 — важно для релиза Альфы
- [P1] Вернуть в навигацию готовые, но скрытые компоненты: `menu`, `toolbar`, `expansion-panel`, `extended-fab`, `icon`, `loading`. (`DocsSidebar.vue`)
- [P1] Skeletons загрузки (Фаза 2 п.4) — минимум на «тяжёлых» компонентах (`table`, `list`, `card`). Сейчас 0.
- [P1] Виртуализация `MTable` (Фаза 2 п.7) — иначе «fast» не выполняется на больших данных. (`kit/app/components/ui/table/index.vue`)
- [P1] Визуальная верификация 5 состояний × тёмная тема по всем 33 компонентам (риск неравномерной полировки).
- [P1] Доки для пользовательских компонентов без JSON: `form-renderer`, `expansion-panels`, `system-bar`, `slide-group`, `avatar`.

### P2 — nice-to-have
- [P2] Carousel как реальный компонент (закрыть обещание доки).
- [P2] Недостающие MD3-паттерны: banner, modal/side bottom-sheet варианты `sheet`, full-screen dialog variant.
- [P2] Авто-генерация токенов доки из SCSS-мап (Фаза 3 п.9) — убрать ручной рассинхрон токенов.
- [P2] Wireframes в доке (Фаза 3 п.8).

---

### Сводка одной строкой
Библиотека компонентов почти полна и темизация сильна, но **доку нельзя показывать заказчику сегодня из-за битых ссылок (carousel, extended-fab-menu) и скрытых готовых компонентов**; плюс не закрыты skeletons и виртуализация таблицы из Фазы 2. P0 — чистые правки в `docs/` (часы).
