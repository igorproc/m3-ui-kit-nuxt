# useVirtualScroll — headless-виртуализация больших коллекций

<identity>M3: нет (поведенческий композабл без вида; ближайший аналог в Compose — ленивые списки `LazyColumn`/`LazyRow` из foundation, не из material3) · Токены Compose: нет · Код: `src/runtime/composables/virtual-scroll/` (`useVirtualScroll.ts`, `types.ts`, `geometry.ts`), нормализация RTL — `src/runtime/utils/viewport/logicalScroll.ts` · Аудит: отдельного отчёта нет · Тип: public composable</identity>

<implementation-status state="done" updated="2026-10-07">Реализован 2026-07-18; 2026-10-07 доведён: бэги `spacerAttrs`/`getItemAttrs`, RTL через общий `utils/viewport/logicalScroll`, перебивание программной прокрутки пользователем, отказ от недостижимой цели, состояние `settling`, снятие всего на dispose; спеки, фикстуры и e2e.</implementation-status>

## Вердикт

`авторский` (инфраструктура). В каталоге M3 виртуализации нет: это поведение платформы, а не
компонент. Эталон — текущий код и `docs/system/ru-RU/behavior.md`: три слоя, бэги без `class` и
`data-*`, SSR в контракте, снятие слушателей и таймеров, RTL, сокращённое движение. Решения
прежнего плана остаются:
- один headless-композабл, без компонентов-обёрток, элементов и сторожей;
- данные, загрузка, курсоры, повтор и ошибка, разметка и роли — у потребителя;
- размеры строк известны до рендера: константа или синхронная функция индекса;
- SSR считает настоящий начальный диапазон из `useSSRWindowSize()`, без `ssrCount`.

## Рендеры

Не применимо: вида нет. Разметку рисует потребитель. Живой пример — фикстуры
`/virtual-scroll/matrix` (вертикаль и горизонталь, постоянный и известный размер, ltr и rtl) и
`/virtual-scroll/stress` (100 000 строк, программная навигация, пустая коллекция).

## Как сейчас

- `geometry.ts` — чистая математика без Vue и DOM. Постоянный размер решается за O(1), функция
  размера — через префиксные суммы и бинарный поиск. `computeRange` расширяет видимый диапазон на
  `overscan` и зажимает его в `count`. Пустая коллекция или нулевой вьюпорт дают `{ 0, -1 }`.
- `useVirtualScroll.ts` — реактивная машина: диапазон и `virtualItems`, `totalSize` с отступами,
  `isAtStart`/`isAtEnd` с раздельными порогами, направление и состояние прокрутки,
  `scrollToOffset`/`scrollToIndex`/`ensureVisible`, якорь, бэги `spacerAttrs`/`getItemAttrs`.
  На контейнере — слушатель `scroll` и слушатели намерения пользователя (`wheel`, `touchstart`,
  `pointerdown`, `keydown`), оба через `useEventListener`; один rAF на нативную прокрутку и один на опрос программной (`useRaf`), окно
  тишины — `useTimer`, `ResizeObserver` — только на контейнер.
- `types.ts` — публичные типы. `utils/viewport/logicalScroll.ts` — чистые
  `toLogicalScrollLeft`/`toPhysicalScrollLeft`, импорт явный (папка `utils/` не автоимпортируется).
- Потребителей в ките нет. Кандидаты: виртуализация строк таблицы ([table](../data/table.md)),
  длинные списки дропдауна (CT-08, [dropdown](../inputs/dropdown.md)), [list](../containment/list.md).
  Нормализацию RTL переиспользует `useScrollOverflow` из плана slide-group.

### Найдено при сверке 2026-10-07 и исправлено

