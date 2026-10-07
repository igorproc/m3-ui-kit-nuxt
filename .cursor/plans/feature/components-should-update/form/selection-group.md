# MSelectionGroup — renderless-реестр выбора для своих выбираемых элементов

<identity>M3: нет в M3 (авторский поведенческий примитив кита; паттерны выбора M3 — connected button group, chip group, segmented button, списки — его потребители, а не аналоги) · Токены Compose: нет · Код: `src/runtime/components/ui/selection-group/index.vue`, фасад `src/runtime/composables/selection/{context,useSelectionGroup,useSelectionItem}.ts`, приватный рендерер `src/runtime/components/fragments/selection-group/data-item.vue`, реестр `src/runtime/composables/registry/createGroup` · Аудит: `data/selection-group.json` · Тип: public (renderless)</identity>

<implementation-status state="planned" updated="2026-10-07">Компонент работает с 2026-07-13: публичный фасад над реестром `createGroup`, три способа композиции (данные, ручной `MSelectionItem`, свой ребёнок через `useSelectionContext`), политики `multiple` / `mandatory` / `max`, очистка через `onScopeDispose`, тесты. План 2026-10-07 добавляет то, чего просит аудит, не ломая «только выбор»: атрибуты потребителя без предупреждения Vue и (по ВГ-1) готовые бэги доступности. Код не менялся. Ждут ВГ-1…ВГ-3.</implementation-status>

## Вердикт

**авторский.** Аналога в M3 нет: это поведенческий слой, поверх которого кит рисует выбор
(`MChipGroup` уже делегирует ему тикеты). Как примитив он цельный: один источник выбора, generic-типы
от `items` до `#item`, keyed-реконсиляция, политики `mandatory` и `max`. Против системы
(`behavior.md`) два пробела: корень — фрагмент, поэтому `class` / `aria-*` потребителя теряются с
предупреждением Vue (EN-04, FM-07), и слот отдаёт только булевы флаги — каждый потребитель сам
собирает `aria-pressed` / `aria-checked`, а пример в документации не собирает (A11-06).

## Рендеры

Не применимо: компонент renderless — ни DOM, ни стилей. Вид выбора принадлежит потребителю
(`MChipGroup`, будущий `MButtonGroup` connected, свои карточки и плитки). Доски `gallery` и `concept`
не заводятся; вид потребителей — в их планах ([chip-group](chip-group.md),
[button/group](../button/group.md)).

## Анатомия

Структурные части вместо визуальных.

| № | Часть | Элемент кита | Статус |
|---|---|---|---|
| 1 | Группа: провайдер фасада | `MSelectionGroup` → `provideSelectionContext` (`index.vue:150`) | есть |
| 2 | Тикет элемента | `register()` → `SelectionItemTicket` (`useSelectionGroup.ts:141-168`) | есть |
| 3 | Ручной элемент | `MSelectionItem` (см. [selection-item.md](selection-item.md)) | есть |
| 4 | Элемент из данных | приватный `fragments/selection-group/data-item.vue` | есть |
| 5 | Слоты | `default` (уровень группы, один раз), `item` (на запись), `empty` | есть |
| 6 | Носитель роли группы и имени | — (корень — фрагмент) | нет — шаг 1 и ВГ-1 |

## Оси дизайна

Визуальных осей нет. Оси поведения:

| Ось | Значения | Статус |
|---|---|---|
| `multiple` | `false` → `TValue \| undefined`; `true` → `TValue[]` | есть |
| `mandatory` | `false` · `true` (нельзя снять последний) · `'force'` (плюс выбирает первый доступный) | есть |
| `max` | число, только в `multiple` | есть |
| `disabled` | вся группа | есть |
| `valueComparator` | равенство значений (по умолчанию `===`) | есть |
| Композиция | данные (`items` + `#item`) · ручная (`MSelectionItem`) · своя (`useSelectionContext`) | есть |
| Паттерн доступности | toggle / radio / checkbox / option | нет — ВГ-1 |
| `readonly` | — | ВГ-2 |

