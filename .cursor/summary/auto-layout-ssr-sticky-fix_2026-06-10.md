# Auto-Layout: SSR/no-JS sticky fix (generated per-item rules) — 2026-06-10

Баг-репорт владельца: `<header class="m-layout-header m-layout-header--sticky"
style="grid-area:top-v-0-1;">` — без JS нет `position`/`top`, хотя класс-модификатор
есть. Подозрение «возможно и в других компонентах» подтвердилось: дефект системный.

## Корень

Sticky-позиционирование v2 жило в **inline-стилях** (`layoutItemStyles`), а для
top/bottom оно требует `effectiveSize`:

1. **Inline родителя вычисляется до setup детей.** Если размер зоны приходит вкладом
   (`m-app-bar` внутри `m-layout-header`), на момент рендера `<header>` вкладов ещё
   нет → SSR-HTML уходит без `position: fixed`. На клиенте watchEffect доводил до ума
   (потому визуально с JS всё работало), без JS — бар в потоке.
2. **На сервере watchEffect не выполняется** → реестр держал снапшот размера времён
   setup → generated-грид для такой зоны получал `auto`-строку вместо size-переменной
   (резерв места не работал → CLS при гидрации).

## Фикс

- **Позиционирование переехало в generated-CSS** (`buildLayoutCss`): правила
  `#<layoutId> > [data-m3-zone="<id>"] { position: fixed|sticky; … }` эмитятся
  рядом с грид-шаблонами per-range. Head-payload резолвится ПОСЛЕ рендера всего
  дерева — вклады детей к этому моменту собраны. Inline несёт только `grid-area`.
- **Реестр отдаёт kind/size/sticky live-геттерами** (`snapshot()` в `useLayoutItem`):
  css-computed и на SSR, и на клиенте видит актуальные значения; реактивность течёт
  через геттер (чтение `effectiveSize` внутри css-computed трекается). Перерегистрация
  в watchEffect осталась только ради смены id.
- **Новый атрибут `data-m3-zone`** (`ZONE_ATTR` в carve.ts): `useLayoutItem` возвращает
  `layoutItemAttrs`, все зоны/самодостаточные компоненты биндят `v-bind="layoutItemAttrs"`
  (layout/{header,aside,footer,main,item}, app-bar, navigation-rail, navigation-bar,
  system-bar + docs/DocsSidebar).
- **Бонус — закрыт wart «скрытые зоны = implicit-track»**: зона, выпавшая из диапазона
  (aside на мобильном, end-сторона на планшете), получает `display: none` в том же
  generated-CSS. ВАЖНО: правила mobile-диапазона эмитятся в ОГРАНИЧЕННУЮ с обеих
  сторон media (`itemsMedia`), иначе `display: none` из безграничного базового блока
  протёк бы на десктоп (грид-шаблоны каскадом перекрываются, display — нет).
- Сигнатура `buildLayoutCss(layoutId, items, RangeSpec[])` — сам фильтрует/carve'ит
  per range (`RangeSpec {range, media?, itemsMedia?}`), `sizeDecls` строит из items.
- Dev-warning о безразмерной sticky top/bottom зоне переехал в `onMounted`+watchEffect
  (дети маунтятся раньше родителя — вклады к этому моменту точно собраны; старое место
  в inline-computed давало бы ложный варн до сбора вкладов).

## Каскад/специфичность

`#id > [data-m3-zone]` = (1,1,0) — перебивает компонентные классы (0,1,0): baseline
`position: sticky; top: 0` у app-bar и nested-fallback у rail корректно уступают
first-level правилам движка. Комментарий в rail обновлён.

## Файлы

`composables/layout/carve.ts` (ZONE_ATTR, stickyDecls, новый buildLayoutCss),
`composables/layout/registry.ts` (док-коммент про live-геттеры),
`composables/useLayout.ts`, 9 компонентов + docs/DocsSidebar, `docs/layout.md` (§1, §2).

## Гейты

vitest 53/53 (было 48: +5 юнитов buildLayoutCss — fixed top/bottom, sticky side,
sizeless degrade, bounded display:none); eslint 0 errors (16 pre-existing warnings);
stylelint — те же 7 pre-existing (app-bar ×4, demo/youtube ×2, list/item ×1).

## Проверка владельцем (без JS / view-source)

- `/demo/wf/*`: в SSR-HTML `<style id="m-layout-…">` должен содержать
  `[data-m3-zone]`-правила; header прибит при отключённом JS.
- aside на мобильном теперь скрывается движком (`display: none`) — в docs это
  временно «прячет» сайдбар на мобильном до Phase mobile-sidebar (раньше он
  ломал сетку implicit-треком).