| Было | Почему плохо | Стало |
|---|---|---|
| `settling` объявлено в типе, но не выставлялось; после программной прокрутки хвостовое событие `scroll` переводило машину в `scrolling` | Состояние «мигало» `programmatic → idle → scrolling → idle` после каждого `scrollTo*` | Цель достигнута → `settling` → окно тишины → `idle`; событие без сдвига состояние не меняет |
| Комментарий обещал, что прокрутка пользователя перебивает программную, но перебивал только новый запрос | Колесо во время `smooth`, укоротившиеся данные или скрытый контейнер оставляли опрос каждый кадр навсегда: промис не разрешался, состояние висело в `programmatic` | `wheel`/`touchstart`/`pointerdown`/`keydown` на контейнере (capture) отдают управление пользователю: промис `false`, состояние `scrolling`. Позиция не меняется 120 мс — промис `false` |
| `useRaf` создавался внутри каждого `scrollToOffset`, вне effect scope | Кадр опроса не снимался при размонтировании | Один планировщик опроса на экземпляр; ожидающий запрос при dispose разрешается `false` |
| RTL: `Math.abs(scrollLeft)` в обоих направлениях, направление читалось `getComputedStyle` на каждую программную прокрутку | Отрицательный overscroll в LTR (Safari) читался как сдвиг вперёд; лишнее чтение стилей | `logicalScroll.ts`; направление кэшируется в `measure()` |
| Свои `prefersReducedMotion` и `IN_BROWSER`, сырой `setTimeout` окна тишины | Дубли общих утилит, ручная очистка таймера | `utils/motion/shared/reduced-motion`, `shared/constants/globals`, `useTimer` |
| `enabled: false → true` не перемерял контейнер | Диапазон считался от устаревшего смещения до следующего события | `measure()` при включении; выключение разрешает ожидающий запрос `false` |
| Смена контейнера не трогала ожидающий запрос | Запрос опрашивал чужой элемент | Запрос разрешается `false`, наблюдатель и слушатели переезжают |
| Бэгов не было, потребитель сам ставил `top`/`left` | Горизонталь в RTL ломалась на `left`, позиционирование размазывалось по потребителям | `spacerAttrs` и `getItemAttrs(item)` на логических свойствах |

## Как должно быть

### Границы ответственности

Композабл не делает:
- загрузку: нет колбэка, состояния промиса, курсора или страницы, повтора и ошибки;
- изменение элементов и их кэш;
- публичных обёрток, элементов строк и сторожей;
- обязательного `IntersectionObserver` для подгрузки;
- слушателя или наблюдателя на каждую строку;
- измеряемой переменной высоты в v1.

### API

```ts
type VirtualScrollState = 'idle' | 'scrolling' | 'programmatic' | 'settling'
type VirtualScrollDirection = 'forward' | 'backward' | null
type VirtualScrollAlignment = 'start' | 'center' | 'end' | 'auto'

interface UseVirtualScrollOptions {
  container: MaybeRefOrGetter<HTMLElement | null>
  count: MaybeRefOrGetter<number>
  itemSize: number | ((index: number) => number)
  getKey?: (index: number) => PropertyKey
  overscan?: number
  horizontal?: boolean
  enabled?: MaybeRefOrGetter<boolean>
  paddingStart?: number
  paddingEnd?: number
  initialOffset?: number
  threshold?: { start?: number, end?: number }
}

interface VirtualItem { index: number, key: PropertyKey, start: number, end: number, size: number }
interface VirtualRange { startIndex: number, endIndex: number }
interface VirtualScrollAnchor { key: PropertyKey, offsetWithinViewport: number }
interface VirtualScrollAttrs { style: CSSProperties }

interface UseVirtualScrollReturn {
  virtualItems: Readonly<ComputedRef<VirtualItem[]>>
  range: Readonly<ComputedRef<VirtualRange>>
  totalSize: Readonly<ComputedRef<number>>
  spacerAttrs: Readonly<ComputedRef<VirtualScrollAttrs>>
  getItemAttrs: (item: VirtualItem) => VirtualScrollAttrs
  scrollOffset: Readonly<Ref<number>>
  viewportSize: Readonly<Ref<number>>
  isAtStart: Readonly<ComputedRef<boolean>>
  isAtEnd: Readonly<ComputedRef<boolean>>
  scrollDirection: Readonly<Ref<VirtualScrollDirection>>
  state: Readonly<Ref<VirtualScrollState>>
  isScrolling: Readonly<ComputedRef<boolean>>
  scrollToOffset: (offset: number, options?: { behavior?: ScrollBehavior }) => Promise<boolean>
  scrollToIndex: (index: number, options?: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior }) => Promise<boolean>
  ensureVisible: (index: number, options?: { align?: VirtualScrollAlignment, behavior?: ScrollBehavior }) => Promise<boolean>
  captureAnchor: () => VirtualScrollAnchor | null
  restoreAnchor: (anchor: VirtualScrollAnchor) => void
  measure: () => void
  refresh: () => void
}
```