## Оси состояний

Из `axes` аудита, сверено с кодом.

| Ось | Нужно | Есть | Не хватает |
|---|---|---|---|
| Базовое | disabled группы и элемента | `isDisabled`, `blockReason: 'disabled'` | read-only — ВГ-2 |
| Выбор | выбран, частично, все, блок по `max` | `isSelected`, `isMixed`, `isAllSelected`, `selectionLimitReached`, `blockReason: 'max'` | программные атрибуты — ВГ-1 |
| Фокус | roving / стрелки у составных групп | нет (по прежнему решению — работа потребителя) | ВГ-3 |
| Данные | пустой список | слот `#empty` | — |

## Токены: расхождения

Не применимо: компонент ничего не рисует. Карт, классов и `data-*` нет и не появится — это требование
`behavior.md` к поведенческому слою.

## Поведение и доступность

Подтверждено прежним планом и остаётся:

- **Один источник правды.** `createGroup` / `createSelection` — единственный реестр; `selected`,
  `isAllSelected`, `isMixed`, `selectionLimitReached` — readonly-проекции. Ни второго массива выбора,
  ни Pinia, ни нового символа инъекции на экземпляр. Фасад прячет id, неймспейсы и прокси.
- **Модель.** single отдаёт `TValue | undefined`, multiple — `TValue[]`. Внешняя модель
  применяется через реестр, а не пересоздаёт тикеты; заранее заданное значение выбирает элемент, как
  только тот зарегистрируется (`useSelectionGroup.ts:206`).
- **`mandatory`.** `true` запрещает снять последний выбор; `'force'` ещё и выбирает первый доступный;
  исчезновение выбранного динамического элемента восстанавливает инвариант (`:226`).
- **`max`.** Только в multiple. На лимите выбранные остаются управляемыми, невыбранные получают
  `isSelectionBlocked` / `blockReason: 'max'`; группа отдаёт `selectionLimitReached` для сообщения.
  Вид блокировки решает потребитель.
- **Идентичность.** `itemKey`, затем значение, затем индекс с dev-предупреждением для объектов;
  дубликаты ключей — dev-предупреждение. Реконсиляция по ключу: новая запись — новый scope и тикет,
  удалённая — `onScopeDispose`, перестановка не теряет выбор. `onUnmounted` не используется.
- **Слоты.** Смысл `default` не зависит от наличия `items`: он всегда уровня группы и вызывается
  один раз; `item` — на каждую запись; `empty` — при пустом списке данных.
- **Только выбор.** Группа не выбирает ARIA-роль и клавиатурный паттерн: вкладки, флажки, опции,
  радио и toggle-кнопки устроены по-разному. ВГ-1 предлагает отдавать готовые бэги по явно
  названному паттерну — это не отменяет правило, а делает его исполнимым.
- **Не для `MChip`.** `MChip` внутри чужого `MSelectionGroup` не регистрируется — у чипов свой
  контекст (`chip-group/index.md`). Пример документации, где группа рисует `MChip type="assist"` с
  `:model-value` (`../docs/app/pages/components/selection-group.vue:9-22`), показывает выбор без
  `aria-pressed`, роли группы и имени — переписать (DC-01, DC-04, задача в репозитории `docs`).

Меняется:

- **Атрибуты потребителя (EN-04, FM-07).** Фрагментный корень роняет `class`, `id`, `aria-label` с
  предупреждением Vue. `defineOptions({ inheritAttrs: false })` и `attrs` в scope слота по
  умолчанию: потребитель кладёт их на свою обёртку (`v-bind="attrs"`) вместе с ролью группы.

Открытые пункты аудита → шаги: EN-04, FM-07 → шаг 1; A11-06 → ВГ-1 / шаг 2; IN-09 → ВГ-2; A11-08 →
ВГ-3; CT-08 (1000+ элементов) → шаг 4; DC-01, DC-04 → шаг 3. TS-01…TS-03 (stories) — в ките нет
Storybook, роль играют фикстуры playground; TS-04, TS-05 → «Тесты».

