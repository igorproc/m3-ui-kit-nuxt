# Auto-Layout Phase F — Docs & cleanup (+ m-row gap fix) — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (Фаза F). Status: **done** — фича auto-layout
завершена (фазы A–F), остался только визуальный прогон владельцем.

## Bugfix по фидбеку владельца: m-row без gap

`m-row` полагался на spec-наследование гаттеров subgrid'ом — ненадёжно, и строчная ось
subgrid'ом не покрывается вовсе (implicit-строки внутри row были бы без вертикального
gap). Фикс: явный `gap: var(--m-container-gutter)` на `.m-row` (вне контейнера переменная
не определена → IACVT → `gap: normal`). `--no-gutters` объявлен после — переопределяет.

## Cleanup

- **`app/layouts/youtube.vue`**: два top-level `useLayoutItem`-вызова удалены (мёртвый
  код с v1 — над лейаут-компонентом нет m-layout-предка). Их замысел восстановлен
  правильно: `size-token="--ui-app-bar-height-small"` на header-зоне и
  `:size-token="isMobile ? undefined : sidebarSizeToken"` на aside (условно — иначе на
  планшете пустая колонка резервировала бы ширину при скрытом v-if-контенте).
- **`useBreakpoint`**: собственный merge заменён общим `resolveBreakpoints` (единый
  источник с движком).
- **docs/ `DocsSidebar.vue`**: удалён мёртвый хак `provide(Symbol.for('ui:layout'),
  null)` (ключ давно не тот; в v2 вложенный rail и так не регистрируется — parent-check)
  и deprecated `order: 0`; `area: 'left'` → `kind: 'start'`.
- Deprecated-шимы (`area`-маппинг, `provideLayoutArea` no-op, `order`/`isScrolled`
  пропсы) ОСТАВЛЕНЫ — снять при следующем major (внешние потребители — docs).

## Документация

- **`kit/docs/layout.md` переписан полностью** (старый описывал несуществующую
  padding-модель): carving-движок (DOM-порядок, parent-check, зоны/самодостаточные,
  вклады размеров), sticky-механика (fixed+резерв для top/bottom, sticky для сторон,
  per-item оффсеты), `useLayoutZone()`, таблица CSS-переменных, колоночная система
  (относительные спаны, таблица min-width семантики ключей — `tablet` = 1199!),
  анти-паттерны.
- **`roadmap.md`**: пункт 3 фазы 1 («auto-layout и изоляция регистрации») отмечен ✅ со
  ссылками.

## Гейты
vitest 48/48; eslint 0 errors; stylelint затронутых файлов 0 (репо — те же 7
pre-existing: app-bar ×4, pages/demo/youtube ×2, list/item ×1).

## Статус фичи auto-layout: ЗАВЕРШЕНА (код)

| Фаза | Что | Саммари |
| :--- | :--- | :--- |
| A | Движок v2: carving, DOM-порядок, parent-check, реестр | `auto-layout-phase-a_2026-06-10.md` |
| B | layoutContextZone: windowY, scrollLock, insets | `auto-layout-phase-b_2026-06-10.md` |
| C | Мульти-зоны, sticky/fixed, самодостаточность, m-system-bar/m-spacer | `auto-layout-phase-c_2026-06-10.md` |
| D | m-container/m-row/m-col/m-responsive, /demo/grid | `auto-layout-phase-d_2026-06-10.md` |
| E | AGENT_BRIEF v2 + 9 wireframes /demo/wf/* | `auto-layout-phase-e_2026-06-10.md` |
| F | Доки, зачистка, m-row gap fix | этот файл |

Ожидает: визуальный прогон владельцем (/demo/grid, /demo/wf/*, старые демо, docs).
Не вошло (кандидаты на следующие итерации): высотный проп у m-app-bar (wf хотели 72),
недостающие ключи ICONS (mdi-фигуры), снятие deprecated-шимов, миграция
steam/youtube/primetime на прямых детей, e2e на sticky-механику.
