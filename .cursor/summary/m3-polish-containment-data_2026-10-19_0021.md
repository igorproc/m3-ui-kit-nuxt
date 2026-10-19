# M3-polish: containment и data (w2) — 2026-10-19

Группа: MList (+MListItem, MListSubheader), MDivider, MExpansionPanel(s), MCard, MTable, MTimeline(Item), MAvatar.
Аудит — `.cursor/handoff/m3-polish/audit/containment-data.md` (P1, пробы `w2-containment-data-001…009`).

## Решения (оркестратор по рекомендациям аудита, 2026-10-18)

Q-1 слот `#trailing-supporting` (старое имя удалено) · Q-2 заголовок в exclusive-группе едет внутри группы — оставить,
закрыть e2e · Q-3 углы панели статичны · Q-4 тон панелей прежний, группу ставить на контейнер · Q-5 слот `#title` у
карточки · Q-6 hover строк таблицы только у интерактивных · Q-7 ошибка важнее `statusText` · Q-8 подвал пред/след + RTL ·
Q-9 липкой шапки нет · Q-10 `#icon` удалён · Q-11 порог `alternate` в rem · Q-12 одно поведение отключённой ссылки —
общий хелпер `utils/link`. Шимы снятых значений удалены без алиасов (решение владельца 2026-10-18).

## Что сделано

**MExpansionPanels / MExpansionPanel**
- E-1: группа применяет модель синхронно при регистрации панели (`expansion-panels/index.vue`, `register`) — предустановленная
  панель открыта в SSR и в первом кадре; перехода высоты и сдвига страницы после гидрации больше нет (было: +144rem сдвиг за
  300 мс после `data-fixture-ready`). Watch модели остался для изменений после монтирования, без `immediate`.
- Контекст группы — `components/ui/expansion-panels/context.ts` (вне автоимпорта), `PanelValue` — `expansion-panel/props.ts`;
  `composables/expansion-panel/useExpansionPanelGroup.ts` удалён (импорты переключены до удаления).
- Углы сегментов — модификатор `ui-expansion-panel--grouped` в SFC панели (композабл отдаёт `isGrouped`), без `>`.
- `defineSlots` (`MExpansionPanelSlots`), JSDoc `title`/`description`, висячий JSDoc убран, снят `loading`.

**MList / MListItem / MListSubheader / MDivider**
- `MAvatar` в `#leading` держит свои `density` и `shape` (строка больше не размеряет `.ui-avatar` и картинку аватара);
  `img`/`video` слота — `:where(img:not(.ui-avatar__image))`, `:where(video)`; ключ `leading.avatar` удалён.
- Слот `#trailing-supporting` (Q-1); `tag: MListItemTag` с подсказками; `defineSlots` у строки и подписи; `tabular-nums`
  у числа справа; снят `loading`.
- `useListItemControl` и `useCard` — на общем хелпере `src/runtime/utils/link/index.ts` (`NuxtLink`, `linkTag`,
  `linkAttrs`, `withoutDestination`) + спека. Путь и сигнатура переданы оркестратору для `useButton` (w1).
- MDivider: `inset` только `'start' | 'center' | 'end'`, снято `true` и его предупреждение.

**MTable**
- T-1: индикатор обновления при `caption` — модификатор `ui-table-container--captioned` и один `translate` на строку
  подписи (`busy.caption` в карте); без caption — как было.
- T-2: шевроны подвала `ui-table__page-icon:dir(rtl) { scale: -1 1 }`.
- T-3: кольцо фокуса области прокрутки — на рамке (`:has(> …__viewport:focus-visible)`), у вьюпорта `outline: none`.
- Q-6: hover-слой строк только у `ui-table--interactive` (`selectable` или объявленный `onRowClick`).
- Q-7: живой регион — `error` (строкой) раньше `statusText`.
- Область прокрутки называется и через `aria-labelledby` (`useTableControl` опция `labelledBy`).
- Стрелка размера страницы гаснет вместе с отключённым `select`.
- `TableData` без индекс-сигнатуры; `defineSlots` (`MTableSlots`, `MTableCellSlot`); высоты по плотности — в одном файле
  (`table/index.vue`); `material-map` убран (4 вызова).

**MCard**
- Hairline `max(1px, 1rem)`; слот `#title` (Q-5); `defineSlots` (`MCardSlots`); снят `variant="tonal|text"`; поля медиа —
  `media.margin` в карте; `:where(img, video)`; мёртвые `box-shadow`/`disabled.elevation` у disabled убраны; `material-map`.

**MTimeline / MTimelineItem**
- TL-1: `ui-timeline-item--untitled` — точка, время и концы рейки на центре первой строки тела (`first-line.{titled,untitled}`
  в карте, функция `-first-line()`).