## API

Типы прежние:

```ts
type ItemValueResolver<TItem, TValue> = keyof TItem | ((item: TItem, index: number) => TValue)
type ItemDisabledResolver<TItem> = keyof TItem | ((item: TItem, index: number) => boolean)
type ItemKeyResolver<TItem> = keyof TItem | ((item: TItem, index: number) => PropertyKey)

interface MSelectionGroupProps<TItem, TValue = TItem> {
  items?: readonly TItem[]
  modelValue?: TValue | TValue[]
  itemValue?: ItemValueResolver<TItem, TValue>
  itemDisabled?: ItemDisabledResolver<TItem>
  itemKey?: ItemKeyResolver<TItem>
  multiple?: boolean
  mandatory?: boolean | 'force'
  disabled?: boolean
  max?: number
  valueComparator?: (left: TValue, right: TValue) => boolean
}
```

Generic-поток `items → itemValue → modelValue → #item` сохраняется; фасад `MSelectionContext<TValue>`
(`context.ts:81-98`) не меняется.

Добавить (без ломки):

| Что | Тип | Зачем |
|---|---|---|
| `attrs` в scope `#default` | `Record<string, unknown>` (`$attrs`) | EN-04, FM-07 |
| `groupAttrs` в scope `#default`, `attrs` в scope `#item` и `MSelectionItem` | бэги по ВГ-1 | A11-06 |
| `readonly` | по ВГ-2 | IN-09 |

Прежний план объявлял событие `change`; в коде его нет (`index.vue` эмитит только
`update:modelValue`). Не вводится без заказчика — `v-model` достаточно.

## План работ

1. **S** — `inheritAttrs: false` и `attrs` в scope слота по умолчанию; тип `SelectionGroupSlot`
   расширяется. Без видимых изменений. Файлы: `selection-group/index.vue`,
   `composables/selection/context.ts`, `selection-group/index.spec.ts`.
2. **M** — Бэги доступности по ВГ-1: `groupAttrs` и `attrs` элемента по названному паттерну,
   спека «без `class` и `data-*` в выхлопе» как у control-композаблов. Файлы:
   `composables/selection/*`, `selection-group/index.vue`, `selection-item/index.vue`,
   `fragments/selection-group/data-item.vue`.
3. **S** — Документация (репозиторий `docs`): пример на своих карточках с `role="radiogroup"` /
   `aria-checked` или toggle-кнопках с `aria-pressed`; раздел «когда `MSelectionGroup`, а когда
   `MChipGroup` / `MRadioGroup` / segmented»; раздел доступности.
4. **S** — Нагрузка: фикстура на 1000 элементов, замер `selected` и реконсиляции (CT-08).
5. **S** — Тесты.

Переиспользование: движок выбора connected `MButtonGroup` и segmented
([button/segmented.md](../button/segmented.md), шаг 2) строится на
`useSelectionGroup`, как уже сделал `MChipGroup`, — не третий реестр (`behavior.md`: один
контроллер на паттерн).

## Тесты

Есть (`selection-group/index.spec.ts`): пресет single, замена в single, накопление в multiple,
`mandatory`, блок по `max`, disabled-причина, `#empty`, ручной `MSelectionItem`, ошибка без группы,
общий фасад для своего ребёнка.

Добавить:

- unit: `attrs` в scope и отсутствие предупреждения Vue «Extraneous non-props attributes»; бэги по
  ВГ-1 для каждого паттерна (single / multiple, disabled, блок по `max` → `aria-disabled`);
  keyed-перестановка без потери выбора; `mandatory: 'force'` при удалении выбранного; изоляция
  контекста в SSR.
- e2e: фикстура `playground/fixtures/selection-group/matrix.vue` с эталонной разметкой (карточки
  `radiogroup`, toggle-кнопки), axe; 1000 элементов — время выбора.
- types (`vue-tsc`): вывод `TItem` / `TValue` для объектов и примитивов.

