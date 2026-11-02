# Plans audit 2 — аудит планов и закрытие пропусков (2026-10-30)

Две фазы в одной сессии, ничего не закоммичено. Всё лежит в `.cursor/handoff/plans-audit-2/`.

## Фаза 1 — аудит

- Проверены все планы `.cursor/plans/feature/components-should-update/**`. Источник — рабочее дерево `src/runtime`, а не `<implementation-status>`.
- Доказательства — `file:line` и Playwright-пробы в `playground/probes/plans-audit-2/` (вне git).
- Итог: сделано 542, частично 101, нет 70, регрессов 0, отменено/отложено 102, не проверено 10.
- Пробы: 345 тестов, 313 прошли.
- Сводный отчёт — `report.md`, части по группам — `parts/*.md`.

## Фаза 2 — закрытие пропусков

Восемь групп исполнителей, оркестратор и проход S9. Пауза владельца описана в `phase2/PAUSED.md`, после неё работа продолжена с того же места.

| Группа | Отчёт | Журнал | Главное |
|---|---|---|---|
| foundation | `phase2/foundation.md` | `decisions-foundation.md` | W70-А (залитый глиф выбранной `MButtonIcon`), skip-link, ClamShell, B1.7a (`composables` → `utils`), virtual-scroll Home/End, lazy SSR |
| navigation | `phase2/navigation.md` | `decisions-navigation.md` | safe-area бара вне `m-layout`, rail standalone, tabs (`activeIcon`, hairline, бейдж), toolbar `layout` → `orientation` |
| containment | `phase2/containment.md` | `decisions-containment.md` | N3 плотность списка, table без `>` и без `--ui-table-fade`, timeline `color: MColor` |
| form | `phase2/form.md` | `decisions-form.md` | SVG-галочка checkbox, radio `value`, chip generic и мишень, chip-group фокус, slider BEM, selection-group `rows`, form-renderer: сводка ошибок и `statusText` |
| feedback | `phase2/feedback.md` | `decisions-feedback.md` | progress: `shape`, роль на индикаторе, зазор и старт circular, волна по Compose; loading contained + shape; имя закрытия alert/banner; snackbar без сообщения |
| menu | `phase2/menu.md` | `decisions-menu.md` | смонтированное открытым меню видно, ARIA и клавиши триггера, `useMenuControl` на бэгах, Expressive по умолчанию, `z-index` без 999, фактическая сторона для origin |
| overlays | `phase2/overlays.md` | `decisions-overlays.md` | разделители dialog на scroll timeline, свайп листа (56 rem и скорость), тултип без битой ссылки в SSR, EN-10, сервис модалок `open(component)` и `closeTop`/`closeAll(reason)` |
| fields | `phase2/fields.md` | `decisions-fields.md` | IME автокомплита, S1 generic `TItem`, otp квадратом, time-picker (атрибуты на `__body`, период на кнопках), color-picker (инлайн-цвет, мишени, Shift ±10, «%»), file-upload BEM |
| S9 | `phase2/s9.md` | `decisions-s9.md` | Полный контракт `selected` / `unselected` → `container` / `content` / `shape` в 13 картах. Скомпилированный CSS побайтно тот же (259 выходов) |
| docs_v3 | `phase2/docs-v3.md`, `phase2/docs-v3-mtimes.txt` | — | По слову владельца («документация — в ../docs_v3», вариант «Оба места») обновлены около 155 файлов `../docs_v3`: страницы, примеры, changelog 0.6.0. Работа остановлена родителем на целом месте; оригиналы не сохранены (docs_v3 не под git), vitest и lint docs_v3 после правок не запускались. Откат или доводку решает владелец |

### Решения оркестратора

`decisions-log.md` O1–O9. Дополнительно:
- P3 взят по рекомендации А: поправлен комментарий в `button/morph.ts`.
- Хвосты групп:
  - радиус dropdown теперь читается из `popover`;
  - удалены мёртвые токены `number-input` `unit.selected` и `toolbar` `menu.icon.size`;
  - JSDoc `FormFieldConfig.props`.
- Аудит-фикстуры `audit-*` (20 файлов, вне git) вынесены из репо в scratchpad сессии.

### Документация

- `docs/system/{ru-RU,en-US}/decisions.md` — сведены журналы всех групп, ru и en совпадают построчно. Изменения:
  - новые строки «Удалено»: S2, S6, циферблат, `stickyHeader`, Medium FAB, standard group;
  - около 30 архитектурных строк;
  - уточнены старые строки: timeline, toolbar, tooltip, sheet, modal, menu, touch-target, `--ui-table-fade`, исключения BEM;
  - миграции «hairline» и W70-А перенесены в «Закрыто».
- `docs/system/*/behavior.md`: убран рецепт `.ui-menu__item`.
- `docs/system/*/axes.md`: `shape` у `MProgress` — оговорённое исключение.
- `common.md` (S2, S3, S4, S6, S8, S9), `roadmap.md` (волна 1), `index.md` и `coverage-matrix.md`: button group и rich tooltip сделаны.
- `../docs_v3/content/en/reference/decisions.md`:
  - новые строки и раздел «Overlays and feedback»;
  - снят устаревший раздел «Settled, not yet migrated»;
  - `g()` только с точками.
