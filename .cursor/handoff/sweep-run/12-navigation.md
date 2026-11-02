# Агент N — навигация (их группа B5 + N.1 + Q24)

Сначала прочитай `00-common.md` рядом. Подробности с `путь:строка` —
`.cursor/handoff/kit-bugs/verify/verify-g*.md` (найди B5.*, N.1, B9.2a), рекомендации —
`questions.md` (Q22–Q25, Q32, Q50, Q56), уточнения — `modern-web-improvements.md` (Q24, Q25).

## Твоя зона файлов

`src/runtime/components/ui/{tabs,navigation-bar,navigation-rail,navigation-drawer,toolbar,pagination,breadcrumbs}/**`,
`src/runtime/components/fragments/breadcrumbs/**`, `src/runtime/composables/{tabs,navigation,toolbar,pagination,breadcrumbs}/**`
(какие есть), `src/runtime/composables/registry/{createSelection,createSingle,createGroup}.ts` (только если корень N.1 там),
`src/runtime/utils/button/useButton.ts` + `src/runtime/components/ui/button/**` (только «мягкий disabled» для Q24),
`src/runtime/components/fragments/table/pagination/**` (подвал таблицы для Q24), `shared/constants/messages.ts`
(только ключи навигации), новые фикстуры `playground/fixtures/{tabs,navigation,pagination,breadcrumbs,toolbar}/**`.

**Не трогай** в `navigation-rail/index.vue` привязку `ui-navigation-rail--hosted` и её CSS — это агент layout (B5.2b).
`composables/registry/createRegistry.ts` и `types.ts` только что разбиты и покрыты спеком — не меняй их.

## Список (всё утверждено)

| Пункт | Что сделать |
|---|---|
| N.1a (+B5.5c) | `MTabs`: заданный не-первый `v-model` применяется сразу при регистрации (SSR верен с первого кадра), до того как `mandatory: 'force'` откатится к первому. По verify: корень — `createSingle` без `reactive: true`/порядок apply. Спек на не-первый пресет. |
| N.1b (Q50-А) | Авто-выбранный первый таб по-прежнему пишется в `v-model`; описать в доке. |
| B5.5a | tablist именуется: `ariaLabel`/`ariaLabelledby` + dev-warning без имени. |
| B5.5b | Панели получают `id`; `aria-controls` только когда панель есть; `aria-labelledby`, `tabindex=0` на панели. |
| B5.9a | RTL: стрелки Left/Right меняются местами по вычисленному `direction` в момент нажатия (tabs, navigation-bar). |
| B5.1b (Q56-А) | Rail/bar: `emit('select', id, event)` на каждую активацию, включая повторное нажатие активного. |
| B5.2a | Rail: hover по активной «таблетке» не опускает её до pressed-прозрачности — индикатор непрозрачный, hover/pressed — отдельным слоем `::before`. |
| B5.3a | Bar: активный пункт — таблетка-индикатор 64×32 `secondary-container`, не только цвет. |
| B5.3b (Q22-А) | Контейнер bar/rail — плоский M3: угол 0, без тени, `surface-container`. |
| B5.4a | Drawer: контент скроллится (`__content { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain }`). |
| B5.4b (Q23-А) | Drawer `side: 'start' \| 'end'`, `left/right` удалить без алиаса; углы и translate логические. |
| B5.4c (Q56-А) | Drawer пробрасывает `#activator` из MOverlay (+ `aria-controls`). |
| B5.6a/b/c | Toolbar: icon+label рендерит обе части; `aria-pressed` у toggle-пунктов (и в single); `role="toolbar"`, `aria-orientation`, проп `ariaLabel` + dev-warning. |
| B5.7a + B9.2a (Q24-А) | «Мягкий disabled»: `aria-disabled` + глушение клика, кнопка остаётся в Tab-порядке — общий режим кнопки (прецедент `loading` в `utils/button/useButton.ts`). Pagination Prev/Next/First/Last и подвал MTable используют его — фокус не падает на `body`. |
| B5.7b | Slot-props пагинации: ключи `'aria-label'`, `'aria-current'` (не camelCase). |
| B5.7c (Q32-А) | Убрать английские дефолты пагинации; проп `pageLabel(page, current)`; dev-warning без подписей. |
| B5.8b (Q25 + modern-web) | `scroll`-режим крошек: `scroll-initial-target: nearest` на `li` текущей крошки (модификатор `--current`), без JS-фолбэка. Feature-detect не нужен: без поддержки остаётся начало списка, как сейчас. |

E2E: фикстур навигации в `playground/fixtures` нет — заведи минимально нужные (tabs с пресетом
не-первого таба и прямым URL; pagination: фокус после перехода на последнюю страницу; drawer со
скроллом) и спеки к ним.

## Не делать

Ссылки в rail/bar (B5.1a), клавиатура toolbar (B5.6d), compact-пагинация (B5.7d), click API крошек
(B5.8a), RTL у slider/progress/switch/menu/icon (B5.9b–d, f, g), hosted у rail (B5.2b — агент L).
