# Vuetify-run discussion and documentation summary

Этот файл — рабочая точка продолжения инициативы. Он фиксирует, как обсуждать компоненты в чате, как переносить решения в `.md`, что уже принято и какие планы ещё не обсуждены.

## Цель

Закрыть полезную component-capability дельту с Vuetify, не копируя его API механически. Каждый результат остаётся PrimeTime-first, M3-like, Nuxt 4 и использует существующие компоненты/contexts/composables kit.

Обсуждение всегда идёт:

```text
реальная пользовательская проблема
→ ожидаемый UX
→ удобный Vue/Nuxt DX
→ reuse существующего kit
→ props/models/emits/slots/context
→ lifecycle/a11y/SSR/M3
→ подробный implementation plan
```

## Формат ответа в чате

Пользователь попросил среднюю детализацию: не одно короткое утверждение, но и не полный текст будущего `.md`.

Для каждого компонента ответ обычно содержит:

1. Суть и проблему компонента.
2. Короткую схему композиции/reuse.
3. Основной пример использования.
4. Предлагаемый Props/defineModel/Slots/Context contract без исчерпывающего JSDoc.
5. Ключевые UX/a11y/lifecycle решения.
6. Только действительно спорные вопросы.

Не выгружать в чат все edge cases/tests/SCSS branches — они пишутся в plan. Если пользователь уточняет решение, сначала ответить по сути, затем после согласия обновить `.md` и перейти дальше.

Рабочий цикл:

```text
обсудить один component/family
→ получить решение/корректировку
→ подробно записать все сведения в .md
→ добавить/update session summary
→ перейти к следующему roadmap item
```

## Требования к записи `.md`

План — долговечная самодостаточная implementation specification, а не конспект чата. Реализатор не должен восстанавливать решения из conversation history.

Каждый parent и private child содержит применимые блоки:

- identity/status/phase/public vs sub;
- problem и user jobs;
- solution/non-goals;
- concrete models через `defineModel`;
- Props/Emits/Slots/expose;
- context/ticket/registration contracts;
- flows/state machine;
- reactivity/lifecycle и `onScopeDispose`;
- reuse существующих M-components/composables;
- keyboard/focus/a11y/SSR;
- M3 UX и nested SCSS `$tokens` map;
- edge cases/diagnostics;
- detailed tests;
- done/questions/review gates.

Private child нельзя сокращать до «использует context родителя». Он обязан описать свою часть context API, lifecycle и behavior самостоятельно.

## Общие принятые архитектурные правила

### Models

- Vue models объявляются через `defineModel`; не дублировать ручные `update:modelValue`, `update:open`, `update:search`, `update:focused` emits.
- Draft/display/internal runtime state не вытекает в model без продуктовой причины.
- Application model не загрязняется UI runtime entries/status objects.

### Reuse

- Сначала public M-component, затем existing composable/context/registry, затем private leaf, и только потом новый primitive.
- Field wrappers используют `MTextField` напрямую, если это действительно надстройка.
- Controls/actions используют `MButton/MButtonIcon`; whole-control slots оборачивают безопасные defaults.
- Overlay consumers используют общий `MOverlay/MDialog/$modals`; не создают teleport/z-index/focus systems.
- Widget-local arrows/Home/End работают только при focus и не используют global `useHotkey`.

### Context и lifecycle

- Parent family предоставляет typed master-context через `createContext/createTrinity`.
- Participants inject/register role tickets, если family требует presence/order/capabilities.
- Registration cleanup только через `onScopeDispose`, не прямой `onUnmounted`.
- View ticket и business/runtime task разделяются: исчезновение renderer не обязано отменять задачу.
- Новый Pinia store запрещён без отдельного human approval.

### SCSS/M3

- Каждый visual component/leaf имеет co-located nested `$tokens` map.
- SFC получает значения через `material-map()` и `g()`.
- 1rem = 1px макета в design scale.
- Не копировать tokens reused MButton/MTextField/MProgress/etc.
- Нет literal component colors/sizes/state values и runtime CSS variables для component states.
- Все компоненты M3-like по appearance, state layers, motion, shape, typography и accessibility.

### Slots

- Default rendering полноценное и доступное.
- Whole-control slot получает safe props/actions; consumer при полной замене отвечает за semantics/a11y.
- Content slot не заменяет semantic root, если это может сломать listbox/button/option behavior.
- Default slot не меняет смысл в зависимости от props; per-item используется отдельный named slot.

### Review gates и pending

- `MColorInput` обязательно повторно обсуждается перед реализацией; автономный режим его пропускает, а не додумывает.
- Validation, hover/focus и DatePickerMonths находятся в pending directory и не считаются утверждёнными.
- Pending решение нельзя реализовать автономно как будто оно принято.

## Обязательное реформатирование файлов

До завершения инициативы:

- plain component без children/одномысленных leaves остаётся `<component>.md`;
- family parent → `<parent>/index.md`;
- children → `<parent>/<child>.md`;
- обновить roadmap/index/reuse-map и все relative links;
- унифицировать `feature/components-should-update` и `feature/pendind-components`;
- выполнить Markdown link/orphan audit.

File-upload и OTP уже переведены на новую структуру. Остальные families будут перемещены после обсуждения либо при их документировании.

## Уже обсуждено и записано

- Phase 1: App, Surface, Overlay/modals, Hotkey, Lazy, SelectionGroup; hover/focus и validation отложены.
- Phase 2 до ConfirmEdit включительно:
  - Autocomplete;
  - Dropdown/Combobox update;
  - Textarea;
  - NumberInput;
  - ColorInput review-gated;
  - ColorPicker + Canvas/Edit/Preview/Swatches through one typed master context;
  - FileInput;
  - FileUpload family;
  - OTP family;
  - Rating;
  - ConfirmEdit.

## Осталось обсудить: 0 планов

Порядок соответствует актуальному `roadmap.md`. Checkbox отмечается только после обсуждения с пользователем и переноса всех решений в соответствующий plan.

### Phase 3 — content and collections

- [x] [MAlert](alert.md)
- [x] [MAvatar](avatar.md)
- [x] [MBanner](banner/index.md)
- [x] [BannerActions](banner/actions.md)
- [x] [MBreadcrumbs](breadcrumbs/index.md)
- [x] [BreadcrumbsDivider](breadcrumbs/divider.md)
- [x] [BreadcrumbsItem](breadcrumbs/item.md)
- [x] [MChipGroup](chip-group/index.md)
- [x] [MListSubheader](list-subheader.md)

### Phase 4 — navigation, data and views

- [x] [MPagination](pagination.md)
- [x] [useVirtualScroll](virtual-scroll.md)

### Phase 5 — hierarchy and visualization

- [x] [MTimeline](timeline/index.md)
- [x] [TimelineDivider](timeline/divider.md)
- [x] [MTimelineItem](timeline/item.md)

## Обсуждение активного roadmap завершено

Все active plans обсуждены и имеют самодостаточные specifications. Это не
означает, что весь roadmap реализован: implementation state ведётся отдельно в
`<implementation-status>` каждого plan и агрегируется в `index.md`.

Срез на 2026-07-13: **10 done · 7 partial · 25 planned**. `useHover` по-прежнему
остаётся pending и не входит в текущую итерацию.

Все оставшиеся visualization plans перенесены в отдельный
[`paid-charts-plab`](../paid-charts-plab/index.md). Следующий шаг — финальный
cross-directory structure/link/orphan/status audit и консолидация итогового
индекса active/pending/low-priority/phases/paid work.
