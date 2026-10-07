# MSelectionItem — renderless-элемент группы выбора

<identity>M3: нет в M3 (авторский поведенческий примитив; часть [MSelectionGroup](selection-group.md)) · Токены Compose: нет · Код: `src/runtime/components/ui/selection-item/index.vue`, логика `src/runtime/composables/selection/useSelectionItem.ts`, тип состояния `src/runtime/composables/selection/context.ts` (`SelectionItemState`) · Аудит: `data/selection-item.json` · Тип: public (renderless), дочерний к `MSelectionGroup`</identity>

<implementation-status state="planned" updated="2026-10-07">Компонент работает с 2026-07-13: регистрирует тикет в ближайшей группе, отдаёт состояние и действия слотом, снимается через `onScopeDispose`, без группы падает с понятной ошибкой. План 2026-10-07 добавляет только готовые атрибуты доступности — по решению ВГ-1 в [selection-group.md](selection-group.md). Код не менялся.</implementation-status>

## Вердикт

**авторский.** Аналога в M3 нет. Примитив делает ровно одно — подключает ручного ребёнка к общему
реестру — и делает это правильно: реактивные `value` / `disabled`, readonly-проекции, очистка через
scope. Единственный пробел аудита (A11-06): состояние — только булевы флаги, поэтому выбор легко
нарисовать без программного двойника (`aria-pressed` / `aria-checked`). Закрывается решением группы
ВГ-1, без ломки.

## Рендеры

Не применимо: renderless — ни DOM, ни стилей, ни обёртки. Вид элемента целиком принадлежит
потребителю (карточка, плитка, кнопка). Доски не заводятся.

## Анатомия

| № | Часть | Элемент кита | Статус |
|---|---|---|---|
| 1 | Тикет в реестре группы | `useSelectionItem` → `context.register()` (`useSelectionItem.ts:31-34`) | есть |
| 2 | Состояние для слота | `state: ComputedRef<SelectionItemState>` (`useSelectionItem.ts:38-47`) | есть |
| 3 | Очистка | `onScopeDispose(() => ticket.stop())` (`:36`) | есть |
| 4 | Атрибуты доступности | — | нет — ВГ-1 |

## Оси дизайна

Визуальных осей нет. Входы: `value: TValue` (реактивный), `disabled?: boolean`.

## Оси состояний

| Ось | Нужно | Есть | Не хватает |
|---|---|---|---|
| Базовое | enabled, disabled, заблокирован лимитом | `isDisabled`, `isSelectionBlocked`, `blockReason` | `aria-disabled` в готовом виде — ВГ-1 |
| Выбор | выбран / не выбран + действия | `isSelected`, `select`, `unselect`, `toggle` | `aria-pressed` / `aria-checked` / `aria-selected` по паттерну — ВГ-1 |
| Взаимодействие, фокус, ошибка | неприменимо: рисует и фокусирует потребитель | — | — |

## Токены: расхождения

Не применимо: компонент ничего не рисует.

## Поведение и доступность

Подтверждено прежним планом и остаётся:

- Инжектирует ближайший публичный фасад группы (`useSelectionContext`); без группы — ошибка с
  указанием `MSelectionGroup` (`context.ts:109-119`).
- `value` и `disabled` — реактивные входы тикета; выбранность и блокировка — readonly-проекции.
- Тикет живёт в текущем effect scope; снимается только через `onScopeDispose`, не `onUnmounted`.
- Не создаёт обёртку, не добавляет `click`, `tabindex`, клавиатуру, класс выбора.
- Ручной путь и путь из данных (`fragments/selection-group/data-item.vue`) используют один и тот же
  `useSelectionItem` — отдельной реализации выбора нет.

Меняется (по ВГ-1): в scope слота добавляется `attrs` — бэг по паттерну группы (`role`,
`aria-pressed` / `aria-checked` / `aria-selected`, `aria-disabled` при блоке). Без паттерна у группы
`attrs` пустой — поведение прежнее.

Открытые пункты аудита → шаги: A11-06 → шаг 1; DC-04 → шаг 2. TS-01…TS-03 (stories) — роль играют
фикстуры playground; TS-04, TS-05 → «Тесты».

## API

```ts
interface MSelectionItemProps<TValue> {
  value: TValue
  disabled?: boolean
}

interface MSelectionItemSlot<TValue> {
  value: TValue
  isSelected: boolean
  isDisabled: boolean
  isSelectionBlocked: boolean
  blockReason: 'disabled' | 'max' | null
  select: () => void
  unselect: () => void
  toggle: () => void
  attrs: Record<string, string | undefined> // новое, по ВГ-1
}
```

Ломающих изменений нет.

## План работ

1. **S** — `attrs` в `SelectionItemState` (вычисляется в `useSelectionItem` из паттерна группы),
   общий для ручного и data-driven пути. Зависит от ВГ-1 в [selection-group.md](selection-group.md),
   шаг 2. Файлы: `composables/selection/{context,useSelectionItem}.ts`, `selection-item/index.vue`.
2. **S** — Документация (репозиторий `docs`): раздел «Доступность» — какие `aria-*` биндить для
   toggle-кнопки, радио, флажка и опции списка и какую клавиатуру ожидать (DC-04).
3. **S** — Тесты.

## Тесты

Есть (в `selection-group/index.spec.ts`): регистрация и переключение, ошибка без группы.

Добавить (unit): обобщённый тип `value`; реактивная смена `value` без «утёкшей» регистрации;
`disabled` и блок по `max` в состоянии; снятие тикета при уничтожении scope (`v-if` вокруг
элемента); `attrs` для каждого паттерна ВГ-1 и пустой `attrs` без паттерна; бэг без `class` и
`data-*`.

## Готово, когда

- [ ] Слот отдаёт `attrs`, совпадающие с паттерном группы; без паттерна поведение прежнее.
- [ ] Ручной и data-driven путь отдают одно и то же состояние.
- [ ] Прежние тесты зелёные.

## Предложения по UX

1. **Элемент-ссылка.** Пример (без нового API), где выбираемая карточка ещё и ведёт на страницу:
   выбор — флажком внутри карточки, переход — ссылкой, два разных действия вместо одного
   перегруженного клика. Заказчик: каталоги с массовыми действиями. Цена: S, только документация.
   Рекомендация: брать в шаг 2.
2. **Режим выбора долгим нажатием.** На таче долгое нажатие на элемент включает режим выбора, дальше
   обычные тапы переключают (как в галереях Android); вне режима тап открывает элемент. Заказчик не
   назван. Цена: M, таймер и отмена по движению в общем композабле, состояние «режим выбора» у
   группы. Рекомендация: не делать до заказчика.

## Открытые вопросы

Своих нет: единственная развилка — ВГ-1 в [selection-group.md](selection-group.md) (отдаёт ли
группа готовые атрибуты), элемент следует её решению.
