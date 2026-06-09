# План: Auto-Layout — m-layout v2 + m-container / m-row / m-col

> Статус: согласование. Дата: 2026-06-10.
> Предыдущий план (`plans/layout.md`, гибрид C) удалён; его уроки учтены в разделе «Уроки прошлой итерации».

---

## 0. Зафиксированные решения (ответы владельца)

| # | Вопрос | Решение |
|---|--------|---------|
| A1 | Брейкпоинты | Оставляем текущие 6 ключей (`mobile-xs…desktop`), семантика M3 внутри |
| A2 | Колонки | Mobile-first; `span`/`offset` считаются **относительно актуального числа колонок** брейкпоинта |
| A3 | Запросы для сетки | ~~Container queries~~ → **viewport media queries** (пересмотрено владельцем 2026-06-10 после px/fluid-rem нюанса) |
| B1 | Движок | **Генерируемый `useHead`-грид остаётся**, API должен быть гибким (никаких фикс-слотов) |
| B2 | Очерёдность/углы | **Vuetify-like: порядок в DOM**, без ручных `order`. Компоненты сами понимают, что родитель — `m-layout`, и регистрируются |
| B3 | layoutContextZone | Обязательно: `scrollLock`, `windowY`, `sticky`, `layoutId` |
| B4 | Top-level | На первом уровне `m-layout` — только регистрируемые компоненты (см. §2.4) |
| C1 | m-row | Опционален |
| C2 | Пропсы колонок | Vuetify-like (плоские атрибуты) |
| D1 | Breaking changes | Разрешены, «на это и расчёт»; `docs/layout.md` переписать |
| D2 | Недостающие компоненты | Создавать по m3-reference / m3-like |

## 1. Уроки прошлой итерации (из отменённого редизайна 2026-06-06)

- **Не сносить grid-ядро ради краевого кейса.** Попытка absolute/order-offset движка дала больше
  main-thread работы и была откачена. Grid — база, движемся аддитивно.
- **SSR-first, без измерений.** Размеры — только известные токены (CSS vars); никаких
  ResizeObserver/CSR-расчётов. `useHead` со `computed` отрабатывает после setup всех детей → SSR
  отдаёт готовый грид, CLS = 0.
- **Скролл**: в обычном режиме скроллит документ (`window`), не `main`. В `full-height` — скроллит
  `m-layout-main`. Контекст должен абстрагировать «активный скроллер».
- **`m-navigation-drawer` (временный) — НЕ единица лейаута**: остаётся vue-final-modal поверх,
  в реестр не входит.
- Дев-сервер сам не поднимаем; визуальная верификация — по запросу скриншотов у владельца.

---

## 2. Архитектура движка (m-layout v2)

### 2.1 Реестр в DOM-порядке (Vuetify-like carving)

`LayoutItem` v2:

```ts
interface LayoutItem {
  id: string                 // авто: `${kind}-${useId()}`
  kind: 'top' | 'bottom' | 'start' | 'end' | 'main'
  sizeToken?: string         // CSS var с размером (высота для top/bottom, ширина для start/end)
  el?: Ref<HTMLElement | null> // для до-сортировки late-mount на клиенте
}
```

- **Порядок = порядок регистрации** (setup-порядок = DOM-порядок при SSR и гидрации).
- **Late mount (`v-if` после маунта)**: вставка в правильную позицию через
  `el.compareDocumentPosition()` относительно уже зарегистрированных. Ленивая до-сортировка только
  в момент вставки, не на каждый тик.
- `order`-проп **удаляется** из публичного API (Vuetify не заставляет писать ордера — мы тоже).

### 2.2 Алгоритм «выкраивания» (carving) → grid-template

Заменяет текущий `getUniqueAreas` + три захардкоженных computed. Обходим реестр в DOM-порядке,
каждый элемент отрезает полосу от оставшегося прямоугольника:

- `top` → полоса сверху оставшейся области (на всю её текущую ширину);
- `start`/`end` → колонка слева/справа от оставшейся области (на всю её текущую высоту);
- `bottom` → полоса снизу; `main` → всё что осталось.

Из этого детерминированно генерируются `grid-template-areas/columns/rows`. Это даёт ровно
Vuetify-семантику: кто раньше в DOM — тот владеет углом. Пример (steam), порядок DOM
`system-bar(top), app-bar(top), footer(bottom), drawer(start)`:

