# Auto-Layout Phase E — Wireframes — 2026-06-10

Plan: `.cursor/plans/auto-layout.md` (Фаза E). Status: **code complete** (9 параллельных
агентов), owner visual pass pending.

## Что сделано

1. **AGENT_BRIEF.md переписан (v2)**: семантика carving-движка (прямые дети, DOM-порядок =
   углы, sticky-механика и требование размера), нативный стек верхних баров (костыль v1
   удалён), маппинг `v-container/v-row/v-col → m-container/m-row/m-col` с правилами
   конверсии 12-колоночного Vuetify в относительные спаны (4/8/12), `v-system-bar →
   m-system-bar`, `v-spacer → m-spacer`, `v-responsive → m-responsive`,
   `v-footer app → m-layout-footer sticky sizeToken="44rem"` (raw-размеры допустимы).
2. **9 страниц** `app/pages/demo/wf/*.vue` (baseline, constrained, discord,
   extended-toolbar, inbox, side-navigation, steam, system-bar, three-column) — все
   self-contained (`layout: false`), на движке (ни одного ручного `position: fixed`),
   eslint+stylelint 0 на каждой.

## Компромиссы агентов (для визуального ревью)

- **baseline / system-bar**: временный `v-navigation-drawer` → `m-navigation-drawer`
  (модальный оверлей, не layout-unit) внутри `m-layout-main` — оверлеит, а не выкраивает.
- **discord / steam**: `m-app-bar variant="small"` (64rem) вместо Vuetify height=72 —
  у m-app-bar нет raw height-пропа; mdi square/circle/triangle → CSS-фигуры (нет ключей
  в ICONS).
- **constrained**: 1/6-сайдбар не выражается в 4-колоночной мобильной базе → стек на
  мобилке, `tablet-xs="2|6"`, `desktop-xs="2|10"`; `v-responsive max-width` → класс
  (компонент только про aspect-ratio).
- **extended-toolbar**: Vuetify `cols="4"` (3 в ряд из 12) → `cols="2" tablet-xs="4"
  desktop-xs="4"` (2 в ряд на мобилке/планшете, 3 на десктопе); overflow-иконка →
  ICONS.settings.
- **inbox**: тогглящийся drawer референса → постоянный sticky-aside (256rem); иконки —
  ближайшие из ICONS.
- **side-navigation**: аватарный мини-рейл → `m-layout-aside sticky 56rem` с круглыми
  div'ами (m-navigation-rail требует items с label).
- **three-column**: `hidden-md-and-up` → медиа-тогглы на пороге desktop-xs (1200);
  бар собран через `#container`-слот app-bar'а.

## Гейты
- eslint wf/ 0; stylelint wf/ 0; репо: `npm run lint` 0 errors, stylelint — только
  7 pre-existing (app-bar ×4, youtube ×2, list/item ×1); vitest 48/48.

## Визуальная проверка (owner)
`/demo/wf/<name>` все 9; особое внимание: steam/discord (full-height shell: footer на всю
ширину, aside между барами), system-bar (нативный стек двух баров), three-column
(2/8/2 на ≥1200), constrained (max-width контейнера).

## Next
Фаза F: переписать `kit/docs/layout.md`, миграция steam/youtube/primetime layouts на
прямых детей (опционально), снять deprecated-ветки, youtube.vue мёртвые вызовы,
консолидация resolveBreakpoints в useBreakpoint, roadmap.
