# Фаза 2 — на паузе (2026-10-30)

Остановлено по слову владельца (через родителя). Все исполнители остановлены (TaskStop), dev-сервер :3200
остановлен, node на порту убит (`nuxi … dev playground`, PID 19604 + дети), порт свободен. Рабочее дерево не
откатывалось, недоделанное не доделывалось. Ничего не закоммичено.

Бриф фазы: `../10-phase2-brief.md`. Журнал оркестратора: `../decisions-log.md` (O1–O9). Вопросы владельцу:
`../owner-questions.md` (P1 мишень 48 у `MButton default`/segmented, P2 S6 emphasized, P3 комментарий пружин
`button/morph.ts`).

## Сделано оркестратором

- Lint проб аудита: `npx eslint playground/probes/plans-audit-2` → 0 (было 37 ошибок).
- S5 в WIP-демо — только места из вопроса (6 файлов, см. O7). S4 не понадобился (O6): S8 = А убрал те же ошибки vue-tsc.

## Группы

| Группа | Состояние | Отчёт / журнал | Что тронуто | Что не доделано |
|---|---|---|---|---|
| foundation | **закончена** | `foundation.md`, `../decisions-foundation.md` | W70-А (`utils/icon/glyphFill.ts`, `button/icon`), app skip-link (`playground/app/app.vue`, `fixtures/app`), icon (`utils/icon/knownGlyphs.ts`, `ui-icon__glyph`), shape (ClamShell, `assets/icon/shapes.ts` + svg, reduced motion), hotkey, lazy (SSR), virtual-scroll (в.1–3, Home/End), B1.7a (`composables/{icon,lazy,surface,grid}` → `utils/`, импорты в 5 компонентах) | `.ui-app__overlay-host > *` оставлен (исключение `decisions.md:119`); e2e `button` и `icon › loads late` не зелёные из-за чужих SCSS-ошибок на dev-сервере — перепроверить |
| navigation | **закончена** | `navigation.md`, `../decisions-navigation.md` | app-bar (safe-area вне layout, переходы в карте), breadcrumbs, nav-bar (`spacing()`, safe-area, dev-warn 3–5, `navigation/stress.*`, фикс неразрывной подписи), drawer, rail, pagination (мишень по блочной оси), tabs (hairline, мин. 24, `activeIcon`, `badge-anchor`), toolbar (`hasModel`, S9 `layout` → `orientation`) | — (B5.6d, B5.1a отложены Q56-А) |
| containment | **закончена** | `containment.md`, `../decisions-containment.md` | list (N3 плотность), list-subheader, table (compact 40, `__checkbox`, `__ring`, затухание без `--ui-table-fade`), timeline (S8 → `MColor`), `data/table.md` (S3) | DT-10 (отложен планом) |
| form | **почти закончена** — остановлена на «пометить отменённые шаги в планах» | `form.md` (раздел «Проверки» — `ЗАПОЛНЯЕТСЯ`), `../decisions-form.md` | checkbox (галочка `utils/choice/checkMark.ts`, stress), radio (геттер `value`, dev-warn группы, stress), switch (ручка 28, icons, stress), chip (`TValue`, мишень `removal="button"`, matrix/stress), chip-group (фокус после удаления, фикстуры + e2e), slider (dev-warn `origin`, BEM `--dragging`, stress), rating stress, selection-group (N4-а, `aria-disabled`, фикстуры), form-renderer (`role="status"`, сводка `fragments/form-renderer/summary` + `composables/form-renderer/useErrorSummary.ts`, N5-а, имя радиогруппы, фикстуры), 10 планов `form/*` | дописать «Проверки» в отчёте; пометить отменённые/отложенные шаги в «План работ»; vue-tsc красный в своих `fixtures/chip-group/matrix.vue` и `ui/selection-group/index.vue`; e2e `form-renderer` ни разу не прошёл (500 от чужой SCSS-ошибки в `MDropdown`) |
| feedback | **почти закончена** — остановлена на «журнал решений» | `feedback.md`, `../decisions-feedback.md` (25 строк, возможно не полный) | alert/banner (имя с заголовком, `spacing()`, модификаторы), loading (contained shape, SSR-спека), progress (stop у wavy, зазор и старт circular, токены `composables/progress/circularTokens.ts`, `utils/progress/useProgressbar.ts`, подпись вне роли, округление, `contain`, S10 `wavy` → `shape`), snackbar (пустой label, `spacing()`), фикстуры `badge/`, `feedback/{blocks,snackbar,matrix}`, `loading/`, 7 планов | сверить полноту журнала решений; e2e: последний прогон 59/5, повтор 17/2 — падения внешние (`vite-error-overlay` от `dropdown/_index.scss:53`, HMR) |
| menu | **в процессе** — остановлена перед переписыванием `useMenuControl` («Now the control rewrite») | нет отчёта, нет журнала | `ui/menu/{index,props,types,context}.ts/.vue`, `menu/{item,group}/index.vue`, `menu/tests/*`, стили `menu/{_index,_colors}.scss`, `composables/menu/{useMenu,useMenuControl}.ts`, `composables/popover/{placement,usePopover}.ts`, `fragments/popover/index.vue`, потребители `button/split/index.vue`, `fragments/number-input/Unit.vue`, `fragments/toolbar/overflow.vue` | `useMenuControl` на бэгах + спека; фикстуры `menu/{matrix,stress}` + `menu.e2e.ts`; план `overlays/menu.md`; журнал и отчёт; **стили меню сейчас ломают компиляцию** `fragments/dropdown/Panel.vue`, `ui/{dropdown,autocomplete,search,search/list/item}`, `ui/menu/{group,item}` (`lint:scss` 8 падений, на dev-сервере `vite-error-overlay`) — состояние посреди правки |
| overlays | **в процессе** — остановлена на фикстурах диалога («Now the dialog fixtures») | нет отчёта, нет журнала | dialog (`index.vue`, `_index.scss`, фикстуры `dialog/{matrix,stress,dialog.e2e}`), sheet (`index.vue`, `_index.scss`, свайп `useOverlaySwipe.ts`, `interaction.spec`, фикстуры `sheet/*`), overlay (`index.vue`, `props.ts`, `_index.scss`, спека), `useOverlayDismiss.ts` (+spec), tooltip (`useTooltipControl.ts` + spec, `a11y.spec`), modals (`createModalService.ts` + spec, `createModalHandle.ts`, `useModal.ts`, `useModalContext.ts`) | проверить законченность фикстур dialog/sheet; фикстуры `tooltip/*` и e2e (долгое нажатие); e2e голого `MOverlay` 360×350; планы dialog/sheet/tooltip/overlay/modals; журнал и отчёт; гейты группы не запускались |
| fields | **в процессе** — остановлена на тестах color-picker («тест подписей каналов, суффикс %, Shift ±10, инлайн-цвет образца») | нет отчёта, нет журнала | autocomplete (IME, `useAutocomplete.ts`, `remote.spec`, e2e), S1 (`dropdown/{index,props}`, `autocomplete/{index,props}`, `dropdown/tests/helpers.ts`), otp (`_cells.scss`, e2e), time-picker (`index.vue`, `period/index.vue`, стили, 3 спеки, e2e), color-picker (`Canvas.vue`, `Edit.vue`, `Swatches.vue`, стили, 2 спеки), file-upload (`Item.vue`, спека) | тесты color-picker; color-input (инлайн-цвет образца) — не начат; записи textarea Q1 / dropdown Q2-Q3 и журнал; планы `inputs/*`; отчёт; гейты группы не запускались |

