# Аудит планов редизайна против кода (2026-10-23)

Read-only агент сверил `.cursor/plans/feature/components-should-update/**` (85 планов) с `src/runtime` в
рабочем дереве (HEAD + WIP + sweep-run). Пять ключевых утверждений перепроверены по коду. Пометки:
«→ Bx/Qx» — уже в `.cursor/handoff/kit-bugs/questions.md`; «отм.» — отменено решением владельца;
«блок» — ждёт открытого вопроса плана или плана menu. DC-* (доки в docs_v2/v3) не учитывались.

**Итог: сделано 36, частично 32, не начато 17.** Не начаты волна 4 «выбор» из `roadmap.md`
(chip, checkbox, radio, switch, slider) и почти вся волна 5 (оверлеи, feedback). Теги в планах
устарели в обе стороны (9 навигационных `planned` частично сделаны sweep-run; search `done` — частично).

## Не начато / частично — главное по группам

| Группа | Компонент | Статус | Ключевое невыполненное | Объём |
|---|---|---|---|---|
| Выбор | checkbox | не начато | рамка по состояниям, `error.checked`, disabled ролями, мишень 48 + общий миксин контрола (`checkbox/_index.scss:10`); → B6.1, Q28, Q29 | L |
| Выбор | radio | не начато | **квадратное кольцо фокуса** (`radio/index.vue:151-173`), мишень 48, `name` без `path`; → B6.1d, Q28 | L |
| Выбор | switch | не начато | токены ручки focus/pressed, disabled-трек, мишень 48; иконки в ручке — блок ПВ-1; → B6.1b, B5.9d | L |
| Выбор | chip | не начато | **у отдельного filter-чипа нет `aria-pressed`** (`chip/index.vue:8`), 6 смесей `color-mix` вместо слоя `::before`; → B8.9 | L |
| Выбор | chip-group | не начато | литералы, `scroll-padding`/`overscroll-behavior` в прокрутке; → N.3, B8.9c/d | M |
| Выбор | **slider** | **не начато** | см. ниже | **L** |
| Выбор | rating | не начато | мёртвый `loading`, disabled через `opacity`, hover-превью у readonly; → B8.10 | M |
| Выбор | form-renderer | частично | нет `v-model`, `submit`/`invalid`, `aria-busy`, сводки ошибок, карты токенов, спеков; → B6.10 | L |
| Поля | autocomplete | частично | **асинхронные `items`: поле показывает id вместо заголовка до blur** (`useAutocomplete.ts:158`, watch только `:197-214`); → B6.3 | S (+L в блоках) |
| Поля | color-picker | частично | **образец не отмечается в hsl/hsla** (`fragments/color-picker/Swatches.vue:76-81`), нет мишени 48 у образцов | S |
| Поля | file-upload / file-input | частично | при пакетном отказе видна одна причина (`file-upload/index.vue:199-201`, `file-input:290`) | S |
| Поля | date-picker | частично | disabled-день через `opacity` (`date-picker/_parts.scss:146-148`); мишень 40/36 при e2e «48 target» (`date-picker.e2e.ts:46`) | S |
| Поля | time-picker | частично | циферблат не сжимается по высоте; PageUp/Down ±10 вместо ±5; период — свои `<button>` | S |
| Поля | search | частично | рецепт полноэкранного вида, демо без `items`; axe docked — `test.fail` (блок menu) | S–M |
| Поля | otp separator | частично | в disabled разделитель ярче ячеек (`otp-input/index.vue:266-269`) | S |
| Навигация | tabs | частично | **`flex: 1` без `min-width: 0`, 48 у «иконка+подпись»** (`tabs/tab/index.vue:90`) — индикатор наезжает на подпись; нет pressed; indicator по содержимому | L |
| Навигация | navigation-rail | частично | **список не прокручивается** (`overflow: hidden`, `navigation-rail/index.vue:203-219`), пункт на абсолютных координатах, `transition: all`, RTL-стрелки | L |
| Навигация | navigation-bar | частично | высота 80 вместо 64, цвета иконки/подписи, кольцо на пункте, физический бейдж, `activeIcon` | M–L |
| Навигация | app-bar | частично | шрифты medium/large, перенос заголовка в 2 строки, ландмарк | M |
| Навигация | toolbar | частично | docked 80 и мёртвая ветка `with-fab`, `floating|docked`; → B5.6d | M |
| Навигация | pagination, breadcrumbs | частично | `tabular-nums`, вес текущей, мишень 48, перенос/маска крошек | S, S–M |
| Навигация | navigation-drawer | частично | `surface-container-low`, ширина, safe-area, reduced motion | S–M |
| Оверлеи | dialog | не начато | **`surface` вместо `surface-container-high`** (`dialog/_index.scss:19`), ритм 16/16/24, `wrap-reverse` действий, логические margin; fullscreen — блок | M |
| Оверлеи | sheet | не начато | токены, safe-area, свайп по скорости; side sheet — блок | M |
| Оверлеи | tooltip | не начато | 40×24, пустой `text` открывает, Esc-слушатель всегда, один тултип за раз, `v-model:open`; → Q19 | M |
| Оверлеи | overlay / modals | частично | `ModalDismissReason`, пресеты `confirm`/`alert` (после Q17) | M |
| Оверлеи | menu | блок | `appear`-дефект (`menu/index.vue:22-27`), `z-index: 999`; → Q13–16, Q26 | блок |
| Feedback | snackbar | не начато | **нет `duration` и паузы, кнопки закрытия** (`snackbar/props.ts`); удалить `trapFocus`; → B4.9 | L |
| Feedback | progress | не начато | зазор 4 и stop indicator, `max`/`valueText`, `NaN` не зажимается (`useProgress.ts:68-70`) | M |
| Feedback | badge | не начато | размещение BadgedBox (у nav-bar/rail свои физические смещения), многоточие | M |
| Feedback | alert, banner, loading | частично | иконка тяжести по умолчанию, переходы появления, contained loading | M, M, S |
| Данные | list | частично | заглушка картинки строки (`list/item/index.vue:249-254`) | S |
| Foundation | icon | частично | `filled` у активных пунктов навигации/чипов (решение за владельцем) | M |
| Foundation | layout | частично | safe-area у боковых зон (`carve.ts:117-121`); одобренные алиасы классов окна и `container` у `m-container` | M |