Дефолты: `overscan` 4, вертикаль, включён, нулевые отступы, начальное смещение и пороги. Имена
`isAtStart`/`isAtEnd` и `scrollOffset`, а не двусмысленные `isStart`/`isEnd`/`position`. Тип
возврата объявлен явно — иначе `mkdist` падает с TS7056.

### Бэги

Два бэга, только `style`, без `class` и `data-*` (это проверяет спека):
- `spacerAttrs` — коробка полного размера: `position: relative` и `block-size` (вертикаль) или
  `inline-size` плюс `block-size: 100%` (горизонталь);
- `getItemAttrs(item)` — строка: `position: absolute`, `inset-block-start` и `block-size` с
  `inset-inline: 0` (вертикаль) или `inset-inline-start` и `inline-size` с `inset-block: 0`
  (горизонталь).

Логические свойства делают RTL по горизонтали верным по построению: смещение логическое, строка
встаёт от инлайн-начала. Значения — в CSS px, как `scrollTop`. Это живая геометрия, известная только
рантайму, поэтому она едет инлайн-стилем: таблицы стилей у композабла нет. Потребитель, которому
нужна другая раскладка (строки `<tr>` таблицы), берёт `virtualItems` и позиционирует сам. Поперечный
размер горизонтальной ленты задаёт потребитель — `block-size` у контейнера.

### Машина состояний

```text
idle
├── нативная прокрутка ──────────────▶ scrolling
└── scrollTo* ───────────────────────▶ programmatic

scrolling
└── окно тишины 120 мс ──────────────▶ idle

programmatic
├── цель достигнута ─────────────────▶ settling  (промис true)
├── нет движения 120 мс ─────────────▶ settling  (промис false)
├── новый запрос ────────────────────▶ programmatic (прежний промис false)
├── смена контейнера, выключение ────▶ settling  (промис false)
└── wheel/touchstart/pointerdown/keydown ▶ scrolling (промис false)

settling
├── окно тишины 120 мс ──────────────▶ idle
└── сдвиг позиции ───────────────────▶ scrolling
```

Машина описывает только прокрутку. Нативные события сводятся одним rAF; событие без сдвига
позиции состояние не меняет, поэтому хвостовое `scroll` после программной прокрутки и
`restoreAnchor` не переводят машину в `scrolling`. `isScrolling` — `scrolling` или `programmatic`.

### Диапазон

Для постоянного или известного размера видимые начало и конец считаются из логического смещения и
размера вьюпорта, расширяются на `overscan` и зажимаются в `count`. `totalSize` включает оба
отступа. Пустая или выключенная коллекция даёт пустой диапазон без неверных индексов. Смена
`count` или известных размеров пересчитывает геометрию, не трогая данные.

### Границы

`isAtStart`/`isAtEnd` — чистая реактивная геометрия с раздельными логическими порогами.
Потребитель смотрит на них и сам решает, грузить ли дальше:

```ts
watch(virtual.isAtEnd, (reached) => {
  if (reached && hasNextPage.value) fetchNextPage()
})
```

Композабл не дебаунсит, не дедуплицирует и не представляет этот запрос. При смене `count` или
размеров флаги пересчитываются сами.

### SSR

