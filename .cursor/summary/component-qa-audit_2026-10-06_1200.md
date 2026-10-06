# QA-аудит компонентов по чеклисту качества (2026-10-06)

Read-only аудит всех 67 `src/runtime/components/ui/*` по `component-qa-checklist.md` (146 пунктов).
Код кита не менялся. Результат: `.cursor/summary/runs/quality/index.html` (+ `<component>.html`).

- Данные: `runs/quality/data/<name>.json`; HTML пересобирается `node _build.mjs` (валидирует схему).
- Решения пользователя: Storybook нет → TS-01..03 FAIL у всех; layout-примитивы — короткие отчёты.
- Итог: P1 FAIL 1077, P2 788, P3 171, MANUAL 719.
- Системные проблемы — `runs/quality/_systemic.json` (выведены вверху index). Перепроверены координатором:
  vw-root font-size (`base/_adaptive.scss`), порядок `showModal()`→`focusTrap.activate` в overlay,
  `:deep()` в не-scoped style (icon, dropdown, autocomplete), `&:hover { &-state }` (date-picker, dialog/date),
  неопределённые `--sys-elevation-*`, двойной emit у slider.
- RS-06 нормализован координатором в FAIL у 14 компонентов (агенты не учли vw-масштаб на мобильных).
