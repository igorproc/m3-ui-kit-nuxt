# Plans audit 2 (2026-10-30) — общий бриф аудитора

Фаза 1: честная сверка планов `.cursor/plans/feature/components-should-update/**` с кодом
`src/runtime/**` **рабочего дерева** (≈686 незакоммиченных файлов — это актуальный код, HEAD
устарел, `git diff HEAD` не источник правды о «сделано»). Исходники кита **не правим**.

## Что можно и что нельзя

- Можно: читать всё; писать пробы `playground/probes/plans-audit-2/<группа>/*.probe.ts`
  (папка вне git); добавлять **новые** фикстуры-файлы `playground/fixtures/<name>/audit-*.vue`;
  писать свой отчёт `.cursor/handoff/plans-audit-2/parts/<группа>.md`.
- Нельзя: править `src/runtime/**`, `docs/**`, планы, существующие фикстуры и e2e,
  `playground/app/**`, `playground/e2e/**`, конфиги; коммитить; `git checkout/stash/reset/restore`;
  запускать/останавливать dev-сервер; запускать полный `npm run test`/`typecheck`/`build`.
- Папки фикстур, занятые родительской сессией, — **не трогать даже добавлением**:
  `playground/fixtures/{rating,breadcrumbs,app-bar,system-bar,layout}/`. Нужна фикстура для них —
  новая папка `playground/fixtures/audit-<name>/` и затем `touch playground/app/utils/fixtures.ts`
  (новую папку работающий сервер иначе не видит). Новый файл в существующей папке подхватывается сам.
- Фикстура: `<template>` → `<script setup lang="ts">`, явные импорты `#kit/components/ui/...`,
  единственный `data-*` — `data-test`. Страница фикстуры: `/<name>/<case>?theme=light&dir=ltr`.

## Сервер и пробы

- Dev-сервер уже запущен оркестратором: `http://127.0.0.1:3200`. Не запускай свой.
- Запуск: `npx playwright test -c playwright.probe.config.ts playground/probes/plans-audit-2/<группа> --output test-results/plans-audit-2/<группа>`
  (можно указать один файл). **`--output` обязателен**: общий `test-results` параллельные прогоны чистят
  друг у друга (`browserContext.close: ENOENT … .playwright-artifacts-0\traces`) — такое падение не
  дефект, перезапусти пробу. Окно по умолчанию 1280×800. Параллельно гоняют пробы ещё 8 аудиторов,
  родительская сессия правит свои файлы → HMR может перезагрузить страницу: упавшую пробу
  перезапусти **один раз**, прежде чем считать падением. Первая загрузка фикстуры — до ~30 с.
- Хелперы: `import { openFixture, remInPx, waitForMotion, expectNoAxeViolations } from '../../../e2e/support'`.
  Размеры из плана (dp) сверяй в rem: `box.height / await remInPx(page)` (1rem = 1 дизайн-пиксель).
- Пробы — измерения, а не тесты-под-ожидание: `expect.soft` + `console.log` фактических значений
  (computed-стили, rem-размеры, роли/aria, фокус после клавиш, `dir=rtl`), чтобы один прогон дал
  полную картину. Первый кадр SSR: `test.use({ javaScriptEnabled: false })` + `page.goto` и проверка
  серверного HTML (не жди `[data-fixture-ready]` без JS — проверь, ставится ли он на сервере).
- Пробы — на поведение и геометрию, которые обещает план (клавиатура, указатель, RTL, размеры,
  роли, состояния, первый кадр). Чистые вопросы кода (наличие пропа, токена) — `file:line`.

## Как сверять план

Тегу `<implementation-status>` **не верь** (пример: `form/rating.md` помечен `done`, а указатель
округляет значение по всему ряду с зазорами, превью гасит залитые значки, правый клик фиксирует
значение). По каждому плану пройди: «План работ», «Готово, когда», «API», «Токены: расхождения»,
«Оси дизайна/состояний», «Открытые вопросы», концепт `.cursor/plans/feature/renders/<name>/concept.webp`
(Read открывает картинку; сравни с фикстурой глазами только там, где нужно, скриншот пробы в
scratchpad — по желанию).