Сделано целиком: button-family (кроме отложенной group), text-field, textarea, number-input, otp-input,
confirm-edit, file-input, file-upload parts, color-picker canvas/edit/preview, card, divider,
expansion-panel, list-subheader, avatar, timeline, app, surface, system-bar, hotkey, lazy, virtual-scroll.

Системный слой (`common.md`): S6 emphasized-типографика — не сделано; **S8 мишень 48 — только у MButton,
общего миксина нет**; S9 общая ветка `selected` — не сделано.

## Slider (`form/slider.md`) — не начато, L

Последний коммит в компоненте — 2026-10-06, до плана. Поведенческий слой (`createSlider` →
`useSliderControl`) есть и покрыт 25 unit-кейсами; презентация — baseline 2022.

| Шаг | Что предлагает план | Чего нет | Объём |
|---|---|---|---|
| 1 | имя и атрибуты | `<label>` без `for`, стиль подписи на несуществующем `.ui-slider-root__label`, английские «start/end», нет `role="group"` у range (→ N.9) | S |
| 2 | композабл | RTL (`useSliderControl.ts:129-135`, `:247` → B5.9b), физический `left`, `touch-action: none`, centered-режим (СЛ-2) | M |
| 3 | презентация Expressive | трек из сегментов с зазором 6 и углами 2, ручка-полоска 4×44, stop indicator, тики 4 по ролям, disabled ролями, длительности на токенах; `MSlider` не берёт `rangeAttrs` | L |
| 4 | value indicator | капсула вместо капли, показ на нажатии/клавиатуре (сейчас на hover — против WCAG 1.4.13), Esc, `format`/`#value`/`aria-valuetext` (→ N.9) | M |
| 5 | density + иконка | нет `density`, `#icon` (СЛ-1); план хочет `useResizeObserver` — **конфликт с «SSR first paint correct»** | M |
| 6 | поле формы | `path`, `required`, `aria-invalid` (СЛ-4) | M |
| 7 | тесты | нет `playground/fixtures/slider/` и e2e | M |

Развилки владельца (не отвечены): СЛ-1 соответствие density (рек.: default = XS, comfortable = M,
compact исключён); СЛ-2 centered (рек.: `origin: 'start' | 'center'`); СЛ-3 hover только курсор
(рек.: да, с записью в decisions.md об отходе от «5 состояний»); СЛ-4 ползунок как поле формы
(рек.: `path` + `useField` + строка поддержки, как Q28 = Б).

## Найдено по ходу (решать владельцу)

- e2e `date-picker.e2e.ts:46` в названии обещает мишень 48, проверяет 40.
- Тег otp separator неверен (в matrix нет разделителя в disabled).
- API статуса у timeline item (`status: {tone, label}` → строка) изменён агентом прошлого прогона без подтверждения.
- Отказ от `stickyHeader` у MTable (m3-polish Q-9) не записан в `decisions.md`.
