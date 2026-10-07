# MButtonSegmented — выбор одного или нескольких вариантов в одной полосе

<identity>M3: Segmented buttons (baseline; в Expressive вместо них рекомендована connected button group) · Токены Compose: `OutlinedSegmentedButtonTokens`; поведение — `SegmentedButton.kt` (`SingleChoiceSegmentedButtonRow`, `MultiChoiceSegmentedButtonRow`, `SegmentedButtonDefaults`) · Код: `src/runtime/components/ui/button/segmented/`, композабл `src/runtime/composables/button/useSegmentedButton.ts`, токены `assets/stylesheet/components/button/segmented/_index.scss` · Аудит: `data/button.json` (общий с семьёй) · Тип: public</identity>

<implementation-status state="planned" updated="2026-10-07">Исследование и рендеры готовы. Компонент близок к baseline M3; основная работа — общий движок выбора с MButtonGroup (group.md) и мелкие токены.</implementation-status>

## Вердикт

**дрейф.** Это узнаваемый outlined segmented button M3: пилюля 40, рамка outline, выбранный сегмент на
secondary-container с галочкой 18, label-large, правильные ARIA-модели (radio group для одного выбора,
toggle-кнопки для нескольких). Расходятся мелочи: pressed 12% вместо 10%, нет фокус-слоя, нет
минимальной ширины сегмента, `color` красит выбранный сегмент в любую роль. Главный вопрос не в
пикселях, а в судьбе компонента: M3 Expressive предлагает вместо него connected button group.

## Рендеры

| Сейчас | Концепт M3 |
|---|---|
| ![Сейчас](../../renders/button-group/current.webp) | ![Концепт](../../renders/button-group/concept.webp) |

Сейчас: одиночный выбор (покой, hover/focus/pressed на сегменте, disabled); множественный выбор,
иконки, выключенный сегмент, ось цвета; рядом — «группа» из отдельных `MButton`, которой кит
заменяет button group. Концепт: последний кадр — baseline segmented button с выносками; остальные
кадры — connected group из group.md, которая в Expressive занимает его место.

## Анатомия

| № | Часть M3 | Элемент кита | Статус |
|---|---|---|---|
| 1 | Container (outline, full) | `.ui-segmented-button` (`segmented/index.vue:2-7`, рамка `:85`, `overflow: hidden` `:86`) | есть |
| 2 | Segment | `.ui-segmented-button__segment` | есть |
| 3 | Разделитель сегментов (перекрывающиеся рамки) | `border-inline-end` (`:107`) | есть — у outlined segmented это край сегмента, а не перегородка внутри контрола |
| 4 | Selected icon (check 18) | `ICONS.check` с переходом scale (`:23-37`) | есть |
| 5 | Icon (необязательная) | `item.icon` | есть |
| 6 | Label | `.ui-segmented-button__label` | есть, переносится |

## Оси дизайна

| Ось | M3 | Кит сейчас | Цель | Ломает API |
|---|---|---|---|---|
| Режим выбора | single / multi | `multiple: boolean` | без изменений — у M3 это тоже два режима одной строки | нет |
| Цвет выбранного | только secondary-container | `color: MColor`, дефолт `secondary` (`segmented/props.ts`) | расширение кита, дефолт совпадает | нет |
| Размер | только 40 | только 40 | без изменений (у connected group будет `density` — group.md) | нет |

## Оси состояний

| Ось | Нужно | Есть | Не хватает |
|---|---|---|---|
| Базовое | enabled, disabled (группа и сегмент) | оба | — |
| Взаимодействие | hover 8%, pressed 10% | hover 8%, pressed 12% | S1 |
| Фокус | кольцо + слой 10% | кольцо внутрь (`focus-ring(inset)`, `:123`) — пилюля режет | слой 10% |
| Выбор | selected / unselected, selected + disabled | есть; selected + disabled теряет цвет, галочка остаётся | — |
| Данные | — | — | — |

## Токены: расхождения

| Часть | M3 (`OutlinedSegmentedButtonTokens`, `SegmentedButtonDefaults`) | Кит (`segmented/_index.scss`) | Действие |
|---|---|---|---|
| Отступ сегмента | 12 / 12 | `segment.padding.inline: spacing(12)` | совпадает |
| Минимальная ширина | 58 (`ButtonDefaults.MinWidth`) | нет, `min-width: 0` | добавить `segment.min-width`; перенос подписи остаётся |
| Pressed | 10% | 12% | S1 |
| Фокус | слой 10% + индикатор | кольцо | добавить слой |
| Disabled-край | on-surface 12% | on-surface 12% | совпадает |
| Disabled-текст | on-surface 38% | on-surface 38% | совпадает |
| Движение галочки | сдвиг содержимого (offset) + crossfade иконки | scale 0.5 → 1 + opacity, short-3 | оставить: разница видна только в анимации; длительности — токены `--sys-motion-*` (пружины S4 отклонены) |

Совпадает: высота 40, рамка 1 outline, форма full, secondary-container / on-secondary-container,
on-surface у невыбранных, иконка 18, label-large, перекрывающиеся края.

## Поведение и доступность

- Одиночный выбор — `role="radiogroup"`, сегменты `role="radio"` + `aria-checked`, одна остановка Tab,
  стрелки двигают выбор, Home/End, RTL разворачивает стрелки (`useSegmentedButton.ts`). Множественный
  выбор — `role="group"`, сегменты с `aria-pressed`. Это эталон для group.md, а не наоборот.
