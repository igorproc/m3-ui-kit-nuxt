# M3-polish: общий бриф для агентов прогона

> Собран 2026-10-18 оркестратором из ~45 рабочих сессий владельца (Игоря) с агентами, памяти,
> `docs/system`, планов `.cursor/plans/feature/components-should-update/**`, summary, QA-аудита и
> текущего кода ветки `components/redisign-update`.
>
> Ты — автономный агент. Этот файл и бриф твоей группы (`1N-<группа>.md`) — твой системный
> контекст на весь прогон. Прочитай оба целиком один раз, потом пользуйся как справочником.
> Код и `docs/system/*` главнее этого файла (§1.4). Если бриф противоречит коду — верь коду и
> запиши расхождение в отчёт.

---

## 0. TL;DR — правила, которые нельзя нарушить

1. **Браузер, dev-сервер и Playwright — только у дирижёра.** Ты не запускаешь `nuxi dev/build/
   preview`, `npm run dev`, `npm run test:e2e`, `npx playwright …` и не трогаешь браузерные
   инструменты (`mcp__Claude_Browser__*`, `mcp__claude-in-chrome__*`, computer-use). Всё, что
   требует браузера, — заявка дирижёру (§2.4). Скриншоты и замеры из его ответа смотришь сам.
2. **Две фазы.** Сначала **аудит без правок `src/`** → отчёт оркестратору → он задаёт развилки
   владельцу → потом **реализация утверждённого автономно**. Без утверждённого списка код не
   трогаешь.
3. **Развилка в бизнес-логике = стоп и вопрос**, а не выбор молча. Два разумных толкования
   правила/поведения → это развилка, она идёт в отчёт с вариантами (§5.6).
4. **Код в `src/runtime/`.** Кит — опубликованный Nuxt-модуль `@pr0s1k/primetime-kit`, алиас
   `#kit` → `src/runtime`. Пути в `ui/CLAUDE.md` и `.cursor/rules/*` устарели.
5. **Каждое значение стиля — из карты `$tokens` компонента** через `g($t, 'точечный.путь')`.
   Только точки. Тронул файл с дефисными путями — переводишь **весь файл**.
6. **Никаких литералов**: ни ms, ни cubic-bezier, ни %, ни rgb/hex, ни px. Есть `spacing()`,
   `state-opacity()`, `elevation()`, `z()`, `--sys-motion-*`, роли `$theme-color-link`,
   `$theme-shape-link`, `typescale`.
7. **Только `rem`** (корень = `1vw / фактор`, 1rem ≈ дизайн-пиксель — фича, не баг). В прозе тоже
   rem, не px.
8. **Новых системных токенов нет** (`--sys-*`, ключи `$theme-*`, per-component CSS-переменные для
   статики). Значение вне шкалы — `calc()` из существующих ступеней **в карте компонента**.
   Единственное одобренное исключение — `disabled-container-subtle: 4%`.
9. **Арифметика (`calc`, смещения) — в карте токенов**, а не в `.vue`.
10. **`:hover` — только в `@include can-hover { … }`**, иначе `lint:scss` упадёт.
11. **Фокус**: контролы → `@include focus-ring` / `focus-ring(inset)` (3rem, offset 2rem,
    `secondary`). Поля → **только смена цвета рамки**, без кольца, без утолщения. Фокус бьёт
    ошибку на рамке.
12. **BEM `ui-<block>__<el>--<mod>`.** Никаких селекторов по тегам (`> span`), никаких `>`,
    никаких `[data-*]` для состояний, минимальная специфичность. `data-test` — только в фикстурах.
13. **Состояние никогда не выражается только цветом.**
14. **Масштаб = `density`: `compact | default | comfortable`.** Никаких `size`, `sm/md/lg`, XS–XL.
15. **Анимации — §6, обязательно.** Новых пружин и морфа нет; там, где морф уже работает (toggle-
    кнопки, `MButtonGroup`, `MFabMenu`, `MLoading`/`MShape`), он обязан быть **плавным**. Любой
    переход в твоих компонентах — без скачков, рывков соседей и движения «не в ту сторону».
16. **Перед любой правкой HTML/CSS/клиентского JS — `modern-web-guidance` (§7).** Только из
    PowerShell через `npx.cmd`.
17. **Поведение — в control-композабл, вид — в компонент.** Композабл отдаёт бэги атрибутов и
    **не отдаёт ни классов, ни `data-*`**.
18. **SSR**: первый кадр с сервера уже правильный. Геометрия, которую JS измеряет и потом
    «чинит», отвергается. `role/aria-*/tabindex` — в серверном HTML. `onMounted` — только для
    браузерных API. Нет модульного изменяемого состояния (`let` на уровне модуля).
19. **Каждый слушатель и таймер снимается.** Свои композаблы кита (`useEventListener`,
    `useGlobalListener`, `useRaf`); новых импортов из `@vueuse/core` не добавлять.
20. **Новых зависимостей нет.** Полифиллы не ставим: feature-detect + свой лёгкий фолбэк.
21. **Pinia нет.** `useState()` и `provide/inject` через `createContext`.
22. **Внутри кита UI-компоненты импортируются явно** (`#kit/components/ui/...`). Автоимпорт —
    только для API Vue, `composables/`, `shared/`. `utils/` — всегда явно.
23. **Любой `.vue` в `components/ui/` — публичный `M*`.** Приватные части — `components/fragments/`.
24. **Файл ≤ ~400 строк.** Вырос — дроби на композаблы, `fragments/`, `_states.scss`-партиалы.
    (Принятое исключение — `text-field/index.vue`.)
25. **Кит не поставляет английский пользовательский текст.** Фразы — `shared/constants/messages.ts`,
    иконки — `shared/constants/icons.ts` (`ICONS.x`). Новых английских дефолтов не добавлять.
26. **Дефолт живёт в одном месте — литералом в пропе.** Ось, а не флаг. Подмножество оси —
    `Extract<MVariant, …>`.
27. **Авторские компоненты** (нет в M3: otp-input, number-input, table, timeline, avatar,
    color-picker, color-input, file-input, file-upload, expansion-panel(s), list-subheader)
    развиваются **в своём текущем видении**, не перерисовываются «как в M3».
28. **Тесты лежат рядом с кодом**; тест не подгоняется под баг. Падающий старый тест сначала
    проверь — не закреплял ли он баг.
29. **Чини корень, а не симптом.** Нашёл баг — проверь весь класс таких багов в своих файлах; в
    чужих — сообщи оркестратору.
30. **Не коммить, не пушь, не делай `git checkout/reset/stash`.** Git — у владельца. Он может
    править файлы параллельно с тобой.
31. **Трогаешь только свои файлы** (§2.6). Чужие — заявкой оркестратору.
32. **Перед «готово»** — гейты §4 с exit 0 + твои e2e зелёные у дирижёра. Grep не проверка.
33. **Визуальная правка без скриншота дирижёра считается непроверенной** и так помечается.
34. **Отчёт честный**: что сделано, что не проверено, что сломано не тобой.

---

## 1. Задача прогона

### 1.1 Что не так (слова владельца)

Компоненты, переделанные в ветке `components/redisign-update`, «не совсем корректные»:
- **по дизайну** — не передают дух M3 (Material You / M3 Expressive как эталон для тех, что есть в
  M3; для авторских — их собственное видение, доведённое до системы);
- **по функциональности** — «при некоторых интеракциях некорректное отображение, что-то
  прыгает/бегает и не в ту сторону»;
- **по кастомизации** — мало точек настройки (слоты, пропы осей, токены, escape hatch).

Плюс: **минимизация и оптимизация стилей и логики**, «как мы делали в кнопках/полях» (§5.4).

Твоя работа: пройти каждый компонент своей группы по четырём осям (§5), найти дефекты с
доказательствами, после утверждения — исправить и расширить, покрыть регрессионными e2e.

### 1.2 Команда

| Кто | Модель | Что делает |
|---|---|---|
| Оркестратор | Opus (основная сессия) | раздаёт, сводит развилки владельцу, владеет общими файлами (§2.6), интегрирует, пишет итог |
| `conductor` | Haiku | **единственный**, кто держит dev-сервер `127.0.0.1:3200`, гоняет Playwright, пробы и встроенный браузер. Механический исполнитель: результат без толкований |
| `w1-buttons` | Opus | MButton, MButtonIcon, FAB, Extended FAB, Split, Segmented, MButtonGroup, MFabMenu, MLoading + морф-утилиты |
| `w2-containment-data` | Opus | MCard, MDivider, MExpansionPanel(s), MList (+item, subheader), MAvatar, MTable, MTimeline |
| `w3-fields` | Opus | MTextField (+`useFieldShape`), MTextarea, MNumberInput |
| `w4-select-files` | Opus | MDropdown, MAutocomplete, MSearch, MFileInput, MFileUpload |
| `w5-pickers-color` | Opus | MDatePicker (+MDialogDate), MTimePicker, MColorPicker, MColorInput, MOtpInput |