## Гейты

- Каждая закончившаяся группа гоняла свои: scoped vitest (`--coverage.enabled=false`), eslint/stylelint по своим
  файлам, `lint:scss` (чужие падения игнорировались), e2e своих фикстур с `--output test-results/p2/<группа>`,
  vue-tsc (ошибки в своих файлах — 0 у foundation, navigation, containment, feedback).
- **Целиком не запускалось ничего:** `npm run lint`, `lint:style`, `lint:scss`, `typecheck`, `test`, prod-сборка
  и полный e2e. По последним данным групп: `lint:scss` — 8 падений от недоделанных стилей меню; vue-tsc — ошибки в
  файлах form (`fixtures/chip-group/matrix.vue`, `ui/selection-group/index.vue`) и, со слов foundation, в
  `menu`, `toolbar`; S4-ошибки в демо и `fixtures/timeline/matrix.vue` ушли.

## Не начато оркестратором

S9 (общая ветка `selected`), сведение журналов в `docs/system/{ru-RU,en-US}/decisions.md`, правка справочников
(`common.md` S2/S3/S6/S8, `index.md`, `coverage-matrix.md`, `roadmap.md`), changelog, удаление `audit-*.vue`
фикстур, полные гейты, prod-e2e, summary.

## Как продолжить

1. Возобновить группы menu, overlays, fields (их транскрипты целы — продолжить с места остановки) и дописать
   form/feedback (проверки, журнал, «План работ»).
2. Поднять dev-сервер, прогнать e2e затронутых фикстур.
3. Дальше — по пунктам «Не начато».

## Снято (2026-10-30)

Пауза снята родителем («продолжай»). Группы доведены, S9 и сведение сделаны — итог в
`.cursor/summary/plans-audit-2_2026-10-30.md`.
