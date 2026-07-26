# Vuetify-run фазы 4 и 5 — закрыты 2026-07-18

Все active-roadmap планы vuetify-run реализованы. Счётчики: **42 done / 0
planned**. Осталось только обязательное финальное реформатирование каталога
планов (см. `index.md`, раздел в конце) перед завершением инициативы.

## Фаза 4 «Navigation, data и views»

### useVirtualScroll (headless composable)
- `app/composables/virtual-scroll/geometry.ts` — чистая геометрия: константный
  размер аналитически O(1), size-функция через prefix-sum + бинарный поиск.
- `app/composables/virtual-scroll/useVirtualScroll.ts` — реактивная машина
  (idle/scrolling/programmatic/settling) на `useSSRWindowSize` +
  `useEventListener` + `useRaf` + `ResizeObserver`, scope-disposed cleanup.
  Range/overscan/boundaries/anchor/программная навигация с request-guard.
- `tests/virtual-scroll.spec.ts` — 13 кейсов. **Без docs-страницы**: composables
  получат отдельную HeadlessUI-подобную секцию позже (human direction).
- Measured variable heights отложены по плану.

### MPagination
- `shared/utils/pagination/index.ts` — чистые `createPaginationRange`
  (boundary/sibling, `siblingCount = floor((totalVisible-5)/2)`, всегда ровно
  `totalVisible` слотов, не прячет одиночную страницу) и `normalizePage`.
- Компонент переиспользует `MButton`/`MButtonIcon`; модель нормализуется вниз
  при сжатии `length`. `tests/pagination.spec.ts` — 21 кейс.
- Docs: **минимальная** страница (hero + reference-секция только с playground).

## Фаза 5 «Hierarchy и visualization»

### MTimeline + MTimelineItem + TimelineDivider
- `app/composables/timeline/context.ts` — view-only ordered registry.
  **Порядок по DOM** (`compareDocumentPosition`), а не по mount-порядку —
  иначе вставка в середину ломает parity/first-last. SSR: элементов нет,
  компаратор no-op, сохраняется insertion order (= DOM order при server render).
- Вертикальный v1; side start/end/alternate + per-item override, density, line,
  first/last коннектор, hideDot/hideOpposite, MColor маркер, article/div.
- `tests/timeline.spec.ts` — 15 кейсов. Docs: **минимальная** (hero + playground).

## Ключевые решения / грабли

- **Docs-валидатор ослаблен** (human direction): секции компонентной страницы —
  теперь *упорядоченное подмножество* канонических пяти (`isOrderedSubset`),
  правило «первая секция = overview» снято. Зеркально в `server/schemas/docs.ts`
  и `scripts/validate-docs.mjs`. Это разрешает минимальные страницы. Обновлены
  `[slug]/index.vue` (редирект на первую секцию, не на хардкод `/overview`) и
  затронутые тесты (`docs-schema`, `component-catalog`, `components-drawer`).
- **`state` в `*-interactive` рендерерах обязателен опциональным с дефолтом** —
  hero монтирует рендерер вообще без пропсов (урок из button-hero 500).
- **BEM stylelint снова**: статический селектор с дефисом в модификаторе
  (`.ui-timeline--side-alternate`) запрещён. side/line на таймлайне переведены
  в data-атрибуты (`[data-side='alternate']`); density остался классом
  (интерполяция в SCSS не проверяется статически).
- **`extends` в токен-манифестах** должен ссылаться на существующий манифест
  (нет `surface`/`chip`/`button`-manifest как таковых для extends surface) —
  та же ловушка, что дала 500 у alert. `timeline.json` → `extends: []`.
- Тесты `component-api-generator`/`components-drawer` держат счётчики/списки от
  каталога — при добавлении компонента обновлять список слагов (порядок:
  семейство, затем `navigation.order`).

## Проверено

- Kit: **589 тестов, 77 файлов — зелёные**. `npm run lint` — 0 ошибок
  (10 pre-existing `any`-warnings). stylelint/vue-tsc по новым файлам — чисто.
- docs_v2: **60 тестов — зелёные**. lint, lint:style, vue-tsc, docs:sync,
  docs:validate — чисто.

## НЕ проверено

**Визуально ничего не смотрел** — dev server автономно не поднимаю. Нужен
человек: virtual-scroll в реальном скролл-контейнере (геометрия покрыта юнит-
тестами, но не поведение в браузере), pagination ellipsis вживую, timeline
alternate-раскладка и collapse на узком экране, тёмная тема, коннекторы.

## Следующий шаг

Обязательное финальное реформатирование каталога планов (plain остаются
плоскими, family → `<parent>/index.md` + children; обновить все ссылки,
roadmap, navigation summaries; link/orphan audit). Плюс отложенная секция
docs для composables (HeadlessUI-подобная страница для `useVirtualScroll`).
