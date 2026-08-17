# Vuetify-run фаза 3 «Content и collections» — закрыта 2026-07-16

Все 9 планов фазы 3 переведены в `state="done"`; счётчики в `index.md`
обновлены (37 done / 5 planned), в `roadmap.md` у фазы 3 проставлен статус.
Фаза выполнена автономно по прямому указанию человека.

## Что реализовано (kit + docs_v2 для каждого)

| Компонент | Тесты | Ключевое |
|---|---:|---|
| `MAlert` | 12 | severity → роли, live-region, close-слот |
| `MAvatar` + `getAvatarInitials` | 19 | фолбэк-цепочка, Unicode/RTL инициалы, stale-event guard |
| `MBanner` + `BannerActions` | 13 | нейтральная поверхность, auto-раскладка на CSS |
| `MBreadcrumbs` + `Item`/`Divider` | 13 | `nav > ol`, current-резолв, lossless overflow |
| `MChipGroup` (+ интеграция `MChip`) | 18 | выделенный контекст, roving focus, max/mandatory |
| `MListSubheader` | 6 | пассивная подпись, inset из токенов list item |

Полный сьют кита: **540 тестов, 73 файла — зелёные**. `npm run lint` — 0 ошибок.
Все затронутые файлы проходят `stylelint`; `vue-tsc` по новым компонентам чист.

## Ключевые решения

- **Severity → semantic role (alert).** Генерируемая схема не даёт success/warning
  ролей, поэтому маппинг объявлен явно в токенах: `info → secondary`,
  `success → tertiary`, `warning → primary`, `error → error`. Подтверждён
  человеком 2026-07-16 по фактической палитре (tertiary зелёный, primary янтарный).
- **Close-слот отдаёт свой класс** (`props.class`) в alert и banner: замена
  контрола наследует геометрию и state layers вместо перекрашивания. Селекторы
  переписаны так, чтобы работать без `.ui-button` — то есть и для нативной кнопки.
- **`name` зарезервирован на `<slot>`** — payload `fallback`-слота в `MAvatar`
  биндится одним объектом (`v-bind`), иначе `:name` становится именем слота.
- **Banner auto-layout** — статический `@media` на `$breakpoints.tablet-xs`
  (px: rem в media резолвится от initial 16px). Grid areas двигают строку
  действий, DOM/фокус-порядок не меняется.
- **BEM-паттерн stylelint** запрещает дефис внутри элемента: divider-leaf
  крошек стал отдельным блоком `ui-breadcrumbs-divider` (как `ui-banner-actions`).
- **Роутер в тестах.** Kit-слой не содержит pages → в Nuxt-тест-окружении нет
  роутера. Тесты link-режима (`MBreadcrumbs`) поднимают memory-router через
  `global.plugins`, чтобы реально проверять канонический NuxtLink-путь.
- **`MChipGroup` на runtime-props** (как `MAutocomplete`): docs-генератор API
  умеет читать только `defineProps(mXProps)`, type-only generics он не парсит.
- **`MChip` blocked-by-max** — `aria-disabled` + класс, но не нативный
  `disabled`: чип остаётся достижимым, а реестр сам отклоняет toggle.

## Побочные улучшения

- `MChip` получил focus-visible (раньше `outline: none` без индикатора) и
  blocked-презентацию; standalone-поведение не изменилось (регресс-тесты есть).
- `docs_v2/scripts/validate-docs.mjs` теперь проверяет граф `extends`
  токен-манифестов. Именно эта дыра дала 500 на `/api/docs/en/components/alert`
  (`extends: ["surface"]` без манифеста `surface`) — ошибка ловилась только в
  рантайме при запросе страницы. Проверка сразу поймала аналогичную ошибку в
  `chip-group` (`extends: ["chip"]`).

## Что НЕ проверено

Визуальная проверка в браузере не выполнялась (dev server автономно не
запускается). Нужен человек: скриншоты светлой/тёмной темы, контраст
severity-контейнеров alert, sticky-подзаголовок в скролле, overflow крошек.

## Известные проблемы (не мои, не трогал)

- `npm run lint:style` по всему киту даёт **5 pre-existing ошибок**
  `selector-class-pattern` в `app-bar/index.vue` (4) и `list/item/index.vue` (1).
- `tests/fab-menu.spec.ts` иногда даёт unhandled `EnvironmentTeardownError`
  (гонка teardown vitest-воркера, тесты при этом проходят).

## Следующий шаг

Фаза 4 «Navigation, data и views»: `useVirtualScroll`, `MPagination`.
Затем фаза 5: `MTimeline` (+`TimelineDivider`, `MTimelineItem`).
Перед завершением инициативы — обязательное финальное реформатирование планов
(`index.md`, раздел «Обязательное финальное реформатирование планов»).
