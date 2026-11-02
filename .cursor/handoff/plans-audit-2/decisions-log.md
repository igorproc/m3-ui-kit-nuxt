# Plans audit 2 — журнал решений фазы 2

Решения оркестратора; решения групп — `decisions-<группа>.md`, сводятся сюда в конце фазы.

| ID | Пункт | Решение | Основание |
|---|---|---|---|
| O1 | Развилки планов, S1–S10 | по рекомендованному варианту | решение владельца (сообщение родителя «фаза 2») |
| O2 | Новые развилки аудита N3–N7 | по рекомендации аудитора (`report.md` §5.2) | то же |
| O3 | N1 (мишень 48) | только образцы color-picker и период time-picker; `MButton default` и segmented — вопрос P1 | то же |
| O4 | N2 (S6 emphasized ↔ «без новых системных токенов») | не делать, вопрос P2 | то же |
| O5 | §6 отчёта (Q56-кирпичики, панели layout, переменная высота virtual-scroll, docs_v2/v3, рендеры) | не брать | то же |
| O6 | S4 (`MColor` → `MAccentColor` в WIP-демо) | демо не правится: S8 = А расширяет `MTimelineItem.color` до `MColor`, и те же ошибки vue-tsc уходят без правки чужого WIP; данные демо — только акцентные роли | минимальный diff, демо — WIP владельца |
| O7 | S5 (WIP-демо после ломающих изменений) | только места из вопроса: `size="small"` → `density="compact"` (`crm/details/CrmInlineEdit.vue`, `crm/team/CrmTeamCard.vue`), `type="warning"` → `color="warning"` (`crm/tasks/CrmTasksTab.vue`, `orders/OrdersSideColumn.vue`), подписи стрелок и переключателя вида у `MDialogDate` (`crm/new-deal/CrmDateField.vue`), `mode-toggle` у `MDatePicker` (`orders/NewOrderDeliveryFields.vue`, подписи переключателя там уже были) | S5 = А |
| O8 | `1px` внутри `@include forced-colors` | не нарушение; планы expansion-panel, avatar — сделаны | `agent-brief.md` §4 |
| O9 | Пробы аудита | `innerText` → `textContent` и стиль под ESLint; пробы вне git | `npm run lint` = 0 |
| O10 | Документация | Реестр `docs/system/*/decisions.md` (ru и en) сведён; в `../docs_v3` — `reference/decisions.md`, changelog 0.6.0, страницы и примеры (исполнитель) | Владелец в этой сессии: «документация — в ../docs_v3», вариант «Оба места» (O5 для документации снят) |
| O11 | S9 | Полный контракт `selected` / `unselected` → `container` / `content` / `shape` в 13 картах, включая tabs; CSS побайтно тот же | Владелец: «Полный контракт» (вместо рекомендованного «только имя ветки») |
| O12 | P3 (`button/morph.ts`) | А: поправлен комментарий, пружины те же | Родитель: всё, кроме N1 и N2, — по рекомендации |
| O13 | Аудит-фикстуры `audit-*` (20 файлов, вне git) | Вынесены из репо в scratchpad сессии (`audit-fixtures/`), не удалены | Бриф: «уберёт оркестратор»; файлы не в git — копия на случай нужды |
| O14 | Полный prod-e2e: 7 падений | 6 dev-only тестов: `radio` и `slider` получили `test.skip(CI \|\| E2E_PROD)` (на CI они бы упали), `navigation/stress` — `E2E_PROD`, тест слайдера разделён; `menu/stress.vue` — `&__corner.ui-button` (порядок чанков prod) | Память «Prod CSS order»; конвенция `CI \|\| E2E_PROD` |
| O15 | docs_v3 | Остановлено по слову родителя на целом месте; ничего не откатывается до решения владельца | Сообщение родителя (docs_v3 не под git) |