`useSSRWindowSize()` даёт детерминированные ширину и высоту, общие для сервера и клиента. Размер
выбранной оси вместе с `initialOffset` (по умолчанию 0) даёт настоящий начальный диапазон на
сервере. Гидрация начинается с того же диапазона: окно приезжает в payload `useState`. После
монтирования `measure()` уточняет геометрию по контейнеру, `ResizeObserver` ловит последующие
изменения. Ни `ssrCount`, ни `initialViewportSize` нет. Если вьюпорт сознательно меньше окна, его
размер должен прийти из того же контракта раскладки, а не из угаданного клиентского замера.

### Навигация и RTL

`align: 'auto'` ничего не делает, если строка видна целиком (промис сразу `true`, состояние не
меняется), иначе выравнивает ближайший край. Смещения зажимаются в `[0, totalSize − viewport]`.
По горизонтали смещение логическое: `toLogicalScrollLeft` читает `scrollLeft`, `toPhysicalScrollLeft`
пишет его обратно. Поддержана стандартная модель RTL (0 у начала, отрицательные значения к концу) —
так работают все современные движки; устаревшие положительные модели (Chrome до 85) не
поддерживаются. Направление документа читается в `measure()`; сменили `dir` на лету — вызовите
`refresh()`. При `prefers-reduced-motion: reduce` программная прокрутка идёт с `behavior: 'auto'`
(решение владельца 2026-10-07).

### Якорь

`captureAnchor`/`restoreAnchor` сохраняют положение вьюпорта, когда потребитель добавляет данные в
начало или удаляет их (чат, история). Данных они не вызывают. Пропавший ключ — безопасный no-op с
дев-предупреждением, а не прыжок по неверному индексу.

### Фокус

Реестра элементов и ролей у композабла нет. Потребитель вызывает `ensureVisible(index)`, ждёт
промис и фокусирует свою строку. `false` значит, что цель не достигнута: управление забрал
пользователь или новый запрос. По возвращённому диапазону потребитель может закрепить
сфокусированную строку, если этого требует его семантика.

### Жизненный цикл

Все слушатели, кадры, таймер и наблюдатель снимаются со скоупом. Смена контейнера переносит
слушатели и наблюдатель и отменяет ожидающий запрос. Выключенный режим не работает, но отдаёт
безопасные вычисляемые значения; включение перемеряет контейнер. На сервере браузерных сущностей
нет, `scrollTo*` сразу отдают `false`.

### Переменная высота — граница v1

V1 принимает постоянный размер или синхронную функцию индекса, известную до рендера, и строки не
мерит. Настоящая переменная высота требует отдельно согласованного кэша замеров, `ResizeObserver`
на видимые строки, коррекции смещения и стратегии якоря. Протаскивать её в этот API через
необязательные ref'ы элементов нельзя.

### Пример

```vue
<template>
  <div
    ref="viewport"
    class="feed"
    role="region"
    tabindex="0"
    aria-label="Сообщения"
  >
    <div v-bind="virtual.spacerAttrs.value" role="list">
      <div
        v-for="item in virtual.virtualItems.value"
        :key="item.key"
        v-bind="virtual.getItemAttrs(item)"
        role="listitem"
        :aria-posinset="item.index + 1"
        :aria-setsize="items.length"
      >
        {{ items[item.index].text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const virtual = useVirtualScroll({
  container: useTemplateRef<HTMLElement>('viewport'),
  count: () => items.value.length,
  itemSize: 64,
  overscan: 6,
  getKey: index => items.value[index]!.id,
  threshold: { end: 256 },
})

watch(virtual.isAtEnd, (reached) => {
  if (reached && hasNextPage.value) fetchNextPage()
})
</script>
```

## Поведение и доступность

- Роли и имена — у потребителя: список (`list`/`listitem` с `aria-setsize`/`aria-posinset`), сетка
  (`grid`/`row` с `aria-rowcount`/`aria-rowindex`) или listbox. Композабл знает индекс и `count`,
  этого достаточно для любой из них.
