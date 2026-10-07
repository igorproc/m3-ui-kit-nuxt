# Containment: реализация M3-планов (2026-10-07)

Реализованы планы `.cursor/plans/feature/components-should-update/containment/*` — card, divider,
expansion-panel, list, list-subheader. Работу вели три агента Opus в одном рабочем дереве с
непересекающимися файлами (A — список, подпись, разделитель и цвет выбора в dropdown; B — карточка;
C — панели). Playwright запускал только оркестратор; правки на стыках сделаны им же.

## Решения владельца

| Тема | Решение |
|---|---|
| Card: интерактивность | `tag="link"` делает корнем всю карточку (`NuxtLink`/`<a>`); кнопки и растянутой ссылки нет |
| Card: `#actions` в ссылке | рендерится как есть, в dev — предупреждение |
| Card: имя ссылки | заголовок (`aria-labelledby`), без заголовка — содержимое |
| Заголовок (card + panel) | `headingLevel` без дефолта, общий тип `MHeadingLevel` |
| `loading` (list item + panel) | снят, предупреждение на релиз |
| Группа панелей | ритм segmented: зазор 2, внешние углы 12, внутренние 4 |
| Панель: смена `value` / переход в exclusive | как было: закрывается; остаётся первая открытая |
| Панель: закрытый `mandatory`-заголовок | без hover/pressed, обычный курсор |
| List: выбор | `secondary-container` (dropdown и autocomplete следом) |
| List: геометрия | Expressive, иконки 24: зазор 0, угол 4, выбранная 16 статично, gap 12, отступы 10 |
| List: семантика | `ul`/`li`; с `role` от потребителя — `div`, как раньше |
| List: «выбрано» | по элементу: ссылка `aria-current`, кнопка `aria-pressed` |
| List: текст | `lines="auto"` переносит, число — clamp, полный текст в `title` |
| List: строка-кнопка | всегда `type="button"`; submit — `MButton` в слоте |
| Subheader: тег | внутри `ul` — обычный `li` без роли (axe отвергает `role="presentation"`); вне списка — `div` |
| Subheader: заливка sticky | проп `surface` у `MList` только объявляет фон |
| Divider: `inset` | `'start' \| 'center' \| 'end'` (M3 middle → `center`), `true` = `start` на релиз |
| Divider: семантика | по контексту списка: в `MList` — `li aria-hidden`, вне — `div role="separator"` |

## Что изменено

- **Card**: `card/{index.vue,props.ts}`, `_states.scss` (состояния ссылки), `useCardWarnings.ts`;
  поведение — `composables/card/useCard.ts`. Статичная карточка без hover; у ссылки — слой
  8/10/12, тени по токенам, кольцо, disabled по вариантам; `mediaAspectRatio`, дефекты CT/IN/RS/LY/TK.
- **Expansion panel**: `expansion-panel/{index.vue,props.ts,heading.ts}`, `expansion-panels/*`,
  `composables/expansion-panel/{useExpansionPanelControl.ts,useExpansionPanelGroup.ts}`. `inert`
  у свёрнутого, слой `::before`, `focus-ring(inset)`, атрибуты на кнопку, реактивные `multiple`/`value`,
  `#trailing`, segmented-группа.
- **List**: `list/{index.vue,context.ts,types.ts}`, `item/{index.vue,props.ts,ListRow.ts}`,
  `item/_states.scss`, `subheader/*`; поведение — `composables/list/useListItemControl.ts`.
- **Divider**: `divider/{index.vue,props.ts}`, токены.
- **Dropdown/autocomplete**: `dropdown/_index.scss` (цвет выбора), `dropdown/_panel.scss` (у опций
  выключен собственный слой строки — активный фон уже идёт за указателем).
- **Общее**: `shared/types/props.ts` — `MHeadingLevel`.
- Фикстуры и e2e: `playground/fixtures/{card,divider,expansion-panel,list}/*`.
- `docs/system/*/decisions.md`: не вводимые паттерны (segmented-список, reorder, swipe, expandable;
  карточка-кнопка) и компромиссы (подпись — `li`, `ul` без `role="list"`, `inert` у панели).

## Ломающие изменения

| Компонент | Было | Стало | Миграция |
|---|---|---|---|
| `MCard` | `variant` = `MVariant` | `elevated \| filled \| outlined` | `tonal`/`text` на релиз рисуются как `filled`/`outlined` с предупреждением |
| `MCard` | hover у всех карточек | только у `tag="link"` | кликабельную карточку перевести на `tag="link"` + `to` |
| `MList` | `div` | `ul` (`div` при `role`) | селекторы по `div` и по корню строки проверить; строки, подписи, разделители — прямые дети |
| `MListItem` | `loading`; `selected` по умолчанию `false` | без `loading`; `selected` по умолчанию `undefined` | `loading` на релиз с предупреждением |
| `MListItem` | отключённая ссылка с `href` | без `href`, `aria-disabled` | — |
| `MDivider` | `inset: boolean`, класс `--inset` | `inset: 'start' \| 'center' \| 'end'`, классы `--inset-*` | `true` → `'start'` на релиз |
| `MExpansionPanel` | `loading`; атрибуты на корне | без `loading`; всё, кроме `class`/`style`, на кнопке | `loading` на релиз с предупреждением |
| `MExpansionPanels` | панели вплотную | зазор 2, углы 12/4 | — (видимое изменение) |
| Токены | ключи карт card, list item, expansion panel, divider | переименованы на точечные пути | только для тех, кто читает карты напрямую |

Видимые изменения: выбор в списке, дропдауне и автокомплите — `secondary-container`; строки
вплотную, углы 4/16; подпись секции считается скринридером элементом списка.

## Проверка

- `npx vitest run` — 1356, один тест `overlay` упал под нагрузкой полного прогона и проходит отдельно
  (17/17; overlay не менялся, раньше так же вёл себя `useModal`).
- `npx playwright test` — 323 / 323; после последней правки фокуса панели — `expansion-panel` 23 / 23.
- lint, stylelint, lint:scss, typecheck — без ошибок вне `playground/render/**`.
- Аудит: `card` P1 2, `list` 3, `divider` 2, `expansion-panel` 2, `expansion-panels` 0 — остались
  принятые отклонения (vw-корень, TK-03, документация) и открытые CT-08 (виртуализация — план
  virtual-scroll), CT-09 (заглушка изображения в строке).

## Хвосты и риски

- Репозиторий `docs` не обновлялся: `MixContent.vue` передаёт панели несуществующий `subtitle`
  (надо `description`), `MixAdvanced.vue` — несуществующий слот `#title` и `MSwitch` в заголовке,
  `DocsHeader.vue` — несуществующий `vertical` у `m-divider`; страницы и `server/data/en/*.json`
  card, list, expansion-panel устарели.
- Отключённая строка списка больше не приглушает контролы в слоте — их отключает потребитель.
- Safari VoiceOver может не объявлять `ul` без `role="list"` при `list-style: none` (decisions.md).
- Временные доски `playground/render/**` (вне git) используют снятые варианты и не проходят typecheck.