- Q-11: порог `alternate` — `768rem` (из `tablet-xs`, без литерала); rem в container query считается от корня — проверено e2e
  на 780/1280/1920.
- Q-10: слот `#icon` удалён; `defineSlots` (`MTimelineItemSlots`).
- Контекст — `components/ui/timeline/context.ts` на `createContext('m3:timeline')`, типы осей — в `ui/timeline/props.ts`;
  `composables/timeline/context.ts` удалён. Оси ленты — модификаторы элемента (`--density-*`, `--line-*`, `--alternate`);
  `>` остался только в детекторе колонки времени (`:has(> …)`, с комментарием «почему»). Мёртвый ключ `line.gap` убран.

**MAvatar** — снят `size` (+ `AVATAR_SIZE_TO_DENSITY`), `material-map` убран.

## Закрытые пункты аудита

PNL-B1, PNL-C1, PNL-D1–D3; LST-A1, LST-A2, LST-C1–C3, LST-D1, LST-D2; DIV-D1; TBL-A1–A3, TBL-B1–B4, TBL-C1, TBL-C2,
TBL-D1, TBL-D2; CRD-A1, CRD-C1, CRD-C2, CRD-D1–D5; TML-A1, TML-B1, TML-C1, TML-D1–D3; AVT-D1, AVT-D2.
Без изменений по решению: PNL-B2 (Q-2, есть e2e), PNL-B3 (Q-3), PNL-A1 (Q-4, фикстура на контейнере), TBL-C4 (Q-8),
TBL-C5 (Q-9), LST-B1 (статичный угол, есть e2e). Заявка: TBL-C3 (`package.json` exports).

## Тесты и гейты

- Vitest (группа, 21 файл): 247 passed. Новые: SSR-рендер открытой панели (`expansion-panels/index.spec.ts`), `#trailing-supporting`,
  `#title`, `--captioned`, `--interactive`, ошибка важнее `statusText`, иконки подвала, `aria-labelledby` области прокрутки
  (`useTableControl.spec.ts`), модификаторы ленты и `--untitled`, `#dot` без `#icon`, `utils/link/index.spec.ts`.
- `npx eslint` / `npx stylelint` по путям группы — exit 0. `npm run lint:scss` — 154 стиля, без deprecations (на момент
  финала; по ходу падали `text-field`/`textarea` — не мои). `npm run typecheck` — 53 ошибки, все в `playground/render/**`.
- e2e у дирижёра: 010 (панели, E-1 проба — открыто в SSR, сдвигов 0), 011 (список/разделитель/карточка зелёные;
  autocomplete падал от `vite-error-overlay` чужой правки), 012 (140 тестов: 138 + 2 упавших → исправлено), 013 (таблица
  + панели, 51 passed). Новые e2e: E-1 (SSR + нет layout-shift), Q-2 (вне группы ничего не двигается), L-1, L-2, T-1, T-2,
  T-3 (кольцо на рамке), Q-6, Q-11 (780/1280/1920), TL-1.

## Проверено скриншотами / не проверено

Проверено (дирижёр, PNG прочитаны): индикатор под caption, RTL-шевроны, целое кольцо области прокрутки, аватары 24/40/56 со
скруглением large в строке, точка без заголовка на строке тела, alternate на окне 780, панели на контейнере.
Не проверено: Safari/Firefox (`:dir()`, `:has()`, hairline), скринридеры, dark-тема новых случаев таблицы и ленты.

## Ломающие изменения и миграция

| Было | Стало |
|---|---|
| `<MListItem>` `#trailingSupporting` | `#trailing-supporting` |
| `<MListItem loading>`, `<MExpansionPanel loading>` | пропа нет (прогресс — в `#trailing`) |
| `<MDivider inset>` / `:inset="true"` | `inset="start"` |
| `<MCard variant="tonal">` / `"text"` | `variant="filled"` / `"outlined"` |
| `<MAvatar size="sm|md|lg">` | `density="compact|default|comfortable"` |
| `<MTimelineItem>` `#icon` | `#dot` |
| импорт `#kit/composables/expansion-panel/useExpansionPanelGroup` (`PanelValue`) | `#kit/components/ui/expansion-panel/props` |
| импорт `#kit/composables/timeline/context` (типы осей) | `#kit/components/ui/timeline/props` |
| автоимпорт `useExpansionPanelGroupContext`, `useTimelineContext` и др. | не автоимпортируются (внутреннее) |
| строки таблицы без `selectable`/`row-click` подсвечивались при наведении | не подсвечиваются |
| `alternate` ленты схлопывался по 768 CSS px | по 768rem |