```
"sb   sb"
"ab   ab"
"nav  main"
"foot foot"   ← footer в DOM раньше drawer'а → берёт всю ширину, drawer зажат между ab и footer
```

В `full-height`-режиме высота drawer'а (`100dvh − sb − ab − foot`) получается силами самого
грида. **В режиме скролла документа — нет**: main-трек растёт вместе с контентом, и aside по
умолчанию растянется на всю высоту контента. Прижатие к viewport — `sticky`-режим зоны на
per-item insets (§2.6).

- Размер трека: `var(--m3-layout-<id>-height|width, auto)`; без `sizeToken` — `auto`.
- Брейкпоинт-диапазоны **читаются из `$material-kit-breakpoints`/runtime-конфига** (хардкод
  768/1199/1200 удаляется). Движок строит грид для 3 диапазонов устройства
  (mobile ≤767 / tablet 768–1199 / desktop ≥1200), производных от 6 ключей.
- Поведенческий дефолт по диапазонам сохраняем (mobile: start/end-зоны не в гриде; tablet: без
  end) — с заделом на проп видимости у зон в будущем.
- `useHead` остаётся: `computed`-стиль на `#layoutId` (реактивен на клиенте, SSR — после setup
  всех детей, т.е. полный реестр уже известен).

### 2.3 Ленивое определение «первого уровня»: parent-component check

⚠ Контекст-страж отклонён на ревью (2026-06-10): provide уходит вглубь сквозь любую обёртку,
которая сама не зона — `<m-layout><div><m-app-bar/></div></m-layout>` дал бы ложную регистрацию
с глубины. Вместо этого — **прямая проверка родителя-компонента**:

- Контекст `m3:layout` несёт `uid` инстанса `m-layout` (владельца).
- При регистрации компонент сверяет `getCurrentInstance().parent` с владельцем контекста:
  родитель — этот `m-layout` → регистрируемся; иначе — обычный рендер. Slot-контент в runtime-дереве
  имеет `parent === m-layout`, так что авторская вложенность через `<slot/>` работает.
- Страж-контекст не нужен вовсе: `m-app-bar` внутри `m-layout-header` не регистрируется сам
  (его parent — header), регистрируется header; `sizeToken` app-bar'а header берёт через
  существующий механизм слияния.
- SSR-safe: проверка по дереву инстансов на setup, без DOM.

Осознанные ограничения (документируем):
- DOM-обёртка (`<div>` — не компонент) невидима для parent-check: app-bar внутри неё сочтёт
  себя первым уровнем. Но сам `<div>` на первом уровне грида поймает top-level dev-warning
  (§2.4) — кейс диагностируется.
- Renderless-обёртки (`Transition`, кастомные) разрывают цепочку родительства → компонент внутри
  них не само-регистрируется; решение — явная зона-обёртка (`m-layout-item`).

### 2.4 Правило top-level (ответ на встречный вопрос)

**Да** — прямыми детьми `m-layout` могут быть только layout-aware компоненты. Произвольный
элемент в гриде создал бы implicit-треки и сломал раскладку. Enforcement мягкий:

- dev-warning «незарегистрированный элемент на первом уровне `m-layout` — оберни в
  `m-layout-main` / `m-layout-item`»;
- escape-hatch — `<m-layout-item kind="...">` для кастомных зон.

### 2.5 `layoutContextZone` (rich-контекст, `m3:layout-context`)

Провайдится из `m-layout`, доступен любому потомку (`null` вне лейаута → no-op):

```ts
interface LayoutContextZone {
  layoutId: string
  items: Readonly<Map<string, LayoutItem>>       // реестр (read-only)
  insets: ComputedRef<{ top, right, bottom, left }>  // суммы зон, и как CSS vars:
  //   --m3-layout-inset-top/right/bottom/left = calc(сумма sizeToken'ов края)
  //   для sticky-контента, FAB, snackbar — то самое «100dvh - header1 - header2»
  windowY: Readonly<Ref<number>>                  // скролл АКТИВНОГО скроллера
  scrollTarget: ComputedRef<Window | HTMLElement> // window | m-layout-main (full-height)
  scrollLock: (lock: boolean) => void             // ref-counted, через useStack-паттерн
  sticky: { top: ComputedRef<string>, bottom: ComputedRef<string> } // готовые offset'ы
}
```

- `windowY` — один пассивный слушатель на лейаут (`useGlobalListener`), не по слушателю на
  потребителя.
