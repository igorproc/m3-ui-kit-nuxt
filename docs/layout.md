# Auto-Layout: carving-движок и колоночная система

Система автолейаута PrimeTime UI Kit раскладывает каркас приложения (app bars, rails,
footers, контент) **генерируемым CSS-гридом** и даёт M3-колоночную сетку для контента.
Принципы: SSR-first (без измерений и ResizeObserver), ноль CLS (вся геометрия — CSS,
применяется до первой отрисовки), Vuetify-подобная эргономика (без ручных `order`).

План и история решений: `.cursor/plans/auto-layout.md`, саммари фаз A–E в `.cursor/summary/`.

---

## 1. Движок: выкраивание (carving)

`<m-layout>` — грид-корень. Компоненты лейаута регистрируются **только будучи прямыми
детьми** `m-layout` (проверка идёт по дереву инстансов: `instance.parent` сверяется с
владельцем контекста — provide сквозь обёртки «не считается»).

**Порядок в DOM = приоритет выкраивания.** Реестр обходится по порядку, каждый элемент
отрезает полосу от оставшегося прямоугольника: `top`/`bottom` — строку на всю оставшуюся
ширину, `start`/`end` — колонку на всю оставшуюся высоту. Кто раньше в DOM — тот владеет
углом (семантика Vuetify):

```vue
<m-layout full-height>          <!-- steam-шелл -->
  <m-system-bar />              <!-- строка 1, на всю ширину -->
  <m-app-bar title="Store" />   <!-- строка 2, на всю ширину -->
  <m-layout-footer sticky size-token="44rem" /> <!-- последняя строка, на всю ширину -->
  <m-layout-aside sticky size-token="256rem" /> <!-- колонка МЕЖДУ барами и футером -->
  <m-layout-main>…</m-layout-main>
</m-layout>
```

Из реестра генерируются `grid-template-areas/columns/rows` для трёх диапазонов устройств
(моб. <768 / планшет 768–1199 / десктоп ≥1200 — границы из `materialKit.breakpoints`) и
инжектятся через `useHead` scoped-стилем на `#<layoutId>`. SSR отдаёт готовую сетку,
браузер выбирает диапазон по `@media` без JS. Имена grid-area = id элементов.

Дефолт по диапазонам: на мобильном боковые зоны не попадают в сетку, на планшете — без
`end`-стороны.

- `full-height` — `height: 100dvh; overflow: hidden`: страница не скроллится, скроллится
  `m-layout-main` (Discord/Steam-шеллы).
- **Первый уровень — только регистрируемые компоненты.** Посторонний элемент станет
  implicit-треком и сломает сетку (dev-warning подскажет обернуть в `m-layout-main` /
  `m-layout-item`).
- Late-mount (`v-if` после гидрации) досортировывается по реальной DOM-позиции.

### Зоны (мульти-инстанс, авто-id)

| Компонент | kind | Пропсы | Дефолт sticky |
| :--- | :--- | :--- | :--- |
| `m-layout-header` | top | `sticky`, `sizeToken` | **true** |
| `m-layout-footer` | bottom | `sticky`, `sizeToken` | false |
| `m-layout-aside` | start/end | `position` (`start|end`, legacy `left|right`), `sticky`, `sizeToken` | false |
| `m-layout-main` | main | — | — |
| `m-layout-item` | любой | `kind`, `id?`, `sizeToken`, `sticky`, `force` | false |

Зон одного края может быть сколько угодно — каждая получает свою строку/колонку.
`sizeToken` принимает имя CSS-переменной (`--ui-app-bar-height-small`) **или сырой
размер** (`44rem`). `force` на `m-layout-item` — escape-hatch для регистрации из-под
renderless-обёрток (`Transition` и т.п.), разрывающих цепочку родительства.

### Самодостаточные компоненты

`m-app-bar`, `m-system-bar`, `m-navigation-rail`, `m-navigation-bar` прямыми детьми
`m-layout` регистрируются сами (зоны-обёртки не нужны). **Внутри зоны** те же компоненты
вместо регистрации **отдают свой размер зоне**: зона без явного `sizeToken` суммирует
вклады детей (`m-system-bar` + `m-app-bar` в одном `m-layout-header` → высота строки =
сумма). Раскрытие рельсы меняет её токен → грид анимируется (`transition:
grid-template-*`).

`m-navigation-drawer` (временный, v-model) — модальный оверлей, **не единица лейаута**.

---

## 2. Sticky-механика

Ключевой факт CSS: containing block грид-итема — его собственная grid area, поэтому
`position: sticky` в строке точной высоты двигаться не может. Отсюда два разных механизма:

- **top/bottom + `sticky`** → `position: fixed`, а строка грида **резервирует место**
  через size-переменную: ноль CLS, контент не прыгает. Поэтому sticky-зона верха/низа
  **обязана иметь размер** (явный токен или вклад ребёнка) — безразмерная деградирует в
  поток с dev-warning.
- **start/end + `sticky`** → настоящий `position: sticky` (колонка-area высокая):
  `align-self: start; inset-block-start: var(--m3-layout-<id>-top);
  height: calc(100dvh − top − bottom-sticky)`. Не-sticky футер в вычитание не входит
  (иначе дырка, пока он за экраном).

