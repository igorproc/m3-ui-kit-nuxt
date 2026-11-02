# Sweep run 2026-10-23 — общий бриф агентов

Ты — один из трёх параллельных агентов. Оркестратор — сессия «Стоимость рефакторинга Kit».
Владелец (Игорь) не у компьютера: развилки решаются **по рекомендациям** из
`.cursor/handoff/kit-bugs/questions.md` (это его решение, принято 2026-10-23), с исключениями ниже.

## Что уже сделано до тебя (волна A, не переделывай)

- `g()` принимает **только пути через точку**; дефисная форма удалена (`abstracts/_functions.scss`).
  Любой промах — `@error`. Все 332 вызова уже переведены.
- Удалены алиасы: `useThemeStore`, тема `preset`, `MAppBar type="center-aligned"`,
  `MLayoutAside position left/right`, `MLayoutItem area`/`LayoutArea`/`KIND_BY_AREA`/`provideLayoutArea`.
- `createRegistry.ts` разбит: типы — `composables/registry/types.ts`, шина/кэш/каталог —
  `utils/registry/internals.ts`, контекст — `composables/registry/context.ts`; спек
  `createRegistry.spec.ts` (27 тестов) фиксирует поведение.
- `useSliderControl` — типы в `composables/slider/types.ts`; number-input — `_control.scss`.
- BEM-чистка: `lazy` (`__reveal`), `pagination` (`__item`), `alert` (`& &__close`).
- Дефолт контраста темы — `'standard'`.
- ESLint/Stylelint игнорируют `playground/render/**` и `coverage/**`.

## Решения владельца, которые ты обязан соблюдать

- **CSS-переменные нужны только layout-системе.** В обычных компонентах своих `--ui-*`
  (публичных или приватных) быть не должно. Значения — из `$tokens` через `g()` + BEM-модификаторы.
  Исключения: переменные размеров зон layout (`--ui-app-bar-height-*`, `--ui-system-bar-height`,
  `--ui-navigation-bar-height`, `--ui-navigation-rail-width*`) и runtime-мосты, которые пишет JS
  или анимирует CSS (`--ui-slider-*`, `--ui-menu-origin`, `--ui-fab-*`, `--ui-table-fade`).
- Рекомендации `questions.md` — по умолчанию; уточнения из
  `.cursor/handoff/kit-bugs/modern-web-improvements.md` — главнее рекомендации, если касаются твоего пункта.
- Подробные отчёты с `путь:строка` по каждому багу: `.cursor/handoff/kit-bugs/verify/verify-g1..g4.md`.

## Правила (нарушать нельзя)

1. Прочитай §0 (правила 1–34) из `.cursor/handoff/m3-polish/00-common.md` — они действуют, **кроме**:
   - п.1: **dev-сервер уже запущен оркестратором** на `http://127.0.0.1:3200`. Ты **можешь** гонять
     свои e2e: `npx playwright test playground/fixtures/<name>` (конфиг переиспользует сервер).
     Серверы, сборки, `nuxi`, `npm run dev`, браузерные MCP-инструменты — **нельзя**. Падение
     перезапусти один раз: правки других агентов перезагружают страницы через HMR.
   - п.2: фазы аудита нет — список утверждён, реализуешь сразу.
2. Не коммить, не делай `git add/checkout/reset/stash/restore`. В дереве лежит чужая WIP-работа
   владельца (search v2 и др.) — не трогай её.
3. **Трогаешь только файлы своей зоны** (см. свой бриф). Нужна правка в чужом файле — не делай,
   опиши в отчёте. Перед каждой правкой файла, который мог тронуть кто-то ещё, перечитай его.
   Используй Edit, не Write, для существующих файлов.
4. Баг → сначала тест, который его воспроизводит (colocated spec или e2e в фикстуре), потом фикс.
   Тест не подгоняется под баг.
5. Нашёл баг вне своего списка — не чини, запиши в отчёт.
6. Новая развилка, не покрытая `questions.md`: реши по своей лучшей рекомендации, запиши в отчёт
   как «решено по рекомендации: … вместо …, потому что …». Если решение необратимо или ломает
   публичный контракт сверх того, что уже одобрено, — не делай, пометь `СТОП`.
7. Гейты перед «готово» (exit 0): `npx eslint <твои пути>`, `npx stylelint "<твои vue/scss>"`,
   `npm run lint:scss`, `npx vue-tsc --noEmit` (ошибки только в `playground/render/**` не считаются),
   `npx vitest run <твои пути>`, `npx playwright test playground/fixtures/<твои>`.
   Базовые падения e2e до прогона: `C:\Users\pr0s1k\AppData\Local\Temp\claude\C--Users-pr0s1k--claude-spares-spare-XDSS77\7a32aea2-eb8c-4fd8-81e2-fb876a7c6c87\scratchpad\e2e-baseline-failures.txt` —
   новых падений быть не должно; ушедшие из списка — отметь.
8. Файл ≤ 400 строк (исключение — `text-field/index.vue`). Комментарий — только «почему».
9. Доки: всё, что меняет контракт, — строкой в `docs/` (layout.md, configuration.md,
   architecture.md, docs/system/en-US + ru-RU) в той же правке.

## Отчёт (финальное сообщение)

1. Таблица: пункт (B/N/Q-id) → сделано / не сделано / СТОП, файлы, тест, который это доказывает.
2. Решения по рекомендации, принятые тобой (с причиной).
3. Гейты: команда → exit code / счётчики.
4. Найденные баги вне списка; правки, нужные в чужих файлах.
5. Что не проверено (особенно визуальное).