- `m-app-bar` auto-elevate переводится на `windowY` из контекста (вместо собственного слушателя);
  `isScrolled`-проп — deprecated-override.
- `insets` контекста — глобальные суммы краёв; точечные per-item оффсеты — §2.6.

### 2.6 Sticky-зоны и per-item insets (режим скролла документа)

Грид задаёт геометрию треков, но когда скроллит документ, main-трек растёт с контентом → боковая
зона по умолчанию тянется на всю высоту контента. Прижатие к viewport — отдельный механизм,
по-прежнему без измерений (это и есть «`100dvh − header1 − header2` через calc по текущим
ключам» из исходного ТЗ):

- Carving знает, какие полосы выкроены **до** конкретного элемента → движок эмитит per-item
  переменные: `--m3-layout-<id>-top: calc(<сумма sizeToken'ов top-полос до него>)`,
  аналогично `--m3-layout-<id>-bottom-sticky`.
- Зоны получают проп `sticky` (header — уже есть, default true; aside/rail — opt-in):

  ```scss
  align-self: start;
  position: sticky;
  top: var(--m3-layout-<id>-top);
  max-height: calc(100dvh - var(--m3-layout-<id>-top) - var(--m3-layout-<id>-bottom-sticky, 0px));
  ```

- **Нюанс footer'а**: нижний край вычитается **только если нижняя зона сама sticky/закреплена**,
  иначе у sticky-aside дырка, пока footer за экраном. Не-sticky низ в `-bottom-sticky` не входит.
- Тот же механизм даёт **стек sticky-header'ов**: второй header получает
  `top: var(--m3-layout-<id>-top)` = высота первого (сейчас оба `top: 0` и перекрылись бы).
- Не-sticky aside (дефолт) — просто грид-трек, тянется с контентом; никаких стилей сверх
  `grid-area`.

---

## 3. Колоночная система (m-container / m-row / m-col)

### 3.1 Принципы

- **SCSS-first, zero-runtime**: вся адаптивность — статически сгенерированные `@container`-блоки
  из `$material-kit-breakpoints` + классы; JS — только нормализация пропсов в классы. CLS = 0,
  работает до гидрации.
- **Viewport media queries** (решение владельца; от CQ отказались): сгенерированные
  `@media`-блоки из `$material-kit-breakpoints`, в одной системе координат с существующими
  миксинами `media-min/max`. Грид — прямо на `.m-container`, внутренняя обёртка не нужна.
  Дверь к CQ не закрываем: смена обёртки `@media` → `@container` в SCSS-цикле генератора —
  локальная правка, если когда-нибудь понадобится.
- **Пороги в `px`**, не `rem`: в `@media` rem резолвится от initial 16px, а не от fluid-root
  «1rem = 1px» — пороги поплыли бы; только px.
- Число колонок — **M3-дефолт** поверх 6 ключей: `mobile-xs/mobile → 4`, `tablet-xs/tablet → 8`,
  `desktop-xs/desktop → 12`. Маржины/гаттеры по M3: 16 (compact) / 24 (medium+), токены в
  `$tokens`-карте компонента.

### 3.2 API (Vuetify-like, плоские пропсы, mobile-first)

```vue
<m-container fluid>                         <!-- fluid | max-width по бп -->
<m-container :cols="6" :cols-desktop="12">  <!-- переопределение числа колонок -->

<m-col cols="2" tablet="4" desktop="3" offset="1" offset-desktop="0">
```

- `m-col`: `cols` (база, mobile-first) + `<bp-key>`-пропсы (`mobile`, `tablet-xs`, `tablet`,
  `desktop-xs`, `desktop`) + `offset` / `offset-<bp>`.
- Спаны **относительно актуального числа колонок**: `cols="2"` на мобилке (4 кол.) = половина.
  Реализация: `grid-column-end: span min(var(--m-col-span), var(--m-container-cols))` — кламп,
  чтобы спан больше сетки не создавал implicit-треки.
- `offset` → `grid-column-start: calc(var(--m-col-offset) + 1)` (требование ТЗ:
  grid-column-start-механика).
- Переменные `--m-col-span`/`--m-col-offset` переключаются классами `m-col--<bp>-<n>` внутри
  сгенерированных `@media`-блоков. Генерация — SCSS-циклом по `$material-kit-breakpoints`
  и максимуму колонок (12) в `assets/stylesheet/components/grid/_index.scss`.