**Вне объёма** (не правишь, найденное — в отчёт): MMenu и popover-примитив (решение владельца
2026-10-18: шаги dropdown/search/color-input, заблокированные планом меню, остаются
заблокированными), MChip, MCheckbox, MSurface, MPagination, navigation/overlays/form-группы, docs-
сайт (`docs_v2`, DC-* пункты аудита), `playground/app/demo/**` (только читать как живой
потребитель).

### 1.3 Фазы и автономия

| Фаза | Кто | Что | Выход |
|---|---|---|---|
| P0 | оркестратор + дирижёр | брифы, `probe.ts`, prod-сборка + размеры выходного CSS, базовый прогон «карта скачков» по всем фикстурам ветки | `.cursor/temp/m3-polish/baseline/{css-sizes.json,<группа>.md}` |
| P1 аудит | ты | читаешь код/планы/аудит, заказываешь пробы и скриншоты, **`src/` не правишь**; можно писать пробы и дописывать кейсы в свои `playground/fixtures/<name>/*.vue` (compact + чипы, readonly + clearable, поле в `<form>`, у края экрана…), если без них нечего мерить | `.cursor/handoff/m3-polish/audit/<группа>.md` (§5.5) + короткий финальный ответ |
| — | оркестратор | задаёт владельцу развилки по одной, присылает тебе утверждённый список | сообщение тебе (ты продолжаешь с контекстом) |
| P2 реализация | ты | по утверждённому списку, автономно, компонент за компонентом; после каждого — гейты + свои e2e у дирижёра | код, спеки, фикстуры |
| P3 финал | ты → оркестратор | отчёт, summary-раздел, аудит JSON; оркестратор — полный прогон на prod-сборке, ревью diff, decisions | §12 |

**Обновление 2026-10-18 (владелец не за компьютером):** развилки решает **оркестратор по
рекомендации** — владелец сказал «в развилках реализуй рекомендованные версии, они чаще мной
одобряются». Поэтому у каждой развилки в аудите обязательна рекомендация с основанием; оркестратор
утверждает или правит её и присылает `GO` со списком решений. Пункты под стоп-правилами (§8.5) и всё,
что противоречит `decisions.md`, не делаются — помечай `СТОП`, они ждут владельца. Срочное (блокер,
конфликт файлов) — `SendMessage(to: "main")`.

**Автономия в P2** — это «иду по утверждённому списку до конца без остановки на каждом шаге», а не
разрешение менять список молча. Новая развилка в P2 → закончи всё, что от неё не зависит, и
верни вопрос оркестратору (финальным сообщением с пометкой `BLOCKED:` или в отчёте).

Владелец не любит молчащих агентов («ты что опять заглох?»). Длинная операция — пиши, что
происходит. Фоновую задачу не бросай.

### 1.4 Старшинство источников

1. **Текущий код** (`src/runtime/**`) и его спеки.
2. **`docs/system/en-US/*`** (ru-RU — то же содержание, но втрое дороже в токенах; читай en-US) —
   конституция кита: `principles`, `axes`, `color-and-state`, `behavior`, `craft`, `decisions`,
   `checklist`. **Обязательно прочитай `craft.md`, `color-and-state.md`, `behavior.md`,
   `decisions.md` до аудита** (~11k токенов). Правило оттуда «не решается на уровне компонента».
3. **Этот бриф** и бриф группы (решения владельца из переписки).
4. **План компонента** (`.cursor/plans/feature/components-should-update/<кат>/<name>.md`, раздел
   implementation-status и «Открытые вопросы») и `common.md` там же.
5. **Summary** ветки: `.cursor/summary/{button-family-m3_2026-10-07, containment-m3_2026-10-07,
   data-group-m3_2026-10-07_2157, inputs-group-m3_2026-10-08_0016,
   integration-and-dashboards_2026-10-08}.md`.
6. **QA-аудит** `.cursor/summary/runs/quality/data/<name>.json` (146 пунктов `_checklist.md`;
   `MANUAL` = проверяется только глазами — теперь это делает дирижёр).