- Прокручиваемый контейнер без фокусируемых строк получает `tabindex="0"` и имя от потребителя
  (axe `scrollable-region-focusable`). Тогда клавиатура прокручивает его нативно: стрелки, Page,
  Home, End.
- Своей клавиатурной модели нет. Нажатие клавиши в контейнере прерывает идущую программную
  прокрутку раньше, чем обработчик потребителя начнёт новую (слушатель в фазе capture).
- Сокращённое движение: `smooth` превращается в `auto`.
- RTL по горизонтали: начало справа, смещения и направление логические.

## API

Изменения волны 2026-10-07:
- **добавлено**: `spacerAttrs`, `getItemAttrs`, тип `VirtualScrollAttrs`;
- **ломает**: публичные типы переехали из `useVirtualScroll.ts` в `types.ts`. Миграция:
  `import type { VirtualItem } from '#kit/composables/virtual-scroll/types'` или автоимпорт. Внутри
  кита явных импортов нет;
- **поведение**: `scrollTo*` разрешаются `false` при перебивании пользователем, недостижимой цели,
  смене контейнера, выключении и dispose (раньше промис мог не разрешиться никогда); `ensureVisible`
  для полностью видимой строки отдаёт `true` без смены состояния; после программной прокрутки
  машина проходит через `settling`.

## План работ

1. **S** — переписать план по шаблону `common.md` §5. Готово.
2. **S** — `utils/viewport/logicalScroll.ts` и спека; `useVirtualScroll` читает и пишет `scrollLeft`
   через неё, направление кэшируется в `measure()`. Готово. Следующий потребитель — `useScrollOverflow`
   ([slide-group](../../low-priority-components/slide-group/index.md), шаг 1).
3. **M** — машина состояний: `settling`, перебивание пользователем, отказ от недостижимой цели,
   один планировщик опроса, разрешение ожидающего запроса при смене контейнера, выключении и
   dispose. Готово.
4. **S** — бэги `spacerAttrs`/`getItemAttrs` на логических свойствах. Готово.
5. **S** — общие `prefersReducedMotion` и `IN_BROWSER`, `useTimer` вместо `setTimeout`, перемер при
   включении. Готово.
6. **S** — `useVirtualScroll.ts` перерос 400 строк: типы вынесены в `types.ts`; спека разделена на
   основную и `useVirtualScroll.navigation.spec.ts`. Готово.
7. **M** — спеки по разделу «Тесты». Готово.
8. **M** — фикстуры `matrix`/`stress` и e2e. Готово, e2e не запускались.
9. **S** — страница в docs_v2 — **перенесено**: документация живёт вне репозитория.
10. **L** — измеряемая переменная высота — **перенесено**: сознательно отложено владельцем.

Не делаем: `ssrCount`, загрузчик, компоненты-обёртки.

## Тесты

Unit, рядом с кодом, фейковые таймеры и кадры:
- `geometry.spec.ts` — постоянный размер, отступ, функция размера и бинарный поиск, overscan и
  кламп, пустой диапазон;
- `utils/viewport/specs/logicalScroll.spec.ts` — таблица чтения и записи `scrollLeft` в ltr/rtl,
  overscroll, круговой проход;
- `useVirtualScroll.spec.ts` — SSR-диапазон от `useSSRWindowSize`, ключи и геометрия, функция
  размера с отступами, динамический и пустой `count`, бэги на логических свойствах по обеим осям,
  нативная прокрутка в один кадр, направление и `scrolling → idle`, пороги границ, горизонталь в
  ltr и rtl, якорь при добавлении и удалении сверху, пропавший ключ, бэги без `class` и `data-*`
  на анонимной разметке с ограниченным числом строк;
- `useVirtualScroll.navigation.spec.ts` — кламп, выравнивания `start/center/end/auto`,
  `programmatic → settling → idle` с хвостовым событием, перебивание колесом, вытеснение новым
  запросом, недостижимая цель, сокращённое движение, отказ без контейнера и в выключенном режиме,
  перемер при включении, смена контейнера со снятием слушателей и отменой запроса,
  `ResizeObserver` только на контейнер, снятие всего при dispose.