Статус пункта — одно из:
- **сделано** — есть в коде и (для поведения/геометрии) подтверждено пробой;
- **частично** — сделана часть, назови недостающее;
- **нет** — не начато;
- **регресс** — было сделано/работало, теперь сломано (укажи, чем: проба, `git log -p`, прежний аудит);
- **отменён** — решением владельца: ссылка на `docs/system/ru-RU/decisions.md` (раздел/строка) или
  журналы `.cursor/handoff/sweep-run/decisions-log.md`, `.cursor/handoff/sweep-run-2/decisions-*.md`,
  `.cursor/handoff/kit-bugs/questions.md` (Q-ответы), память владельца (S3/S4 — морф/пружины
  отклонены; density = 3 ступени; мишень 48 только `pointer: coarse` и т. п.).

Источники решений: `docs/system/ru-RU/decisions.md`, `.cursor/handoff/sweep-run/decisions-log.md`,
`.cursor/handoff/sweep-run-2/{decisions-log.md,decisions-G1..G6.md,owner-questions.md}`,
`.cursor/handoff/kit-bugs/questions.md`, `.cursor/plans/feature/components-should-update/common.md`.
Для сравнения: прошлый аудит `.cursor/handoff/sweep-run/plans-audit_2026-10-23.md`, итоги прогона 2
`.cursor/summary/sweep-run-2_2026-10-24.md`.

Правила кита, против которых тоже сверяешь (нарушение = пункт «частично/регресс»): BEM без
тег-селекторов и `>`; состояния — `--modifier`, не `data-*`; всё в rem; производные (`calc`) — в
карте `$tokens`, `.vue` только `g()` с точечными путями; без новых системных токенов; CSS-переменные
только у layout и `--md-sys-*`; первый кадр SSR верен без JS-досчёта; мишень 48 — миксин
`touch-target` (только `pointer: coarse`); файлы ≤ 400 строк; тесты рядом по эталону text-field
(`tests/{variants,interaction,a11y}.spec.ts`).

## Занятые родителем файлы (только читать и гонять пробы)

`src/runtime/composables/useLayout.ts`, `utils/layout/zone.ts`, `utils/layout/scroll.ts`,
`composables/overlay/useScrollLock.ts`, `components/ui/app-bar/**`, `components/ui/system-bar/tests/**`,
`components/ui/breadcrumbs/**`, `assets/stylesheet/components/breadcrumbs/**`, `directives/ripple.ts`,
`composables/popover/**`, `components/fragments/popover/**`, `composables/selection/useSelectionGroup.ts`,
`components/ui/text-field/index.vue`, `components/ui/textarea/index.vue` (+ их `tests/a11y.spec.ts`),
`components/ui/rating/**`, `assets/stylesheet/components/rating/**`,
`composables/slider/createRangeKeyboardController.ts`. Пункт плана, который ляжет в такой файл,
помечай `[занят]`. Родитель сейчас чинит: layout-вклады, windowY, SSR подзаголовка app bar, поле
крошек на таче, ripple, двойную блокировку скролла, `dir` у телепортированных поверхностей, порядок
`multiple` в selection group, dev-предупреждение text-field/textarea, rating — эти дефекты в отчёт
пиши, но с пометкой «чинит родитель».

`search` — WIP владельца: только аудит.

## Формат отчёта группы `parts/<группа>.md`

```md
# <Группа> — аудит планов

Итог: сделано N · частично N · нет N · регресс N · отменено N (по пунктам).

## <путь плана> — тег `<state>` → факт `<сделан|частично|не начат>` (тег верен | тег неверен)
| # | Пункт (раздел) | Статус | Доказательство | Объём |
|---|---|---|---|---|
| Ш3 | value indicator — капсула (План работ) | частично | `src/runtime/...:120`; проба `slider.probe.ts › indicator` — высота 44rem, ждали 44 | M |
...
Токены: совпадают N из M; расхождения — строками выше.

## Регрессии
## Планы с неверным статусом (тег → факт, одна строка почему)
## Развилки планов без рекомендации (план, вопрос, варианты) — только неотвеченные
## Пункты в занятых родителем файлах
## Пробы (файл → тесты → прошло/упало, ключевые измерения)
## Добавленные фикстуры
```

Объём: S — до часа, одна-две правки; M — полдня, несколько файлов; L — день+, API/архитектура.
Пункт-ID: «Ш<n>» — шаг «Плана работ», «Г<n>» — пункт «Готово, когда», «A» — API, «Т» — токены,
«О» — оси, «К» — концепт. Сделанное можно сворачивать в одну строку на раздел («Г1–Г6 сделано:
доказательства …»), несделанное — всегда отдельной строкой с `file:line`.

Отчёт — факты. Не пиши «сделано», если не видел в коде; не пиши «работает», если проба не
запускалась (тогда «не проверено»). Последнее сообщение агента — короткий итог (цифры, топ
пропусков, путь к part-файлу).