## Открытые вопросы и заявки

- `package.json` `exports` для типов таблицы (оркестратор).
- `typescale()` без `letter-spacing` против `apply-typography()` (оркестратор/владелец типографики).
- MIcon: иконки грузятся на клиенте — load-сдвиги в baseline (`table/matrix`, `list/stress`); зеркалирование направленных иконок
  кит-широко (чинил только подвал таблицы).
- `useButton` (w1) — перевести на `utils/link` (Q-12), путь и сигнатура отправлены.
- `playground/render/gallery/divider.vue` пишет `<MDivider inset />` — после снятия `true` линия там во всю длину (не мой файл).

## Риски и долги

- Сдвиг индикатора под caption рассчитан на одну строку подписи; многострочная подпись — индикатор окажется выше на строку.
- `>` оставлен с обоснованием: `list/index.vue` (липкая подпись вложенного списка), рамка таблицы `:has(> viewport)`,
  hover строк `row:hover > cell`, детектор колонки времени ленты.
- `onRowClick` объявлен пропом ради детекта слушателя — если Vue начнёт предупреждать о совпадении с emits, нужен другой
  способ.

## Выходной CSS (Sass compressed, мой замер HEAD → рабочее дерево; официальный — финальный прогон оркестратора)

| Компонент | было байт / gzip | стало | за счёт чего |
|---|---|---|---|
| card | 4238 / 989 | 4122 / 993 | −`box-shadow` disabled, `:where()` |
| divider | 720 / 255 | 720 / 255 | — |
| expansion-panel(+s) | 5156 / 1138 | 5120 / 1133 | `--grouped` вместо `>` |
| list + item + subheader | 7695 / 1458 | 7666 / 1469 | −правило `.ui-avatar`, +`tabular-nums` |
| avatar | 2172 / 572 | 2172 / 572 | — |
| table (+fragments) | 8670 / 1844 | ≈9050 / ≈1900 | +caption-сдвиг, +RTL-шевроны, +disabled-стрелка, кольцо на рамке |
| timeline (+item, divider) | 6656 / 1231 | 7518 / 1284 | +ветка `--untitled` (TL-1) |

Рост таблицы и ленты — цена исправленных дефектов (T-1/T-2/T-3, TL-1); минимизации за счёт поведения не делал.
`src` группы: 46 файлов, +604 / −513 (включая спеки и новые тесты) + 232 строки новых файлов (два контекста переехали, `utils/link`).

## Modern Web Guidance

- `animate-to-intrinsic-sizes` — `interpolate-size`/`calc-size()` только в Chromium: высота панели осталась на
  `grid-template-rows 0fr → 1fr`; E-1 починен порядком применения модели, не сменой механики.
- `soft-edge-content-fade` — маска гасит и outline самого элемента → кольцо области прокрутки перенесено на рамку вне маски.
- `size-aware-styling` — container query по `inline-size` (уже был); порог в rem, т. к. rem в container query берётся от
  корня, а корень кита масштабируется окном.
- `scrollability-affordance-hints`, `responsive-table`, `state-aware-sticky-headers` — подтвердили цену липкой шапки
  (Q-9: нужен вертикальный контейнер прокрутки); затухание с двух сторон — в предложениях.
- `search-hidden-content` — `hidden="until-found"` для свёрнутых панелей остаётся предложением.
- Поиск «mirror directional icons in RTL» гайда не нашёл: шевроны — `:dir(rtl)` + `scale`, как уже делает затухание таблицы.

## Коммиты (предложение, коммитит владелец)

- `fix(expansion-panels): a preset model renders its panel open on the server, with no transition after hydration`
- `refactor(expansion-panels)!: group context leaves auto-imports; grouped corners are a panel modifier` + BREAKING CHANGE: импорт `PanelValue`, без `loading`
- `fix(list-item): an avatar in the leading slot keeps its own density and shape`
- `feat(list-item)!: the trailing supporting slot is #trailing-supporting` + BREAKING CHANGE: `#trailingSupporting`, `loading`
- `refactor(card, list-item): one disabled-link behaviour from utils/link`
- `feat(card)!: #title slot fills the title and keeps the card named; hairline outline` + BREAKING CHANGE: `tonal/text`
- `fix(table): the refresh indicator clears the caption; footer chevrons follow RTL; the scroll region ring is whole`
- `fix(table)!: only interactive rows show a hover layer; an error is announced over statusText` + BREAKING CHANGE: hover
- `fix(timeline): the dot sits on the first line of an item without a title`
- `fix(timeline)!: alternate collapses below 768rem; #icon removed; context leaves auto-imports` + BREAKING CHANGE
- `refactor(divider, avatar)!: retired inset true and size removed`