Общего хелпера у спек нет намеренно: любой экспорт из `composables/**` попадает в автоимпорт
приложения потребителя.

Фикстуры: `playground/fixtures/virtual-scroll/matrix.vue` — четыре панели (вертикаль и горизонталь
× постоянный и известный размер с отступами), флаги границ и диапазон; `stress.vue` — 100 000 строк
с длинным текстом и длинным словом, кнопки «в начало / к 50 000 / в конец», состояние машины, число
строк в DOM, пустая коллекция.

e2e `virtual-scroll.e2e.ts`: axe на matrix по темам × направлениям и на stress по темам; нет
горизонтального переполнения на `WIDTHS`; число строк в DOM ограничено; программная навигация в
конец даёт `isAtEnd` и `idle`; центрирование строки 50 000; End в сфокусированном регионе;
пустая коллекция; вертикальные панели до конца; горизонтальные панели начинаются у инлайн-начала и
доходят до конца в ltr и rtl.

## Готово, когда

- [x] Один композабл виртуализирует произвольную коллекцию, не владея загрузкой и разметкой.
- [x] Бэги без `class` и `data-*`, тип возврата объявлен явно.
- [x] Горизонталь в RTL: смещения, направление и границы логические, строки встают от
      инлайн-начала.
- [x] Программная прокрутка всегда разрешается: целью, перебиванием, вытеснением, отказом или
      dispose; под сокращённым движением она мгновенная.
- [x] Все слушатели, кадры, таймер и наблюдатель снимаются со скоупом и при смене контейнера.
- [x] SSR и первый клиентский кадр дают один диапазон.
- [x] Unit-спеки, фикстуры и e2e на месте; e2e прогоняет основная сессия.
- [ ] Открытые вопросы закрыты владельцем.

## Предложения по UX

- **`scrollend` вместо окна тишины** · `idle` наступает ровно по окончании прокрутки, а не через
  120 мс тишины · заказчик — потребитель, откладывающий тяжёлый рендер до остановки · S, без API ·
  рекомендация: при первом таком заказчике, с запасным окном тишины там, где события нет.

## Открытые вопросы

1. **Единицы `itemSize`.** Геометрия в CSS px (как `scrollTop`), а раскладка кита — в rem при корне
   от ширины окна. Строка, задуманная как 56rem, на разных ширинах окна занимает разное число px.
   1. Оставить px, потребитель пересчитывает сам. Ноль кода, но ловушка у каждого потребителя.
   2. Принять размер в rem и умножать на размер корня, выведенный из `useSSRWindowSize`
      (детерминированно для SSR). S–M, новая опция или смена единиц `itemSize`.
   3. Мерить первую строку. Противоречит границе v1 (без замеров).

   Рекомендация: 2 при первом потребителе из кита (таблица, дропдаун); до тех пор 1.
2. **`initialOffset` не прокручивает контейнер.** Сервер рисует диапазон у `initialOffset`, но если
   никто не прокрутил контейнер, после монтирования `measure()` читает 0 и диапазон уезжает в
   начало.
   1. Композабл при подключении контейнера мгновенно прокручивает его к `initialOffset`, если
      контейнер стоит в начале. S.
   2. Оставить потребителю и задокументировать. Ноль кода, но SSR-диапазон и первый кадр расходятся.
   3. Убрать `initialOffset`. Ломает API без выигрыша.

   Рекомендация: 1.
3. **`geometry.ts` автоимпортируется.** Папка `composables/**` целиком попадает в автоимпорт, и
   `buildMeasurement`/`computeRange` становятся глобальными именами в приложении потребителя.
   1. Перенести `geometry.ts` в `utils/virtual-scroll/` (явный импорт). S, вне папки композабла.
   2. Оставить.

   Рекомендация: 1.