Оффсеты считаются **per-item** из carving: каждый элемент знает, какие полосы выкроены
до него. Второй sticky-header автоматически получает `top` = высота первого; бар,
выкроенный после боковой колонки, получает `inset-inline-start` = её ширина. Все
свойства — логические (RTL-ready).

Ограничения: fixed-координаты предполагают, что лейаут начинается от верха viewport
(стандартный app-shell); `.m-layout` использует `contain: style` (не `layout` — он
ломает fixed-потомков).

---

## 3. Контекстная зона (`useLayoutZone`)

Любой потомок `m-layout` может получить rich-контекст (`null` вне лейаута, без throw):

```ts
const zone = useLayoutZone()
// zone.layoutId               — id корня
// zone.items                  — реестр зон (read-only, DOM-порядок)
// zone.insets.top|right|bottom|left — CSS-выражения суммарных краёв
// zone.windowY                — скролл активного скроллера (документ ИЛИ main в full-height)
// zone.scrollLock(true|false) — реф-счётный лок скролла
// zone.sticky.top|bottom      — готовые offset'ы для position: sticky
```

`windowY` слушает и `window`, и `m-layout-main` (события шлёт только реально скроллящийся
— режим различать не нужно); один пассивный слушатель на лейаут. `m-app-bar` поднимает
elevation именно через него (`isScrolled`-проп — deprecated принудительный override).

### CSS-переменные (на `#<layoutId>`, per-range)

| Переменная | Что это |
| :--- | :--- |
| `--m3-layout-<id>-size` | размер зоны (трек грида) |
| `--m3-layout-<id>-top` / `-bottom-sticky` | per-item вертикальные оффсеты |
| `--m3-layout-<id>-start` / `-end` | per-item горизонтальные оффсеты |
| `--m3-layout-inset-top/right/bottom/left` | суммарные края лейаута (FAB, snackbar, sticky-контент) |

---

## 4. Колоночная система: m-container / m-row / m-col

SCSS-first: вся адаптивность — статически сгенерированные `@media`-классы из
`$material-kit-breakpoints` (px-пороги; rem в медиа резолвится от initial 16px и с
fluid-скейлом «1rem = 1px» поплыл бы). JS только мапит пропсы в классы. Ноль CLS.

### m-container

M3 layout grid: **4 колонки (<768) / 8 (≥768) / 12 (≥1200)**, гаттеры и маржины
16rem → 24rem, ступенчатый `max-width` (1200rem/1600rem; `fluid` снимает).
Переопределение: `:cols="2"`, `:cols-tablet-xs`, `:cols-tablet`, `:cols-desktop-xs`,
`:cols-desktop`.

### m-col

Спан **относителен активному числу колонок**: `cols="2"` на мобильном (4 колонки) —
половина, на десктопе (12) — шестая часть. Спан клампится числом колонок (`span min()`),
без пропов колонка занимает всю строку.

```vue
<m-container>
  <m-col desktop-xs="2">aside</m-col>   <!-- мобайл: вся строка; ≥1200: 2 из 12 -->
  <m-col desktop-xs="8">main</m-col>
  <m-col desktop-xs="2">aside</m-col>
</m-container>
```

Пропсы: `cols` (база, mobile-first) + `mobile`, `tablet-xs`, `tablet`, `desktop-xs`,
`desktop`; `offset`, `offset-<bp>` — через `grid-column-start`, `offset-<bp>="0"`
сбрасывает на авто-поток.

**Семантика ключей** (mobile-first, активация с `min-width` = константе кита):

| Ключ | min-width | Колонок по умолчанию |
| :--- | :--- | :--- |
| `mobile-xs` | 0 | 4 |
| `mobile` | 767px | 4 |
| `tablet-xs` | 768px | 8 |
| `tablet` | 1199px | 8 |
| `desktop-xs` | 1200px | 12 |
| `desktop` | 1920px | 12 |

⚠ Для «планшетного» поведения используйте `tablet-xs` (≥768): `tablet` активируется с
1199px — это согласовано с существующими SCSS-миксинами (`bp-tablet`) кита.

### m-row (опционально) и утилиты

`m-row` — семантическая строка на `subgrid`: форсит перенос (`grid-column: 1/-1`),
наследует линии колонок, gap задаётся явно из `--m-container-gutter` (строчная ось
subgrid'ом не покрывается). Пропсы: `align="start|center|end|stretch"`, `no-gutters`.

`<m-spacer>` — flex-распорка. `<m-responsive aspect-ratio="16 / 9">` — обёртка с
фиксированными пропорциями (контент — `position: absolute; inset: 0`).

---

## 5. Правила и анти-паттерны

1. **Не верстайте бары руками**: никаких собственных `position: fixed/sticky` для
   шапок/сайдбаров — это делают зоны (`sticky`-пропсы) с корректными per-item оффсетами.
2. Sticky top/bottom без размера не работает (см. §2) — дайте `sizeToken` или положите
   внутрь компонент с высотным токеном.
3. Прямыми детьми `m-layout` могут быть только регистрируемые компоненты.
4. Кастомные размеры зон — токенами/выражениями, не измерениями.
5. Песочницы: `/demo/grid` (сетка), `/demo/wf/*` (9 wireframes на движке),
   `/demo/material|steam|youtube|primetime` (зоны-обёртки).