- Страницы и changelog docs_v3 — см. `phase2/docs-v3.md`. Оригинал `reference/decisions.md` (его правил оркестратор) восстановлен в scratchpad сессии: `docs_v3-originals/content/en/reference/decisions.md`.
- Неполное в docs_v3 (из отчёта исполнителя):
  - в changelog нет изменений ранних волн;
  - панель темы в `Trigger.vue` внутри `<m-menu>` сломана фазой 2 (Tab закрывает меню, ширина до 280 против 360) — нужен выбор владельца;
  - мелкие правки гайдов не начаты;
  - рейл шелла docs на удалённом `MNavigationRailItem`.

## Ломающие изменения (0.6.0, без алиасов)

- **MProgress:**
  - `wavy` заменён на `shape="wavy"`;
  - роль и ARIA перенесены на индикатор или `<svg>`;
  - слот стал подписью;
  - классы волны изменились.
- **MToolbar:** `layout` заменён на `orientation`, тип `MToolbarLayout` → `MToolbarOrientation`.
- **MMenu:**
  - рецепт `button.ui-menu__item` больше не пункт меню;
  - пункты без roving;
  - новый вид (угол 16, строка 44, ширина до 280);
  - `usePopover` не пишет `z-index: 999`;
  - выбранная единица number-input — `tertiary-container`.
- **MCheckbox:** глиф теперь `svg.ui-checkbox__icon`.
- **MChip:** компонент стал generic, мишень `removal="button"` перенесена на кнопки.
- **MSlider:** `--dragging` больше не гасит переходы у всех потомков.
- **MFormRenderer:** сводка ошибок забирает фокус; новые пропы без дефолтов.
- **MSnackbar:** без сообщения не рисуется.
- **Alert / banner:** имя кнопки закрытия включает заголовок.
- **`swipeThreshold`:** теперь в rem, по умолчанию 56.
- **Тултип:** в серверном HTML у триггера больше нет `aria-describedby`.
- **MTimePicker:**
  - атрибуты переехали на `__body`;
  - классы периода и ключи карты изменились.
- **Color picker:**
  - подписи каналов и суффикс %;
  - удалены `--m-color-*-swatch`.
- **Dropdown / autocomplete:** строгие резолверы `keyof TItem` (затрагивает только типы).
- **Карты токенов (S9):** кто читает карты кита через `g()` по старым путям, получит `@error`.

## Открыто владельцу

`owner-questions.md`:
- **P1** — мишень 48 у `MButton default` и segmented.
- **P2** — S6 emphasized-типографика; от неё зависит трекинг кнопок TK-03.
- **P4** — WIP-демо на рецепте меню.
- **P5** — `scrollable-region-focusable` у тела dialog/sheet.

Стоит посмотреть глазами (решено исполнителями по плану, но с допущением):
- feedback F2-09 — плоский трек под волной;
- feedback F2-11 — где стоит подпись прогресса;
- menu MN11 — цвет иконок у vibrant;
- fields — строгие резолверы dropdown и рипл на read-only периоде.

## Не сделано

- По решению Q56-А отложены: кламп высоты панелей B4.2, очередь снекбаров B4.9c, клавиатура тулбара B5.6d, ссылки `to` в навигации B5.1a.
- Рендеры не пересняты.
- Safari и Firefox вживую не проверялись.
- Глазами фикстуры не смотрелись (правило владельца).

## Проверки (полный прогон, 2026-10-30)

| Проверка | Результат |
|---|---|
| `npm run lint` | 0 ошибок |
| `npm run lint:style` | 0 ошибок |
| `npm run lint:scss` | 163 таблицы стилей, без deprecations |
| `npm run typecheck` (vue-tsc) | 0 ошибок |
| `npx vitest run --coverage.enabled=false` | Первый прогон: 5345 из 5346. `modal/presets.spec.ts` упал по таймауту ленивого диалога под полной нагрузкой; отдельно файл проходит. Повтор: 5346 из 5346, 343 файла |
| `npx nuxi build playground` + `node playground/.output/server/index.mjs` + `npx playwright test --workers=4` | 1411 из 1418 (подробнее ниже) |
| Повтор затронутых спек на prod (`E2E_PROD=1`, после пересборки) | 120 прошли, 6 dev-only пропущены, 0 падений |
| Тесты dev-предупреждений на dev-сервере | 31 из 31 |

Семь падений полного прогона:
- **Шесть — тесты dev-предупреждений.** На локальной prod-сборке это ожидаемо. При этом у `radio.e2e.ts:99` и `slider.e2e.ts:173` не было пропуска на prod, на CI они бы упали.
  - Добавлен `test.skip(CI || E2E_PROD)`.
  - Тест слайдера разделён: проверка заливки идёт и на prod.
  - `navigation/stress.e2e.ts` получил `E2E_PROD`.
- **Седьмое — `menu.e2e.ts:306` (меню у угла не переворачивается).** Дефект фикстуры, только в prod: чанк `MButton` шёл позже, и его `position: relative` перебивал `position: fixed` класса фикстуры. Триггер оставался в потоке. Исправлено составным селектором `&__corner.ui-button` в `fixtures/menu/stress.vue`; на prod тест 3 из 3.

Dev-сервер и prod-сервер остановлены, порт 3200 свободен.
