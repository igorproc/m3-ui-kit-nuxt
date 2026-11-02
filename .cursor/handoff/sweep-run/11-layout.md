# Агент L — layout (их группа B3 + N.5 + N.8 + B5.2b)

Сначала прочитай `00-common.md` рядом. Подробности каждого пункта с `путь:строка` —
`.cursor/handoff/kit-bugs/verify/verify-g1.md` (B3, N.5, N.8), рекомендации — `questions.md`
(Q7–Q10, Q21), уточнения — `modern-web-improvements.md` (N.8).

## Твоя зона файлов

`src/runtime/composables/useLayout.ts`, `src/runtime/composables/layout/**`,
`src/runtime/components/ui/layout/**`, `src/runtime/components/ui/app-bar/**`,
`src/runtime/composables/app-bar/**`, `src/runtime/components/ui/snackbar/**` (только N.5),
`src/runtime/components/ui/menu/index.vue` (только N.5: замена `<client-only>`-обёртки),
в `src/runtime/components/ui/navigation-rail/index.vue` — **только** привязка класса
`ui-navigation-rail--hosted` и его CSS-блок (B5.2b; остальной файл — у агента навигации),
`playground/fixtures/{layout,app,system-bar}/**`, `docs/layout.md`, `docs/architecture.md`
(разделы layout), `docs/system/**` (если правило layout).

## Список (всё утверждено)

| Пункт | Что сделать |
|---|---|
| B3.1 (Q7-А) | `m-layout-main` скроллит (`overflow-y: auto`) только в `full-height` — модификатор из контекста лейаута (например `m-layout-main--scroll`); иначе `overflow: visible; overflow-x: clip`, чтобы `sticky` внутри работал. Заодно убрать комбинатор `.m-layout--full-height > .m-layout-main` (`layout/index.vue:77`) — правило переезжает на модификатор main. |
| B3.2 (Q8-Б) | `container-type: inline-size` на main — только по явному пропу `container` у `MLayoutMain`; по умолчанию `position: fixed` внутри работает от viewport. Доку и рецепт `@container main-content` обновить. |
| B3.3 (Q9-А) | Малый `MAppBar`: `padding-block: 0` (min-height 64 центрирует 48rem-контролы), высота бара = токену. `padding.block` остаётся только medium/large. |
| B3.4a | Прибитая (fixed) зона с размером получает `min-block-size: var(--m3-layout-<id>-size)`. |
| B3.4b | Док: токены размеров прибитых зон живут на `:root` или литералами. |
| B3.4c | `m-layout-item` без `kind`: `kind` обязателен в типе + dev `console.warn`; без дефолта «второй main». |
| B3.4d | `insets.left/right` → `inline-start/inline-end` (`--m3-layout-inset-inline-*`, `insets.start/end`), без алиаса. Найди всех потребителей в ките (snackbar, fab-menu и т.п. — если это чужой файл, только перечисли в отчёте). |
| B3.5 (Q10-А) + B3.5c | Вложенный `m-layout`: модификатор `m-layout--nested` (`min-height: 0`), sticky-зоны вложенного остаются в потоке (без `fixed` от viewport). |
| B3.5b | `m-layout-item kind="main"` — класс `m-layout-item--main` с теми же минимумами, что у main (и модификатор скролла). |
| B3.6a | `MAppBar sticky` → модификатор `ui-app-bar--sticky`, привязанный к `props.sticky` (CSS sticky только с ним). |
| B3.6b (Q56-А) | `headingLevel` у `MAppBar`/`MAppBarTitle` без дефолта (прецедент `MCard`), рендерит `h{n}`. |
| B3.6c | Док «кладите `MAppBar` в `m-layout-header`»; dev-warn, если бар внутри main (по желанию). |
| N.5 | `m-snackbar` (и `MMenu`) под `m-layout`: корневой `<client-only>` даёт placeholder `<span>` → «Unregistered element». Гейт телепорта через `useMounted()`-подобный `v-if` (комментарий-узел, не span). |
| N.8 | `m-layout-main` в `full-height` не фокусируется (axe `scrollable-region-focusable`): `tabindex="0"` + focus-visible кольцо **только** под модификатором скролла (как B3.1). Уточнение modern-web: «только если внутри нет фокусируемого» требует DOM-проверки; реши так, чтобы SSR-атрибут был верным с сервера (не мигал после гидрации), и запиши решение. |
| B5.2b (Q21-А) | Rail «hosted» (100% ширины) только в aside/start-зоне; в main — своя ширина. Скорее всего нужен `kind` хоста в host-контексте `useLayoutItem`. |

Базовые e2e-падения, которые должны уйти: `layout.e2e.ts` × 5 axe (light/dark × ltr/rtl + full-height).

## Не делать

B3.6 landmark сверх `headingLevel`, сервис снекбаров (B4.9c), инсеты снекбара (Q20 — это оверлеи),
`MMenu` сверх N.5.