### 3.3 m-row — опциональный, subgrid

- Без `m-row`: `m-col` — прямые дети `.m-container__grid`.
- С `m-row`: `display: grid; grid-column: 1 / -1; grid-template-columns: subgrid` — форс новой
  строки + те же линии колонок (baseline-поддержка subgrid с 2023 — ок). Пропсы `align`/`justify`/
  `no-gutters` — на row.

---

## 4. Фазы

### Фаза A — Engine v2 (ядро) — ✅ код готов (2026-06-10), визуальная проверка за владельцем
Итог: `.cursor/summary/auto-layout-phase-a_2026-06-10.md`.
Файлы: `app/composables/layout/{carve,registry}.ts` (новые), `useLayout.ts` (переписан),
`layout/index.vue` (упрощён), `shared/utils/resolveBreakpoints.ts`. Тесты 29/29, ESLint 0.
1. Реестр v2: DOM-порядок, `kind`, авто-id, late-mount сортировка, parent-component check (§2.3).
2. Carving-генератор grid-template (3 диапазона из конфига, хардкод-медиа удалить) + эмиссия
   per-item inset-переменных (§2.6).
3. Dev-warnings (top-level правило, дубликаты).
4. Обратная совместимость на время миграции: `area`→`kind` маппинг (header→top, left→start…).
**DoD**: существующие demo-страницы рендерятся без визуальных регрессий (скриншоты запросить у
владельца), lint/stylelint 0, юнит-тест на carving (чистая функция — покрыть таблично: baseline,
steam-порядок, два header'а, aside-до-footer и после).

### Фаза B — layoutContextZone — ✅ код готов (2026-06-10)
Итог: `.cursor/summary/auto-layout-phase-b_2026-06-10.md`. `useLayoutZone()` публичный,
windowY режимо-агностичен (двойной слушатель), scrollLock реф-каунтится, app-bar
auto-elevate. Внутренний контекст вкладов переименован в `m3:layout-host`. Тесты 35/35.
1. Контекст §2.5: insets-переменные, `windowY` (активный скроллер: window ↔ main при
   `full-height`), `scrollLock`, `sticky`-оффсеты.
2. `m-app-bar` elevate — через контекст; `isScrolled` deprecated.
**DoD**: elevate работает в обоих режимах скролла; lock реф-каунтится (две модалки → один лок).

### Фаза C — Зоны и самодостаточные компоненты — ✅ код готов (2026-06-10)
Итог: `.cursor/summary/auto-layout-phase-c_2026-06-10.md`. ⚠ Коррекция §2.6: sticky у
top/bottom-зон невозможен (containing block грид-итема = его area) → `position: fixed` +
строка-резерв (Vuetify-модель), `contain: layout` снят. Боковые — настоящий sticky.
Зоны мульти-инстанс, app-bar/rail/bar/system-bar самодостаточны, новые m-system-bar и
m-spacer. Тесты 41/41.
Файлы: `layout/{header,aside,footer,main,item}.vue`, `app-bar`, `navigation-rail`,
`navigation-bar`; новые: `ui/system-bar/`, `ui/spacer/`.
1. Зоны — мульти-инстанс (два `m-layout-header` = две строки сетки, в DOM-порядке) +
   `sticky`-проп на per-item insets (§2.6).
2. `m-app-bar`, `m-navigation-rail`, `m-navigation-bar`, `m-system-bar` регистрируются **сами**,
   когда первый уровень (§2.3) — обёртки-зоны больше не обязательны.
3. Новые компоненты по m3-like: `m-system-bar` (тонкий статус-бар, top), `m-spacer`.
**DoD**: связка `system-bar + app-bar + rail + footer` прямыми детьми `m-layout` даёт корректный
грид (узкое место текущей системы — закрыто); в режиме скролла документа aside по дефолту
тянется с контентом, со `sticky` — прижат к viewport с `max-height: 100dvh − insets`; стек из
двух sticky-header'ов не перекрывается.

### Фаза D — m-container / m-row / m-col — ✅ код готов (2026-06-10)
Итог: `.cursor/summary/auto-layout-phase-d_2026-06-10.md`. SCSS-first генерация из
`$grid-breakpoints` (px, mobile-first каскад порядком эмиссии), кламп `span min()`,
offset через IACVT-трюк (`--m-col-offset: initial` = сброс), subgrid m-row,
m-responsive. Песочница `/demo/grid`. Тесты 48/48. `ui/grid/` удалена.
Файлы: `ui/container/`, `ui/row/`, `ui/col/`, `ui/responsive/`,
`assets/stylesheet/components/grid/_index.scss`, `pages/demo/grid.vue`.
1. SCSS-генерация `@media`-блоков и классов из `$material-kit-breakpoints` (px), `$tokens` с
   M3 маржинами/гаттерами, `g()`-доступ.
2. Компоненты: нормализация пропсов → классы/`--vars`. Никакого `useBreakpoint` в рендере.
**DoD**: страница-песочница с сетками из wf (`three-column`, `constrained`, `system-bar` cols)
вёрстается декларативно; CLS 0 при SSR (CSS применяется до первого рендера); lint 0.

### Фаза E — Wireframes — ✅ код готов (2026-06-10)
Итог: `.cursor/summary/auto-layout-phase-e_2026-06-10.md`. AGENT_BRIEF v2 + 9 страниц
`demo/wf/*` (9 параллельных агентов), все линты 0, движок используется нативно.

### (изначальный план фазы E)
По `kit/.cursor/temp/wf/AGENT_BRIEF.md`: `app/pages/demo/wf/<name>.vue`, `layout: false`,
только `m-*`-компоненты. Параллелизуемо по файлам (агенты).
1. Обновить AGENT_BRIEF: убрать костыль «два бара в один header» (закрыт фазой C), добавить
   `m-container/m-row/m-col`, `m-system-bar`, `m-spacer`, `m-responsive` в маппинг.
2. 8 страниц: baseline, constrained, discord, extended-toolbar, inbox, side-navigation,
   system-bar, steam, three-column.
**DoD**: eslint+stylelint 0 на каждой; структура соответствует Vuetify-референсу; компромиссы —
списком в саммари.

### Фаза F — Документация и зачистка — ✅ готово (2026-06-10)
Итог: `.cursor/summary/auto-layout-phase-f_2026-06-10.md`. docs/layout.md переписан,
youtube.vue/DocsSidebar/useBreakpoint зачищены, roadmap отмечен, m-row gap пофикшен
(явный gap из --m-container-gutter). **Фича завершена**; deprecated-шимы — до major.

### (изначальный план фазы F)
1. Переписать `kit/docs/layout.md` (сейчас описывает несуществующую padding-модель).
2. Миграция существующих `layouts/` + demo-страниц на новый API; удалить deprecated-ветки.
3. Саммари в `.cursor/summary/`, обновить `roadmap.md`.

---

## 5. Микрорешения (ревью владельца 2026-06-10 — все подтверждены)

1. ✅ Top-level: dev-warning + рекомендация обёртки, без жёсткого выброса (§2.4).
2. ✅→✏️ Пороги в `px` подтверждены, но вывод владельца: **отказ от container queries вообще**,
   сетка на viewport `@media` (§3.1, таблица A3).
3. ✅ Маппинг колонок 4/4/8/8/12/12 по 6 ключам (§3.1).
4. ✅ `m-row` через subgrid (§3.3); кламп спана через `span min(...)` (§3.2).
5. ✅ Папки `ui/container`, `ui/row`, `ui/col` (имена компонентов = m-container/m-row/m-col).
6. ✅ Поведение по диапазонам устройств (asides вне грида на mobile) — сохранён текущий дефолт.

Доп. правка по ревью: «высота aside силами грида» верна только для `full-height`; в режиме
скролла документа aside тянется с контентом, прижатие — `sticky` + per-item insets (§2.6).

## 6. Риски

- `span min(var(), var())` — integer-calc в grid-column поддержан в evergreen, но проверить в
  целевых браузерах на фазе D; фолбэк — кламп в сгенерированных классах.
- Late-mount DOM-сортировка — только клиент; SSR-ветка всегда setup-порядок (корректно).
- Многослойные header'ы + `sticky` внутри зон: z-index по существующей шкале `z()`.
- `sticky`-aside при не-sticky footer: `-bottom-sticky` обязан исключать такой footer, иначе
  постоянная дырка снизу (покрыть кейс в юнит-тестах carving/insets).
- Transition `grid-template-*` при смене реестра — оставить, но проверить, что нет анимации при
  первой отрисовке (была причина CLS-багов в других системах).