7. Рендеры `.cursor/plans/feature/renders/<name>/{current,concept}.webp` — `concept` = целевой вид
   из исследования M3 (картинку можно открыть Read'ом). `current` устарел (до ветки).
8. Внешние эталоны M3: токены Compose Material3 (`androidx/compose/material3/tokens/*Tokens.kt`),
   m3.material.io, `D:\dev\primetime\ui\m3-reference\` (material-web) — **только читать**, отчёты
   о них в репо не сохранять («это не мой проект, а референс»).

---

## 2. Роли, протокол, владение файлами

### 2.1 Оркестратор

Шлёт тебе старт и утверждённый список; принимает твой финальный ответ (он приходит ему сам,
когда ты заканчиваешь ход); пересылает развилки владельцу; правит общие файлы по твоей заявке;
переназначает работу, если кто-то освободился раньше. Писать ему отдельно не нужно: всё, что
ему нужно, — в финальном сообщении хода и в файлах аудита/отчёта.

### 2.2 Дирижёр (`conductor`)

- Держит **один** dev-сервер `npx nuxi dev playground --port 3200 --host 127.0.0.1` (HMR
  включён: твои правки подхватываются сами).
- Исполняет заявки по очереди: прогон спеков, пробы, «осмотр» во встроенном браузере, полный
  прогон. Возвращает **факты**: команда, exit code, счётчики, заголовки упавших тестов, первые
  строки ошибки, пути к `error-context.md`, скриншотам, JSON проб. **Не толкует и не чинит.**
- Падение перезапускает один раз (HMR от правок других агентов может перезагрузить страницу
  посреди теста) и пишет оба результата.
- Его id ты получишь в стартовом сообщении. Ростер всех агентов —
  `.cursor/temp/m3-polish/roster.md`.

### 2.3 Ты (воркер)

Читаешь и правишь код своей группы, пишешь unit-спеки, фикстуры, e2e и пробы. **Сам ничего в
браузере не запускаешь.** Скриншоты из ответа дирижёра открываешь Read'ом (это картинки) и судишь
сам. Замеры проб читаешь из JSON.

### 2.4 Заявка дирижёру

1. Номер заявки — `<твоё-имя>-<NNN>` по порядку (`w3-fields-007`).
2. Файл `D:\dev\primetime\ui\kit\.cursor\temp\m3-polish\queue\req\<id>.md`:

```md
---
id: w3-fields-007
from: w3-fields
kind: run            # run | probe | look
---
## Что
- specs: playground/fixtures/text-field/text-field.e2e.ts
- grep: "label does not move"          # необязательно
## Зачем
одна строка: что проверяешь
## Вернуть особо
необязательно: «скриншоты падений», «весь вывод»
```

   Виды:
   - `run` — свои e2e: `specs` (пути к `*.e2e.ts` или папке фикстур), `grep` по желанию.
   - `probe` — сценарий замера: `file: playground/probes/<твоё-имя>/<name>.probe.ts` (§2.5).
   - `look` — быстрый осмотр без написания пробы: блок ```json с шагами (ниже). Дирижёр
     прогоняет его общим сценарием `playground/probes/_conductor/look.probe.ts` (скриншоты и
     результаты `js` — файлами) и, если указано `"pane": true`, повторяет во встроенном браузере,
     чтобы владелец видел вживую.

```json
{
  "url": "/text-field/matrix?theme=dark&dir=rtl",
  "viewport": [1280, 800],
  "media": { "reducedMotion": "reduce", "forcedColors": "active" },
  "pane": false,
  "steps": [
    { "do": "hover", "sel": "[data-test=float-filled]" },
    { "do": "shot", "name": "hovered", "sel": "[data-test=float-filled]" },
    { "do": "focus", "sel": "[data-test=float-filled] input" },
    { "do": "press", "key": "ArrowDown" },
    { "do": "type", "sel": "[data-test=float-filled] input", "text": "abc" },
    { "do": "click", "sel": "[data-test=toggle]" },
    { "do": "mousedown", "sel": "[data-test=toggle]" }, { "do": "mouseup" },
    { "do": "wait", "ms": 300 },
    { "do": "js", "name": "radius", "expr": "getComputedStyle(document.querySelector('[data-test=toggle]')).borderRadius" }
  ]
}
```

     `media` и `pane` необязательны. Для серьёзных доказательств (кривая движения, сдвиги) пиши
     `probe`; `look` — для «как это выглядит в состоянии X» и точечных значений.
3. Отправь: `SendMessage(to: "<id дирижёра>", summary: "REQ <id>", message: "REQ <полный путь к файлу>")`.
   (Схему `SendMessage` загрузи один раз: `ToolSearch` с `select:SendMessage`.)
4. Жди ответа `D:\dev\primetime\ui\kit\.cursor\temp\m3-polish\queue\res\<id>.md`. Дирижёр
   дополнительно пришлёт тебе `RES <путь>` сообщением. Пока ждёшь — делай другую работу; если
   делать нечего, поставь фоновое ожидание (Bash, `run_in_background: true`):
   `until [ -f "D:/dev/primetime/ui/kit/.cursor/temp/m3-polish/queue/res/<id>.md" ]; do sleep 5; done; head -12 "…/res/<id>.md"`
   — придёт уведомление. Дубли (сообщение + уведомление) игнорируй.
5. Нет ответа 30 минут — допиши это в финальное сообщение хода с пометкой `CONDUCTOR-SILENT <id>`.
6. Артефакты лежат в `D:\dev\primetime\ui\kit\test-results\conductor\<id>\` (вне git).

Не шли дирижёру «прогони всё» — только свои спеки и пробы. Не заказывай прогоны в цикле на каждую
правку: сначала гейты §4, потом заявка.

**Переносы файлов — атомарно.** Dev-сервер общий: висящий импорт роняет весь playground у всех (было:
перенос в `utils/dropdown` дал 500 на всех страницах). Порядок: создать новые файлы → переключить **все**
импорты (grep по `src/` и `playground/`) → только потом удалить старые. Между шагами — ни одного висящего
пути; после — `npm run typecheck` по своим путям.

**Фикстуры общие для всех.** С 2026-10-18 `playground/app/utils/fixtures.ts` грузит фикстуры лениво
(страница ждёт свою фикстуру в setup), поэтому сломанная фикстура роняет только свои страницы. Но
сломанный **общий** компонент (MButton, MTextField, MList…) или висящий импорт в `composables/**`
(автоимпорт) по-прежнему роняет многие страницы у всех. Перед заявкой прогони `npx eslint`,
`npm run lint:scss` и `npm run typecheck` по своим путям; новая фикстура регистрируется сама (папка
`playground/fixtures/<name>/`, файлы `matrix.vue`/`stress.vue`, корень с `data-test`).

### 2.5 Пробы: как увидеть «прыгает/бегает»

Хелпер `playground/e2e/probe.ts` (готовит оркестратор в P0) — запись поведения покадрово внутри
страницы (rAF), без задержек Playwright:

```ts
import { test } from '@playwright/test'
import { openFixture, remInPx } from '../../e2e/support'
import { traceMotion, analyzeMotion, shootStates, saveProbe } from '../../e2e/probe'

test('label stays put on focus', async ({ page }, testInfo) => {
  await openFixture(page, 'text-field/matrix', { theme: 'light', dir: 'rtl' })
  // У полей data-test стоит на нативном input (useControlAttrs), корень — через :has()
  const root = '.ui-text-field:has([data-test="enabled-filled"])'
  const trace = await traceMotion(page, {
    targets: { label: `${root} .ui-text-field__label`, field: root },
    styles: ['transform', 'color', 'border-radius', 'width'],
    duration: 1000,                                  // запись после act(), мс
    act: () => page.getByTestId('enabled-filled').focus(),
  })
  await saveProbe(testInfo, 'focus-trace', { trace, issues: analyzeMotion(trace) })
  await shootStates(page, page.locator(root), testInfo.outputPath(), 'enabled-filled')
})
```

- **Селекторы.** У компонентов на `useControlAttrs` (поля, dropdown, autocomplete, file-input…)
  `data-test` уходит на нативный `<input>/<textarea>`, а не на корень — корень берётся через `:has()`,
  как в примере. Сверяй селекторы с `matrix.vue`/`stress.vue` своей группы.
- **Нарисованное ≠ заданное.** `getComputedStyle` отдаёт заданное значение (`border-radius: 999rem`),
  а не то, что нарисовано (обрезанное половиной высоты). Для формы меряй нарисованное: отношение
  к размеру элемента, скриншот, или `clamp` расчётом в пробе.
- `traceMotion` → `{ remPx, frames: [{ t, rects: {имя: {x,y,width,height}}, styles: {имя: {...}} }],
  shifts: [layout-shift записи браузера с узлами-источниками, включая hadRecentInput] }`.
- `analyzeMotion(trace, { jumpRem?, ignore? })` → список `{ target, kind, t, detail }`:
  - `jump` — за один кадр значение прыгнуло на большую часть пути (снап вместо перехода, или
    свойство не интерполируется);
  - `reversal` — направление движения сменилось больше одного раза (одна перелётка пружины
    допустима) или первое движение пошло в обратную сторону;
  - `shift` — сдвинулся соседний элемент (источник layout-shift не из `targets`);
  - `unsettled` — к концу записи ещё движется.
- `shootStates(page, locator, dir, name, states?)` → PNG в `rest | hover | focus | pressed`.
- `saveProbe(testInfo, name, data)` → JSON в каталоге результатов.

Файлы проб — `playground/probes/<твоё-имя>/*.probe.ts` (каталог вне git, временная диагностика).
Длительную проверку («нет скачка при фокусе», «соседи не двигаются при hover») переноси в свой
`playground/fixtures/<name>/<name>.e2e.ts` с теми же хелперами — это регрессия.

Геометрия в e2e: при ширине 1280 `1rem` ≈ 0.667 CSS px — делить на `await remInPx(page)`.

### 2.6 Владение файлами

| Чьё | Файлы |
|---|---|
| **Оркестратор** (ты не правишь, просишь в отчёте) | `src/runtime/assets/stylesheet/{abstracts,base,themes}/**`, `components/_ripple.scss`, `src/runtime/shared/{types,utils}/**`, `src/runtime/plugins/**`, `src/runtime/directives/**`, общие композаблы `composables/{useControlAttrs,useGlobalListener,useEventListener,useRaf,useBreakpoint,useSSRWindowSize}.ts` и `composables/overlay/**`, `src/module.ts`, `src/module.spec.ts`, `playground/e2e/**`, `playground/app/**`, `playwright*.config.ts`, `vitest.config.ts`, `package*.json`, `shell/**`, `docs/system/**`, `.cursor/summary/runs/quality/_*` |
| **Общие, только дописывать** | `src/runtime/shared/constants/{messages,icons}.ts` — добавляй свои ключи, чужие не меняй; перед правкой перечитай файл |
| **Своя группа** | компоненты группы: `components/ui/<name>/**`, `components/fragments/<name>/**`, `assets/stylesheet/components/<name>/**`, `composables/<name>/**`, `utils/<name>/**`, `playground/fixtures/<name>/**`, `playground/probes/<твоё-имя>/**`, `.cursor/summary/runs/quality/data/<name>.json`, планы своих компонентов |
| **w1 дополнительно** | `utils/motion/**`, `utils/morph/**`, `composables/useReducedMotion.ts`, `composables/useShapeMorph.ts`, `composables/useFabMenu.ts`, `composables/button/**` (`useRetiredValueWarning` оттуда импортируют 12 компонентов других групп), `components/ui/shape/**` — только ради плавности морфа |
| **Не трогать никому** (параллельная работа владельца над типографикой, не закоммичена) | `src/module.ts`, `src/runtime/assets/stylesheet/base/{_fonts,_typography}.scss`, `src/runtime/shared/types/kit.ts`, `src/runtime/shared/constants/typography.ts`, `src/runtime/plugins/fonts.ts`, `src/runtime/utils/typography/**`, `shell/scss-smoke.mjs`, `docs/configuration.md`, удалённые `src/options/legacy*`. Не откатывать. Гейт упал из-за них — это не твоё, укажи в отчёте |

Зависимости между группами (твоя правка ломает соседа):
- `MButton`, `MButtonIcon`, `MLoading` (w1) — используют почти все: alert, banner, date-picker,
  dropdown, autocomplete, color-input, file-input, file-upload, table, search, pagination,
  dialog/date, form-renderer. **Публичный API этих трёх меняется только по утверждённому
  списку.**
- `MTextField`, `useFieldShape`, `MFieldParts`, `mFieldProps` (w3) — используют dropdown,
  autocomplete, file-input (w4), color-input, color-picker/Edit, date-picker/input (w5),
  number-input, textarea, form-renderer.
- `MList`, `MListItem`, токены списка (w2) — используют dropdown, autocomplete (w4).
- `MMenu`, `MChip`, `MCheckbox`, `MSurface` — вне объёма, ни у кого.

Нужна правка чужого файла → пункт в отчёте «Заявки на чужие файлы»: файл, что поменять, зачем.
Оркестратор передаст владельцу файла или сделает сам.

---

## 3. Карта репозитория (как есть на 2026-10-18)

```
D:\dev\primetime\ui\kit\                 ← отдельный git-репозиторий (не монорепо)
├── src\module.ts                        Nuxt-модуль, configKey materialKit, алиас #kit
├── src\runtime\
│   ├── components\ui\<name>\            публичные M*: index.vue, props.ts, context.ts, *.spec.ts | tests/
│   ├── components\fragments\<name>\     приватные части, импорт только явный
│   ├── composables\<name>\              use*.ts (автоимпорт), control-композаблы
│   ├── assets\stylesheet\
│   │   ├── abstracts\                   _variables.scss (системные карты), _functions.scss (g, spacing, state-opacity, elevation, z, material-map, m3-button-scheme), _mixins.scss
│   │   ├── base\ themes\                reset, _adaptive.scss (vw-корень), темы
│   │   └── components\<name>\_index.scss   $tokens (+ _states.scss, _label.scss партиалы)
│   ├── shared\                          types/props.ts (MColor, MVariant, MShape, MHeadingLevel), utils/props, utils/context/createContext.ts, constants/{icons,messages,otp}.ts
│   ├── utils\                           morph/, motion/ (M3_SPRING, springToCss, springTiming, transitionList), table/ — БЕЗ автоимпорта
│   └── plugins\                         material ($material), directives (ripple), viewport.client
├── playground\                          приложение-потребитель: dev, окружение Vitest, Playwright
│   ├── fixtures\<name>\{matrix,stress}.vue + <name>.e2e.ts
│   ├── e2e\support.ts, e2e\probe.ts     openFixture, expectNoAxeViolations, expectNoHorizontalOverflow, waitForMotion, remInPx, THEMES, DIRECTIONS, WIDTHS; пробы
│   ├── probes\<агент>\*.probe.ts        временные пробы (вне git)
│   └── app\demo\{orders,crm}            два демо-дашборда — живые потребители кита (не править)
├── shell\scss-smoke.mjs                 lint:scss
├── docs\system\{ru-RU,en-US}\           конституция
└── .cursor\                             plans\, summary\ (журнал), handoff\m3-polish\ (брифы, audit\), temp\ (очередь, вне git)
```

Регистрация: `ui/button/icon/index.vue` → `<MButtonIcon>`, ленивая, не глобальная. Fixture-URL:
`/<component>/<case>?theme=light|dark&dir=ltr|rtl` (страница `playground/app/pages/[component]/[case].vue`
ставит `data-fixture-ready` после гидрации).

---

## 4. Команды и гейты (твои)

```bash
npx eslint <твои пути>                                   # 0 ошибок
npx stylelint "<твои пути>/**/*.{vue,scss}"               # 0 ошибок
npm run lint:scss                                         # компилирует Sass каждого SFC; 0 ошибок, 0 deprecations
npm run typecheck                                         # vue-tsc; ошибки только вне твоих путей допустимы (playground/render/**, coverage/**)
npx vitest run <каталоги твоих компонентов и композаблов> --coverage.enabled=false
```

- e2e — **только через дирижёра** (§2.4). `npm run build` / `test:e2e` / `nuxi` не запускаешь.
- `lint:scss` — единственное, что компилирует стили компонентов (`nuxt-module-build` копирует
  рантайм дословно, Vitest рендерит в jsdom без препроцессора). Падает на: ошибку Sass и `@error`
  из `g()` на несуществующем точечном пути, неверную арность миксина, **любую** депрекацию,
  утёкшую в CSS функцию кита, `:hover` вне `can-hover`, `:deep()` в не-scoped стиле,
  `&:hover { &-x }`. Дефисные пути он только **печатает** как «rules render nothing» — читай.
- **Метрика минимизации — выходной CSS компонента** из prod-сборки playground
  (`playground/.output/public/_nuxt/*.css`, минифицирован, как получит потребитель): у каждого
  компонента свой файл, узнаётся по своему блоку `.ui-<name>` (фрагменты — свои файлы со своими
  блоками). Размеры (байты и gzip) по блокам снимает дирижёр: до правок (P0, файл
  `.cursor/temp/m3-polish/baseline/css-sizes.json`) и в финальном прогоне (P3). Сам не собираешь.
- **Компилируется — не значит верно.** `min-height: null` компилируется и не делает ничего.
- Vitest: окружение nuxt (`mountSuspended`), `hookTimeout` 30 с. Спеки `useModal`/overlay иногда
  падают под нагрузкой — перезапусти один раз.
- Shell: PowerShell 7 и Git Bash. В PowerShell без bash-синтаксиса (`{a,b}`, `rm -rf`).

---

## 5. Аудит: что искать и как сдавать

Каждый компонент группы — по четырём осям. Источники для каждого: код, план (статус + открытые
вопросы + «Предложения по UX»), summary, QA JSON (особенно FAIL и MANUAL), базовая «карта
скачков» из P0, concept-рендер, M3-спека (для компонентов из M3), живое использование в
`playground/app/demo/**`.

### 5.1 Ось A — вид и «дух M3»

- Анатомия и пропорции совпадают с M3 (Compose-токены): высоты, отступы, радиусы, типографика,
  роли цвета, тени. Числа выводятся из токенов, не на глаз («сразу ответь, откуда цифра 28rem»).
- Состояния — **слой** `::before` в `currentcolor` с `state-opacity()` (hover 8, focus 10, pressed
  12, dragged 16), не подмена фона и не готовый смешанный цвет (`craft.md` §1). Disabled:
  контейнер 12%, контент 38% (filled-поле: `disabled-container-subtle` 4%).
- Роли: `primary` = действие/активность, `secondary` = акцент (кольцо фокуса), пусто →
  `outline-variant`, есть содержимое → `outline`, ошибка → `error`.
- Не сползать в Material 2 (underline-поля, утяжелённая обвязка) и в shadcn/Bootstrap (волосяные
  разделители внутри контрола, подменённые фоны, кольца у полей) — `craft.md` целиком.
- Части одного компонента — одного поколения («как будто field и menu из разных веков»).
- Hairline-обводка — `max(1px, 1rem)` во всех outlined-картах твоих компонентов (решение
  2026-10-08; переводи при касании).
- Forced colors: всё, что нарисовано только фоном/тенью, повторено системными цветами.
- RTL: только логические свойства, стрелки направления зеркалятся.
- Вывод — сравнение со скриншотами дирижёра (`shootStates` в light/dark, ltr/rtl) и concept-рендером.

### 5.2 Ось B — поведение и анимации

- Пройди каждое взаимодействие: hover, press, focus (клавиатура и мышь), открытие/закрытие,
  выбор/снятие, ввод, ошибка, disabled/readonly/loading, смена density/variant на лету, длинный
  контент, RTL, узкая ширина (360), reduced motion.
- На каждое — проба (`traceMotion` + `analyzeMotion`) или осмотр. Ищешь: скачок, рывок соседа
  (layout shift), движение «не в ту сторону» (особенно в RTL: `left/translateX` вместо логических),
  смену геометрии от состояния (ширина/высота «едут» при выборе, фокусе, ошибке — «раскладка не
  едет от состояния: место под ошибку и иконку зарезервировано»), мигание на гидрации,
  неснимаемые слушатели.
- §6 — обязательные правила анимации.
- Клавиатура по WAI-ARIA APG, фокус не теряется (loading держит фокус, Esc возвращает фокус).

### 5.3 Ось C — кастомизация

- Контент, который потребитель захочет заменить, — слотом (`#leading`, `#trailing`, `#media`,
  `#actions`, `#empty`, `#label`, `#support`…). Слоты по ширине не ограничиваются.
- Захардкоженный тайминг/геометрия, которую разумно настраивать, — баг API («мы же должны этим
  уметь манипулировать»), но через **ось/проп/токен**, а не через per-component CSS-переменную.
- Атрибуты: обёртка → `defineOptions({ inheritAttrs: false })` + `useControlAttrs()` (`class/style`
  на корень, остальное на контрол).
- Escape hatch: поведение доступно без компонента — композабл + `v-bind` бэгов (`behavior.md`).
- Типы публичны и видны в IDE (типы generic-SFC — в `props.ts`/`types.ts`).
- Новая ось/проп — **развилка** для владельца (у варианта должен быть заказчик, `principles.md` В4).
  Предложения сверх паритета — раздел «Предложения» отчёта, не шаги.

### 5.4 Ось D — минимизация и оптимизация (как в кнопках и полях)

Что делали в кнопках и полях и что повторить:
- **Одна карта токенов, наборы — генерацией**: варианты, роли, плотности, состояния — `@each` по
  карте, а не копипаста блоков. Схема цветов одной функцией (образец — `m3-button-scheme` в
  `_functions.scss`, правится через оркестратора).
- **Атомарные значения в карте**, шорткаты (`padding: a b`) собираются в SCSS.
- **Состояния — в партиал** `_states.scss` миксином, когда SFC растёт.
- **Одна механика на одно поведение**: общее composable-ядро (`useButton` — одно на всё семейство
  кнопок), не две реализации клавиатуры/фокуса/выбора/«отключённой ссылки» (сейчас их три:
  `useButton`, `useCard`, `useListItemControl` — кандидат на сведение).
- **Китовые примитивы вместо своих**: `MLoading inline` вместо своего спиннера, `MButtonIcon`
  вместо своих кнопок-иконок, `focus-ring`, слой состояния, `MList`, `useReducedMotion`.
- **Удалить мёртвое**: дефисные пути (рисуют ничего), токены без читателя, пропы без эффекта,
  бесполезные обёртки, `data-*`, `>`-селекторы, переходы на свойства, которые не меняются,
  `transition: all`.
- **Низкая специфичность**: модификатор вместо `[data-x] > .el`, без `#{&}`.
- **Шаблон тонкий**: длинные условия — в именованные computed/функции, логика — в композабл.
- **Цель — меньше выходного CSS компонента** (байты и gzip, §4): база из
  `baseline/css-sizes.json`, итог — из финального прогона. В аудите оценивай, за счёт чего он
  уменьшится (дубли правил, мёртвые декларации, лишние селекторы, переходы на неизменные свойства,
  повторённые медиа/forced-colors блоки). **Не ради байтов**: решения из `decisions.md` не ломаем —
  density остаётся `@each` в чистом Sass, состояния не уходят в CSS-переменные, zero-runtime в силе.
  Строки `src` до/после — вторичная метрика.
- Оптимизация не меняет поведение. **Перед правкой анатомии сверь поведение до/после** («посмотри
  как это было по git diff!! это очень сильная деградация логики»).

### 5.5 Формат файла аудита

`D:\dev\primetime\ui\kit\.cursor\handoff\m3-polish\audit\<группа>.md`, по-русски:

```md
# Аудит <группа> — <дата>

## <Компонент>
Источники: план (статус), QA FAIL/MANUAL, базовая карта, пробы <id заявок>.

| # | Ось | Что не так (факт) | Доказательство | Как чинить | Размер | Развилка? |
|---|---|---|---|---|---|---|
| B-3 | B | при hover соседняя кнопка сдвигается на 2rem | REQ w1-buttons-004, shift `.ui-button__label` | рамка `inset` box-shadow вместо border-width | S | нет |
| C-1 | C | иконку трейлинга нельзя заменить | `split/index.vue:41` | слот `#trailing-icon` | S | да → Q-2 |

Минимизация: выходной CSS было (байты/gzip из `baseline/css-sizes.json`) → оценка «станет» и за
счёт чего; что удаляется; строки `src`.

## Развилки для владельца
Q-1 (<компонент>): <вопрос простыми словами, одна развилка>
1. <вариант> — trade-off. **(рекомендую)**
2. <вариант> — trade-off.
(Ответ свободным текстом владелец может дать — он важнее номера.)

## Предложения сверх паритета (не шаги)
| Предложение | Выигрыш | Заказчик | Цена S/M/L | Рекомендация |

## Заявки на чужие файлы
## Что не удалось проверить
```

Каждая находка — **факт с доказательством** (строка кода, id заявки и что в ней, путь к
скриншоту). Без «кажется». Шаг без названной проблемы владелец отклоняет («не понял, в чём проблема
сейчас»).

### 5.6 Как формулировать развилки

- **Один вопрос — одна развилка.** 2–4 пронумерованных варианта, у каждого короткий trade-off, один
  «(рекомендую)».
- Простыми словами, без жаргона («sr-only что это?», «что за focus-ring?»). Если без термина
  никак — объясни его одной фразой.
- Не спрашивай то, что выводится из кода, `docs/system` или этого брифа («ну а ты прочитай, как
  сейчас работает»). Не переспрашивай решённое (§9, `decisions.md`).
- Что **не** развилка (решай сам): локальные технические решения внутри утверждённого пункта, имена,
  форматирование, очевидные обратимые правки, выбор между двумя реализациями одного поведения.
- Что **всегда** развилка: новая публичная ось/проп/слот/событие, ломающее изменение API,
  изменение поведения, которое потребитель заметит (что выбирается, что отправляется, что
  закрывается), правило, которое просится в `docs/system`, всё из «стоп-правил» (§8.5).

---

## 6. Анимации — обязательные правила

Владелец (2026-10-18): «обязательный пункт — анимации; если используется наш morph-движок, нужно
обязательно делать плавные анимации». Решение по объёму: **плавно там, где морф уже есть**;
статичная форма состояния остаётся статичной (решение 2026-10-07 в силе).

### 6.1 Где работает наш морф

| Механизм | Где | Файлы |
|---|---|---|
| CSS-пружины: `M3_SPRING` → `springToCss` → `linear()` в inline `transition` (без кадрового цикла) | toggle `MButton`/`MButtonIcon` (`selected`), кнопки `MButtonGroup`, FAB `MFabMenu` → кнопка закрытия | `utils/motion/shared/css.ts`, `components/ui/button/morph.ts`, `components/ui/fab-menu/morph.ts` |
| SVG-морф пути: `useShapeMorph` (rAF, `utils/morph`, кривые/пружины `utils/motion`) | `MLoading` (expressive-индикатор), `MShape` | `composables/useShapeMorph.ts`, `utils/morph/**`, `components/ui/loading`, `components/ui/shape` |
| `useReducedMotion` (один слушатель, читается после монтирования) | все выше | `composables/useReducedMotion.ts` |

Новый морф — только по тому же рецепту `springToCss`, и только с одобрения владельца (развилка).

### 6.2 Что значит «плавно» (проверяется пробой, не глазом)

1. **Нет разрыва**: каждое анимируемое свойство меняется непрерывно; `analyzeMotion` не даёт `jump`.
   Свойство, которое не интерполируется (`auto`, смена `display`, смена единиц `%`↔`rem`, разная
   форма `border-radius` записи, `inherit`), — источник снапа: приводи к интерполируемому виду.
2. **Прерывание продолжается с текущего значения** (быстрый двойной клик по toggle, открыть-закрыть
   FAB menu посреди морфа): CSS-переход это умеет сам, если ты не переписываешь inline `transition`
   посреди движения и не снимаешь/вешаешь класс так, что старт сбрасывается. JS-морф стартует от
   **живого** `d`, а не от канонического.
3. **Соседи не дёргаются**: морф размера (FAB → 56) не двигает раскладку вокруг — либо элемент вне
   потока (top layer, absolute), либо место зарезервировано. `analyzeMotion` не даёт `shift`.
4. **Направление верное**: первое движение — к цели; в RTL зеркально; разворотов не больше одной
   перелётки пружины.
5. **Первый кадр после SSR без анимации**: гидрация не запускает переход (нет перехода из «пустого»
   состояния в начальное). Начальное значение отрисовано сервером.
6. **Reduced motion укорачивает, а не выключает**: короткий системный переход (`CALM` в морф-файлах:
   `short-4` + `standard`), без пружины. Не `transition: none`.
7. **Одна механика**: inline-морф заменяет весь список переходов элемента — новые переходы такого
   элемента добавляются и в его `morph.ts`, иначе они пропадут у toggle.
8. **Стоп-кадр**: к концу записи всё успокоилось (`unsettled` пуст), форма в покое ровная
   (expressive-«качание» `MShape` обязано вернуться в 0°).
9. Тайминги — только из `M3_SPRING` / `--sys-motion-*`. Литеральные ms/cubic-bezier запрещены.

### 6.3 Остальные переходы (не морф)

- Только `--sys-motion-duration-*` / `--sys-motion-easing-*`; анимировать предпочтительно
  `transform`/`opacity`/цвет, не геометрию в потоке («анимировать только через transform»).
- **Плавающий лейбл полей не анимируется** (решение `decisions.md`); фокус поля — плавная смена
  цвета рамки.
- Статичная смена формы по состоянию (строка списка 4 → 16, углы панелей, выбранная кнопка в
  disabled) — **без** перехода радиуса. Не добавлять.
- Нет springs/morph-движка там, где его нет. Нет ripple-«наворотов» сверх существующего
  `directives/ripple`.

---

## 7. modern-web-guidance — обязательно

Перед любой правкой HTML/CSS/клиентского JS (переходы, popover/top layer, anchor positioning,
container queries, `:has()`, `@starting-style`, `field-sizing`, scroll-driven, формы, slider,
OTP, таблица, анимация к/от intrinsic size) — найди и прочитай гайд.

Только **PowerShell** (в Git Bash `npx` падает на пути `C:\Program Files`):

```powershell
npx.cmd -y modern-web-guidance@latest search "<что хочешь сделать, действием>" --skill-version 2026_10_12-dacb5911
npx.cmd -y modern-web-guidance@latest retrieve "<id>[,<id>]" | Out-File -Encoding utf8 "<scratch>\mwg-<id>.md"
npx.cmd -y modern-web-guidance@latest list
```

Полезные id для прогона: `motion`, `animate-to-intrinsic-sizes`, `animate-element-entry-exit`,
`animate-to-from-top-layer`, `physics-based-easing`, `individual-transform-properties`,
`dynamic-sibling-animations`, `css`, `css-layout`, `reduce-style-repetition`,
`child-state-based-styling`, `style-parent-with-has`, `size-aware-styling`,
`design-token-reactivity`, `forms`, `validate-input-after-interaction`, `required-field-feedback`,
`form-fields-automatically-fit-contents`, `sms-otp-form`, `slider`, `checkbox`,
`responsive-table`, `state-aware-sticky-headers`, `scrollability-affordance-hints`,
`soft-edge-content-fade`, `accessibility`, `accessible-error-announcement`, `spinner`,
`progress-ring`, `precise-text-alignment`, `visually-stable-font-fallbacks`.

Правила применения:
- Гайды предполагают Baseline Widely available. Политика кита для не-Baseline: **нативная фича за
  feature-detect + свой лёгкий фолбэк в ките, без пакетов-полифиллов** (так решено для popover,
  anchor positioning, `<dialog closedby>`, `overlay`). Гайд советует полифилл — пиши фолбэк сам.
- Гайды фреймворк-агностичны — адаптируй к Vue/Nuxt и к zero-runtime Sass.
- В отчёте — раздел «Modern Web Guidance»: по пункту на применённый `<id>`: какое неочевидное решение
  он продиктовал и от какой ошибки уберёг (с короткой цитатой правила). Если искал, но ничего не
  применил — одна фраза, что искал.

---

## 8. Вкус владельца: что хорошо и что «колхоз»

Реальные реплики и правила, которые из них следуют. Повторишь ошибку — получишь ту же претензию.

### 8.1 Код и архитектура

| Реплика | Правило |
|---|---|
| «он выглядит как god компонент» | Сложное = контейнер + подкомпоненты + композаблы. Шаблон тонкий |
| «в скрипте каша», «слишком много биндится» | Логика в `composables/<name>/use*.ts`, одна ответственность на файл |
| «проверка страшная» (`!a \|\| b === c \|\| x.closest(...)`) | Длинные условия — в именованные функции/objectMap |
| «controlClasses — 10+ классов, они точно нужны?» | Каждый класс и проп решает названную проблему |
| «let это был один из главных запретов» | Нет модульного изменяемого состояния |
| «зачем нам кешировать?», «что за scope.run()?» | Не плодить слои, кэши, синглтоны без причины |
| «он и был бесполезен» | Бесполезные обёртки удаляются |
| «интернал должен остаться internal» | Внутренние фабрики не утекают в автоимпорт (`utils/`, не `composables/`) |
| «я хочу уйти от vueuse» | Свои `useGlobalListener`, `useEventListener`, `useRaf` |
| «почему функции, а не простая передача ref» | В композабл — ref/реактивные пропсы, не геттеры |
| «зачем в композаблах константы? это по сути дефолт пропы» | Дефолт — на пропе, композабл получает разрешённую конфигурацию |
| «мы же должны этим уметь манипулировать» | Захардкоженный тайминг/геометрия, которую разумно настраивать, — баг API |
| «посмотри по git diff!! деградация логики» | Перед правкой анатомии сверь поведение до/после |
| «а нельзя починить глобально?» | Один баг → проверь весь класс таких багов |
| «а точно ли юзер должен юзать миксин?» | Правильное поведение — по умолчанию, без работы потребителя |
| «как им управлять в коде и dx пользователю непонятно» | DX и понятный API важнее «правильной по спеке» абстракции |
| «нет подсказок в ide» | Типы у потребителя — дефект уровня P1 |
| «он вообще странный, нужен ли этот компонент?» | Сомнительное снимают, а не латают |
| «а почему там не m-button?» | Сначала переиспользуй китовый примитив |

### 8.2 Стили

| Реплика | Правило |
|---|---|
| «что это за гадость? `> span` — есть же BEM!» | Каждый стилизуемый узел — свой BEM-класс |
| «откуда такая специфичность? в стили страшно заглядывать» | Модификатор вместо `[data-x] > .el` |
| «calc(...) должны происходить в мапе токенов» | Арифметика — в `$tokens` |
| «откуда px? всё в rem должно быть!» | Только rem |
| «если есть each наподобие rounded — сделай как варианты» | Наборы — `@each` по карте |
| «сразу ответь, откуда ты взял цифру 28rem» | Каждое число выводится из токенов; расходится с глазом — ищи причину |
| «g нужно, чтобы орал, когда нет значения» | Тихая ошибка — главный враг |
| «focus ring выглядит костыльно над плавной сменой цвета border'a» | У полей фокус — только цвет |
| «у prepend слота разве должен быть max-width?» | Слоты по ширине не ограничиваются |
| «при выборе опции компонент идёт в ширину — такого не должно быть» | Раскладка не едет от состояния |
| «анимировать только через transform» | Геометрию в потоке не анимировать |
| «декоративные слои должны быть absolute» | Декор — оверлеем, не в потоке |

### 8.3 API и оси

| Реплика | Правило |
|---|---|
| «не size, а density вроде бы везде» | Только `density` из трёх ступеней |
| «слишком много пропов, scrub/split/stacked — это вариант controls» | Взаимоисключающие флаги — одна ось |
| «density бесполезная в textarea» | Ось — только где у неё есть смысл и заказчик |
| «ghost вариант как будто бред», «удали terminal» | Нишевые варианты без заказчика удаляются |
| «кнопка необязательно вызывает меню… избавимся от items» | Слоты лучше конфигурационных `items`, где роль неочевидна |
| «почему loading не disabled? фарш не прокрутить назад» | Решай глазами пользователя: что нажмёт, увидит, как отменит |
| «data-attrs — мы забываем про BEM» | Состояния — модификаторы |
| «дети сами отдавали ему инфу» | В compound дети регистрируются через контекст; порядок клавиатуры — из данных/DOM |
| «какая строка? submit — m-button/slot» | Строка списка никогда не сабмитит форму |

### 8.4 Вид и M3

- «Я создаю не ui-kit, а дизайн-систему»: компонент **выводится** из `docs/system`. Придумываешь —
  ты в зоне вкуса: остановись и вынеси развилку.
- M3 — эталон поведения и анатомии, но не догма: «бредовое по M3» не делают; красивое, но «не про
  M3», не берут.
- «Не пусто» и «не облачно»; бандл важнее эффекта; сначала нативный CSS.
- Две механики на одно поведение — баг (`craft.md` §7).
- Не ломай первый кадр SSR.
- Тексты (комментарии, отчёты) — факты, без ИИ-пафоса и пустых метрик («21 shape? сурьёзно?»).

### 8.5 Стоп-правила (не обойти и не решить самому)

Новая зависимость, новый Pinia-store, новый системный токен, новый морф/пружины, удаление
публичного компонента, правка `.proto`/контрактов вне кита, правка общих файлов оркестратора,
массовая правка «попутно» вне группы. Если без этого никак — опиши в развилках и сделай всё
остальное.

### 8.6 Ломающие изменения

Кит 0.x, стабильной версии нет. Ломать можно, но только по утверждённому списку, с миграцией в
отчёте. **Решение владельца 2026-10-18 (свежее, отменяет практику ветки): старое удаляется сразу —
без алиасов, без dev-предупреждений «снято», без «работает ещё релиз»** («legacy и ошибка не нужна,
так как у нас нет стабильной версии»). Новых `useRetiredValueWarning` / `useRetiredPropWarning` не
добавлять. Уже существующие (`composables/button/useRetiredValueWarning.ts` используют avatar,
button/icon, split, card, date-picker, dialog/date, expansion-panel, fab-menu, list/item,
text-field + `useFieldShape`, time-picker, `useFabProps`) — **перечисли в аудите своей группы**
(что за снятое значение, где); снимать ли их сейчас — один общий вопрос владельцу, его задаст
оркестратор. Потребителей внутри кита правишь в том же изменении (для чужих групп — заявкой).

---

## 9. Технический свод

### 9.1 Структура компонента

```
components/ui/<name>/index.vue      шаблон + тонкий <script setup> + <style lang="scss">
components/ui/<name>/props.ts       mXProps + MXProps + emits-тип; JSDoc на каждом пропе
components/ui/<name>/context.ts     createContext('m3:<name>'), если есть дети
components/ui/<name>/index.spec.ts  или tests/{variants,interaction,keyboard,a11y}.spec.ts
components/fragments/<name>/…       приватные части
composables/<name>/use<Name>Control.ts (+ .spec.ts)   DOM, события, ARIA → бэги атрибутов; тип возврата явный
composables/<name>/<чистая-логика>.ts (+ .spec.ts)   без Vue и DOM
assets/stylesheet/components/<name>/_index.scss      $tokens (+ _states.scss)
playground/fixtures/<name>/{matrix,stress}.vue + <name>.e2e.ts
```

Порядок в `.vue`: `<template>` → `<script setup>` → `<style>`. ESLint stylistic: без точек с запятой;
`a => f(a)`; блочная стрелка в скобках `(a) => { … }`. Комментарий — крайняя мера и только «почему»
(неочевидное правило, обход ограничения, код «не как обычно»), JSDoc на публичном API; без пересказа
кода, без закомментированного кода, без TODO без тикета. Хочется пояснить «что» — переименуй/упрости.
Минимальный diff: несвязанный код не трогаешь и «попутно» не рефакторишь.

### 9.2 Токены

```scss
// assets/stylesheet/components/<name>/_index.scss
$tokens: (
  container: (
    color: map.get($theme-color-link, 'surface-container-high'),
    shape: map.get($theme-shape-link, 'extra-large'),
    padding: (inline: spacing(16), block: spacing(8)),     // 0,2,4,8,12,16,20,24,32,40,48,64
    elevation: elevation(1),
    outline: (width: max(1px, 1rem)),                       // hairline
  ),
  label: (offset: calc(#{spacing(12)} + #{spacing(2)})),   // вне шкалы — calc здесь
  density: (compact: (height: 32rem), default: (height: 40rem), comfortable: (height: 56rem)),
);
```

```scss
// index.vue
<style lang="scss">
@use '#kit/assets/stylesheet/components/<name>/index' as t;
.ui-<name> {
  $t: material-map(t.$tokens, 'md-<name>');
  position: relative;
  isolation: isolate;                      // локальные z-index 1–3
  padding: g($t, 'container.padding.block') g($t, 'container.padding.inline');
  &::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
    background-color: currentcolor; opacity: 0;
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard); }
  @include can-hover { &:hover:not(.ui-<name>--disabled)::before { opacity: state-opacity(hover); } }
  &:focus-visible { @include focus-ring; }
  &:active:not(.ui-<name>--disabled)::before { opacity: state-opacity(pressed); }
  @each $step in (compact, default, comfortable) {
    &--density-#{$step} { min-height: g($t, 'density.#{$step}.height'); }
  }
  @include forced-colors { border: 1px solid ButtonText; }   // 1px законен только здесь
}
</style>
```

- Вложенность карты = путь `g()`. Ключ с дефисом допустим как имя ключа; разделитель пути — точка.
- Тень — `elevation(0..5)`, состояние поднимает её ровно на уровень. Скругления —
  `$theme-shape-link`, новых ступеней нет (S2 снят).
- Инструменты `abstracts/` (в scope без `@use`): `g`, `material-map`, `spacing`, `state-opacity(hover|
  focus|pressed|dragged|disabled-container|disabled-content|disabled-container-subtle)`, `elevation`,
  `z`; миксины `can-hover`, `focus-ring`/`focus-ring(inset)`, `forced-colors`, `sr-only`,
  `typescale`, `use-scrollbar`.
- **Одно свойство на состояние**: outlined → цвет рамки, filled → тон контейнера.
- Z-index: страница — `z(header|aside|overlay-host)`; внутри компонента — литерал 1–3 при
  `isolation: isolate`; оверлеи — нативный top layer.
- Скруглённый скролл-контейнер ставит `--ui-scrollbar-inset-block/-inline` в токен радиуса;
  `scrollbar-width/color` в компонент не добавляй (кроме `scrollbar-width: none`).
- Runtime custom properties — только для «живой геометрии», известной лишь рантайму
  (`--m-slider-percent`, `maxHeight` панели). Цвет и состояния — никогда.
- Найденный дефисный путь при переводе на точки **включает CSS, которого раньше не было** — это
  визуальное изменение: скриншот через дирижёра, упомяни в отчёте.

### 9.3 Пропсы и оси

```ts
export type MXVariant = Extract<MVariant, 'filled' | 'outlined'>
export const makeMXProps = propsFactory({
  ...makeStateProps(),
  /** Surface treatment. */
  variant: { type: String as PropType<MXVariant>, default: 'filled' },
  /** Height and padding step. */
  density: { type: String as PropType<MFieldDensity>, default: 'default' },
})
```

- `defineProps(mXProps)`, `defineModel`, `defineSlots`, типизированные emits. Типы generic-SFC — в
  `props.ts`/`types.ts`, иначе не попадут в `dist`.
- Канонические оси (`axes.md`): `color: MColor`, `variant: MVariant`, `density`, `shape: MShape`
  (шкала скруглений), `tag`, `mode`, `<x>Placement`. Не вводить `size`, `type` (ОВ-2).
- Булев флаг честен, только если второго значения физически нет.
- Контекст детям: `createContext<XContext>('m3:x')`. Тему на поддерево не провайдить.
- Императивные сервисы — на `useNuxtApp().$material`, не экспортируемые `openX()`.

### 9.4 Поведение (`behavior.md`)

```
чистая логика (без Vue/DOM) → control-композабл (DOM, события, ARIA → бэги) → тонкая презентация
```

- Контракт: сотри тег компонента, оставь `v-bind` + хук — поведение цело.
- Композабл не отдаёт `class`/`data-*` — спека монтирует бэги на анонимную разметку и проверяет.
  `useSliderControl` с `data-*` старше правила — не копировать.
- Один клавиатурный контроллер на паттерн (есть `useSliderControl`, `createRangeKeyboardController`
  — третий не заводим). Roving-эталон — `ui/tabs`. Typeahead — `useTypeahead`.
- Измерения кэшируются, инвалидируются по scroll/resize, троттлятся rAF. `getBoundingClientRect`
  на каждое движение указателя — баг.
- Окно и брейкпоинты — `useSSRWindowSize()` / `useBreakpoint()`.
- Жест абсолютен (от точки старта), не накапливается по дельтам.
- Нативный элемент лучше нарисованного: рисуй поверх него.
- Focus trap (`useFocusTrap`) только переводит фокус на контейнер и держит Tab внутри; что
  фокусировать внутри — решает компонент.

### 9.5 Доступность (минимум)

- Роли, `aria-*`, `tabindex` — в SSR-HTML; связи через `useId()`.
- Клавиатура по APG; Esc закрывает и возвращает фокус.
- У icon-only контролов — доступное имя; декор — `aria-hidden="true" focusable="false"`.
- Живые регионы смонтированы всегда, меняется только текст.
- `aria-invalid` только при видимой ошибке; ошибка не одним цветом.
- Цель нажатия ≥ 24 (`compact` ниже не опускается).
- Disabled-текст 38% — исключение WCAG 1.4.3; `expectNoAxeViolations` пропускает contrast внутри
  `--disabled`.
- Кнопка внутри `<form>` без `type="button"` сабмитит форму — проверяй.

### 9.6 Тесты

- **Unit** (Vitest, `mountSuspended`): рендер и корневой класс; пропы → BEM и атрибуты; v-model и
  emits; роли и aria; disabled гасит взаимодействие; fallthrough-атрибуты; композабл без
  `class`/`data-*`; чистая логика — таблицей. jsdom: фокус только при `attachTo: document.body`,
  `import.meta.dev === false` (dev-warn без покрытия — пометь комментарием), оверлеи в
  `document.body`. Без реальных таймеров.
- **e2e** (Playwright + axe, гоняет дирижёр): `matrix.vue` (строки = состояния, колонки = варианты и
  плотности), `stress.vue` (длинный текст, слово без пробелов, пусто, много элементов),
  `<name>.e2e.ts`: axe по `THEMES × DIRECTIONS` и на stress; нет переполнения на `WIDTHS`
  (360/768/1366); Tab-обход; клавиатурная модель; видимость фокуса; forced-colors через
  `getComputedStyle`; **новое — стабильность геометрии и плавность** через `traceMotion` /
  `analyzeMotion`. `waitForMotion` перед замерами. `data-test` — единственный `data-*`, только в
  фикстурах. Скриншотной регрессии и Storybook нет — не предлагать.
- Падение в e2e — сначала реши: **неверное допущение теста** или **дефект компонента**. Чини то, что
  неверно, и скажи, что именно. Типичные допущения: px vs rem (`remInPx`), прокрутка страницы при
  фокусе (мерить относительно поля), граница `border-collapse` делится между строками.
- Найденный дефект **старше редизайна** (не код этой ветки) — сообщи, молча не чини.

---

## 10. Уже решено — не предлагать повторно

- vw-корень (`calc(1vw / f)`), RS-04/05/06 — принятое отклонение; кольцо фокуса в 1px на ширине
  1201–1279 (и 1280 в prod) — «пока edge-case», не чинить.
- pressed 12%; disabled-контейнер 12%; density из трёх ступеней; кнопки 32/40/56; FAB 40/56/96;
  tonal кнопки = `<role>-container`.
- Нет Expressive-пружин и морфа, кроме toggle и FAB menu; нет XS–XL; split без «круглого» open.
- vee-validate-адаптер и `./validation` остаются.
- Фокус полей — цвет; кольца и утолщение рамки у полей; второй красный тон для focused-error.
- `ghost`, `terminal`, `code`, `underline` у textarea/number-input/dropdown/autocomplete,
  `labelPlacement: inline`, `MFieldGroup` сейчас, `density` у textarea, wheel-изменение числа,
  `slider-bound`, отдельные пропы scrub/split/stacked.
- Подложка-патч и clip-path+JS под вырезом outlined-поля (только fieldset/legend). Плавающий лейбл
  не анимируется.
- Floating UI, `@oddbird/*` и любые полифиллы; vue-final-modal; `openModal`.
- Примитивные массивы в `items`; порядок детей из реестра.
- Общий глобальный announcer; глобальный focus-класс; primary-кольцо фокуса.
- Storybook, скриншотная регрессия, корневой `tests/`, фикстуры внутри публикуемого кита.
- `MConfirmEdit` как компонент (есть `useConfirmEditTransaction`); `MDialogTime`; docked/range
  date-picker; счётчик в `MTextField`; одиночный выбор строк `MTable`; `column.maxWidth`; статусные
  тона `MTimelineItem`; кнопочная карточка и «stretched link».
- Полный список с причинами — `docs/system/*/decisions.md`.

---

## 11. Прошлые ошибки агентов (анти-паттерны)

- Писали e2e, не запуская их: 51 из 541 упал (rem vs px, тайминги, реальные дефекты). Теперь —
  заявка дирижёру после каждого компонента.
- Сдавали визуал, не посмотрев, — дважды подряд сломанный. Теперь — `shootStates` и сам смотришь PNG.
- `data-x="false"` поднимал лейбл в покое (селектор `[data-x]` матчится) — «очень сильная
  деградация логики».
- Миксин с неверной арностью прошёл тесты и линт и сломал dev-сервер владельца — `lint:scss` после
  любой правки стиля.
- Тихий мёртвый CSS: ~100 дефисных путей резолвились в `null`.
- `> span` и высокая специфичность в вырезе outlined; ошибка проигрывала фокусу по специфичности.
- Утверждали поведение по памяти, не прочитав файл («не путай меня»); заявляли «нужен px» в
  брейкпоинтах, не прочитав миксины.
- Крутили соседнюю ручку (`staggerMs`) вместо настоящей (`duration`), спрятав константу.
- Сразу строили незаказанный реестр + флаг и откатывали всё.
- Длинные списки «открытых вопросов» без ясности «что осталось» («я не понимаю, к чему ты ведёшь»).
  В конце — коротко: сделано / осталось / нужно твоё слово.
- Hover-селекторы перебивали selected/active (таблица, чип) — состояние терялось под курсором.
- Физические `left/translate` ломали RTL; `@media` там, где нужен container query.
- Двойной `update:modelValue` (сеттер + явный emit), спрятанный тестом с `.at(-1)`.
- `aria-live` на `v-if`-узле; `$attrs` на обёртке; `0` считался пустым; Enter всегда
  `preventDefault`.
- `overflow: hidden` срезал кольцо фокуса (split, AM/PM).
- Один агент 3 часа, второй простаивал — если закончил раньше, скажи оркестратору: он даст ещё.

---

## 12. Отчётность и готовность

### 12.1 Финальное сообщение хода

- **P1 (аудит)**: путь к файлу аудита + 5–10 строк: сколько находок по осям, сколько развилок,
  главное. Ничего не реализуешь.
- **P2/P3**: что сделано по компонентам (файлы), гейты (exit code каждого), e2e у дирижёра (id
  заявок, счётчики), что не проверено, ломающие изменения + миграция, заявки на чужие файлы,
  открытое. Плюс раздел «Modern Web Guidance» (§7).
- Ждёшь дирижёра и закончил ход — начни сообщение с `WAITING <id>`. Заблокирован развилкой —
  `BLOCKED:` и вопрос по формату §5.6.

### 12.2 Что обновить в конце P2

- План компонента: блок implementation-status (`state`, `updated`, что сделано в этом прогоне).
- QA JSON `.cursor/summary/runs/quality/data/<name>.json`: закрытые пункты → `PASS` с заметкой
  `M3-polish (2026-10-…): <файл:строка | тест>`, MANUAL, подтверждённые пробой, → PASS/FAIL по факту.
  Проверка: `node .cursor/summary/runs/quality/_build.mjs --check <name>`. Каталог в
  `.git/info/exclude` — в `git status` не видно, это нормально.
- Раздел своей группы в summary: файл
  `.cursor/summary/m3-polish-<группа>_<YYYY-MM-DD>_<HHMM>.md` по шаблону:
  решения · что сделано · закрытые пункты аудита · тесты и гейты · проверено скриншотами /
  не проверено · ломающие изменения и миграция · открытые вопросы · риски и долги · выходной CSS
  компонентов до/после (байты и gzip, из `css-sizes.json` базы и финала) и строки `src`.
- `docs/system` — не трогаешь; правило, которое просится туда, — в отчёт (оркестратор внесёт в обе
  локали).

### 12.3 Definition of Done компонента

- [ ] Все утверждённые пункты сделаны или явно перенесены с причиной.
- [ ] Нет дефисных путей `g()`, литералов ms/px/rgb/%, голых `:hover`, `>`-селекторов, `data-*`
      состояния.
- [ ] Пять состояний, forced-colors, reduced motion (укорочение), RTL на логических свойствах,
      hairline `max(1px, 1rem)`.
- [ ] Пробы чистые: нет `jump`/`shift`/лишних `reversal`/`unsettled` в утверждённых сценариях;
      морф (если есть) плавный по §6.2.
- [ ] Роли и `aria-*` в SSR-HTML, клавиатура по APG, нет английских дефолтов.
- [ ] Файлы ≤ ~400 строк, логика в композаблах, композаблы без `class`/`data-*`.
- [ ] Unit-спеки рядом с кодом; `matrix/stress` + e2e с регрессией найденных дефектов — зелёные у
      дирижёра.
- [ ] Гейты §4 — exit 0.
- [ ] QA JSON обновлён (`--check` чистый), план обновлён, summary-раздел написан, непроверенное
      помечено.

### 12.4 Git

Не коммить. В конце дай список коммитов в стиле лога (Conventional Commits, английский, строчными,
утверждение о поведении: `fix(text-field): label stays put on focus, notch keeps the gap`), скоуп —
имя компонента, ломающее — `feat(x)!:` + `BREAKING CHANGE:`. Одно поведенческое изменение на коммит.
Масштаб не преуменьшать. Коммитит владелец.