- Имя группы — `aria-label`/`aria-labelledby` на корне (уходят фоллтру). Сегменту без подписи нужен
  `item.ariaLabel`.
- Галочка не единственный носитель выбора: есть `aria-checked`/`aria-pressed`, фон и forced colors
  (`Highlight`) — color-and-state.md выполнено.
- Открытый пункт аудита EN-03: нет scoped-слота сегмента — В-2.

## API

| Изменение | Тип | Ломает |
|---|---|---|
| слот `#item="{ item, selected }"` | заполняет только содержимое сегмента; кнопка и ARIA остаются у кита | нет |
| `segment.min-width` | токен | нет (визуально — узкие сегменты станут шире) |

## План работ

1. **S** — `segment.min-width: 58rem`, pressed 10% (СВ-1), фокус-слой 10%. Файлы:
   `segmented/_index.scss`, `segmented/index.vue`.
2. **M** — Общий движок выбора с MButtonGroup: вынести из `useSegmentedButton` ядро выбора
   (single/multi, клавиатура, роли) так, чтобы его потреблял и connected group (group.md). Сегодняшнее
   поведение сегментов не меняется. Зависит от group.md, В-1.
3. **S** — Слот `#item` по В-2.

## Тесты

- Фикстуры уже есть (`fixtures/button/family.vue`, e2e «segmented …» в `button.e2e.ts`): добавить
  проверку минимальной ширины и слоя фокуса.
- unit `useSegmentedButton`: спека на анонимной разметке (behavior.md) — композабл не отдаёт классов и
  `data-*`; после выноса ядра — те же тесты на общем движке.

## Готово, когда

- [ ] Сегмент не уже 58, pressed 10%, у фокуса есть слой.
- [ ] Выбор работает на общем движке с connected group, e2e сегментов зелёные без правок.
- [ ] Решения В-1 и В-2 отражены в API и документации.

### Находка из рендера color-picker (2026-10-07)

Перенос длинных подписей, введённый в фазе D, в узком контейнере ломает подписи на
вертикальные буквы: шесть сегментов форматов в пикере шириной 248 («H/E/X» по букве в строку).
Перенос нужен только по словам: `overflow-wrap: normal; word-break: keep-all` у подписи и
`min-inline-size: max-content` у сегмента. Если ряд не помещается, срабатывает горизонтальная
прокрутка ряда. Это шаг исправления, не новая ось. Пикер переходит на выпадающий список
форматов ([color-picker](../inputs/color-picker/index.md), вопрос 1), но то же
самое случится у любого узкого segmented.

## Предложения по UX

Расширения сверх паритета с M3. Это предложения владельцу, а не шаги плана: в работу попадают только
одобренные. Без анимаций Expressive и без новых зависимостей.

| Предложение | Что получает пользователь | Заказчик | Цена | Рекомендация |
|---|---|---|---|---|
| Счётчик в сегменте: `item.badge` | Видит количество в каждом варианте («Входящие 12») до переключения | Фильтры почты, задач, заказов | S: переиспользует `MBadge`; API — поле элемента. Пересекается с В-2 (слот `#item`) — поле дешевле слота | Да, если появится заказчик; закрывает EN-03 без слота |
| Прокрутка вместо переноса на узком экране | Длинный набор сегментов листается пальцем со снапом, а не ломается на две строки | Мобильные фильтры | S: CSS `overflow-x: auto` + `scroll-snap`, выбранный сегмент прокручивается в видимую область; API — нет | Обсудить: сегодня подписи переносятся сознательно (фаза D) |
| Снимаемый одиночный выбор | Повторное нажатие на выбранный сегмент снимает выбор, когда «ничего» — допустимое значение | Фильтры «любой» | S: проп; меняет модель radiogroup (нужен `aria-checked=false` у всех) | Отложить до заказчика |

## Открытые вопросы

**В-1. Судьба segmented button рядом с connected group.**

1. Оставить `MButtonSegmented` как baseline-компонент и построить `MButtonGroup` connected на общем
   движке выбора. Ничего не ломается, у продуктов два похожих контрола; документация говорит, когда
   какой.
2. Объявить `MButtonSegmented` устаревшим после выхода `MButtonGroup` (dev-предупреждение, удаление в
   следующем мажоре). Один контрол на задачу, но миграция для всех потребителей
   (`color-picker/index.vue:43` внутри кита).
3. Переписать `MButtonSegmented` как пресет connected group (тот же тег, новый вид). Один движок и один
   вид, но молча меняется внешний вид у всех потребителей.

Рекомендация: 1 сейчас; 2 — когда у `MButtonGroup` появятся реальные потребители.

**В-2. Слот сегмента (EN-03).**

1. Scoped-слот `#item="{ item, selected }"` только для содержимого; кнопка, роль и `aria-*` остаются
   у кита (craft.md: слот заполняет контент, проводка доступности у компонента).
2. Не добавлять: `items` с `icon`/`label`/`ariaLabel` покрывает известные случаи, заказчика нет.

Рекомендация: 2, пока нет заказчика (principles.md, В4); вернуться с первым запросом на бейдж или
счётчик в сегменте.