## Готово, когда

- [ ] `class`, `id`, `aria-*` потребителя доезжают до его обёртки без предупреждения Vue.
- [ ] Бэги доступности (по ВГ-1) покрыты спекой и не несут классов и `data-*`.
- [ ] Пример документации проходит axe; описано, когда брать группу, а когда специализированный компонент.
- [ ] Прежние тесты и generic-вывод типов — зелёные.

## Предложения по UX

1. **«Выбрать все» с трёхсостоянием.** Готовый бэг для управляющего флажка группы:
   `aria-checked` = `true` / `false` / `mixed` из `isAllSelected` / `isMixed` и `toggleAll` на клик —
   связывается с `indeterminate` флажка (ЧВ-1 в
   [checkbox.md](checkbox.md)). Пользователь получает привычный
   заголовок таблицы. Заказчик: таблица с выбором строк. Цена: S, одна проекция в слоте.
   Рекомендация: брать вместе с ЧВ-1.
2. **Выбор диапазона Shift+клик.** `selectRange(from, to)` в фасаде: в multiple Shift+клик выбирает
   всё между последним и текущим. Заказчик: списки файлов, таблицы. Цена: M, порядок берётся из
   данных (`decisions.md`: порядок для клавиатуры — из данных, а не из реестра). Рекомендация: при
   первом заказчике.
3. **Объявление лимита.** Когда `selectionLimitReached` становится `true`, потребитель показывает
   «Можно выбрать не больше 3»; группа отдаёт готовый `id` для `aria-describedby` невыбранных
   элементов. Заказчик: фильтры с лимитом. Цена: S. Рекомендация: брать вместе с ВГ-1.

## Открытые вопросы

**ВГ-1. Отдаёт ли группа готовые атрибуты доступности.**

Прежнее решение: «группа управляет только выбором, роль и `aria-*` ставит потребитель». Аудит
(A11-06, FM-07) показывает, что потребитель этого не делает — включая пример в документации.

1. Оставить как есть; закрыть документацией и axe-тестом на примерах. Цена: каждый потребитель
   повторяет одну и ту же проводку и ошибается.
2. Необязательный проп паттерна (`pattern: 'toggle' | 'radio' | 'checkbox' | 'option'`; имя — при
   реализации, `mode` и `type` заняты, `axes.md`): группа отдаёт `groupAttrs` (`role="group"` /
   `radiogroup` / `listbox`, `aria-multiselectable`, `aria-disabled`), элемент — `attrs` (`role`,
   `aria-pressed` / `aria-checked` / `aria-selected`, `aria-disabled` при блоке). Без пропа — как
   сегодня. Это бэги по образцу `useSliderControl`, без классов.
3. То же, что 2, но паттерн обязателен. Цена: ломающее изменение для всех текущих вызовов.

Рекомендация: 2.

**ВГ-2. Read-only (IN-09).**

1. `readonly`: `select` / `unselect` / `toggle` — no-op, `isReadonly` в слотах; вид решает
   потребитель. Цена: ещё одно состояние в слоте, а `aria-readonly` у `role=group` недопустим —
   объявлять придётся на элементах.
2. Не вводить, пока нет заказчика (`principles.md`, В4) — как ГВ-5 у `MChipGroup`. Условие
   возврата — экран просмотра выбора без права менять.

Рекомендация: 2.

**ВГ-3. Roving tabindex и стрелки (A11-08).**

Составная группа (карточки, плитки) сегодня — N Tab-остановок. `MChipGroup`, вкладки, навигация и
меню держат по своему roving-коду.

1. Не в этой задаче: группа остаётся без фокуса; общий roving-композабл выносится отдельной задачей
   из `MChipGroup` и навигации (их планы уже требуют одного контроллера), а группа потом отдаёт его
   бэги по паттерну из ВГ-1.
2. Встроить roving прямо в группу сейчас. Цена: пятый roving-контроллер в ките до унификации.

Рекомендация: 1.
