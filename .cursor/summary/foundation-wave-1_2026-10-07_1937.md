# Волна 1 foundation: surface, system-bar, hotkey, lazy, virtual-scroll — 2026-10-07

Предыдущий шаг: `qa-fix-showcase-fields_2026-10-07_0100.md`.
Как делалось: пять агентов параллельно в общем рабочем дереве на ветке `feat/components-update-wave-1`
по общему брифу `.cursor/plans/feature/components-should-update/agent-brief.md`. Проверки прогнаны
основной сессией после возврата всех агентов.

## Решения (открытые вопросы планов)
- surface/1 (ось `tone`): нет — заказчика нет.
- surface/2 (hairline): оставлен `1rem` в карте компонента; системный токен `1px` противоречит запрету
  новых системных токенов — вынесено в вопросы владельцу.
- system-bar: содержимое разложено по слотам `prepend` / `default` / `append` — иначе нельзя дать
  иконкам 16 и тексту `label-small` одновременно без селектора по `.ui-icon`.
- system-bar/safe-area: не в компоненте — отступ в одной полосе ломает геометрию зоны; место — `carve.ts`.
- hotkey/имена клавиш: перевод через `provideHotkeyLabels` (одна точка на приложение), без пропа.
- hotkey/платформа на сервере: `Sec-CH-UA-Platform`, затем `User-Agent`; неизвестная — невидимый
  резервный слой с формой Windows.
- lazy/1 (фокус при `once=false`): не размонтировать, пока фокус внутри.
- lazy/`fallbackDelay`: свой таймер, а не `timeout` у Suspense — тот работает только при повторной
  приостановке.
- virtual-scroll: геометрия в бэгах — инлайн `style` на логических свойствах; поддержана только
  стандартная модель RTL `scrollLeft`.

## Что сделано
- **surface**: все пути `g()` точечные, пресеты генерируются `@each` по карте, хардкоды `on-surface` и
  `none` в карте, дубль `background-color` убран, `overflow-wrap: break-word`, dev-warning на `@click`
  без роли (`composables/surface/useSurfaceClickWarning.ts`).
- **system-bar**: точечные пути и `spacing(8)`, `min-height`, текст в одну строку с многоточием,
  слоты `prepend`/`append` с иконками 16 через `font-size`, `min-width: 0` на корне (иначе в grid-родителе
  текст раздувал колонку), forced colors, `propsFactory`.
- **hotkey + useHotkey**: одна `normalizeKey` в `format.ts`, `ariaKeyShortcuts`, `aria-disabled`,
  английские имена клавиш в `MESSAGES.hotkeyKeys` + `provideHotkeyLabels`, платформа из заголовков
  запроса, нажатие тоном через `::before`, forced colors, верхний слой (модальный диалог глушит фон),
  реестр создаётся только в браузере; новые `useHotkeyPlatform`, `useHotkeyLabels`, `useHotkeyPresentation`.
- **lazy**: машина состояний `composables/lazy/lazyMachine.ts`, control-композабл `useLazyControl.ts`,
  общий IntersectionObserver `useLazyIntersection.ts` вместо VueUse, `aria-busy`, постоянный
  `role="alert"` с кнопкой повтора, активация с клавиатуры, фокус при `once=false`, fade без сдвига,
  `fallbackDelay` 200, типы в `props.ts`.
- **virtual-scroll**: план переписан по шаблону; исправлены `settling`, перебивание прокрутки
  пользователем, утечка `useRaf`, перемер после `enabled`; `utils/viewport/logicalScroll.ts` для RTL;
  типы в `types.ts`; бэги `spacerAttrs` / `getItemAttrs`.

## Закрытые пункты аудита
JSON аудита в этом чекауте нет. По отчётам агентов: surface TK-01, TH-04 (были закрыты); system-bar
TK-02, CT-01/03/05/06, EN-09, TS-07, LY-09/A11-13 (были закрыты в `carve.ts`); hotkey CT-13 (частично,
см. вопросы), MO-04, EN-05, TH-04; lazy FM-12, DT-02, DT-04, DT-09/A11-06, A11-07/A11-15, MO-04, EN-05,
EN-10, DT-11, TK-02.

## Тесты и гейты
- lint — 0 ошибок (7 старых предупреждений `any` вне волны).
- lint:style — 0.
- lint:scss — 104 стиля, 0 депрекаций; одна старая нерезолвящаяся строка в чужом time-picker.
- typecheck — 0 (агенты оставили 6 ошибок типов, исправлены основной сессией).
- vitest — 117 файлов, 1436 тестов, все прошли.
- e2e по пяти фикстурам — 93/93. Первый прогон: 5 падений — 4 у system-bar (переполнение в grid,
  исправлено `min-width: 0`), 1 у hotkey (тест подменял UA через `route.continue`, сервер его не
  видел; переписано на `route.fetch` + `route.fulfill`).
- build — не запускался.

## Проверить глазами
CSS ни в одной фикстуре не смотрелся в браузере. Ширины 360 и 1366, светлая и тёмная тема, `?dir=rtl`.
- `/surface/matrix`, `/surface/stress`: линия outlined на 360; тень elevated в тёмной теме;
  `extra-large-top`; перенос URL внутри поверхности.
- `/system-bar/matrix`, `/system-bar/stress`, `/system-bar/layout`: высота 24, иконки 16, многоточие на
  360, `append` слева в rtl, стык с app bar.
- `/hotkey/matrix`, `/hotkey/stress`: глиф «↑» для всех написаний, тон нажатия при удержании Ctrl,
  перенос в узком контейнере, порядок клавиш в rtl.
- `/lazy/matrix`, `/lazy/stress`: блок ошибки, кольцо фокуса на корне-активаторе, fade появления,
  высота без скачка.
- `/virtual-scroll/matrix`, `/virtual-scroll/stress`: строки без зазоров, rtl по горизонтали.

## Ломающие изменения и миграция
- system-bar: содержимое `default` — одна строка текста; иконки переносить в `#prepend`/`#append`.
- hotkey: `normalizeKeyToken`/`normalizeEventKey` → `normalizeKey`; новая сигнатура `buildDisplayKeys`
  и `buildAriaLabel`; `detectPlatform` переехал в `useHotkeyPlatform.ts`; `pressedState`/`pressedKeys` →
  `isKeyHeld`; DOM: клавиши в `.ui-hotkey__combo`; пока открыт модальный диалог, сочетания страницы молчат.
- lazy: `transition` стал `boolean`; типы импортируются из `props.ts`; `__boundary` удалён; в
  `on-interaction` корень — кнопка; без `#error` рисуется встроенный блок.
- virtual-scroll: типы в `composables/virtual-scroll/types.ts`; `scrollTo*` всегда разрешаются.
- Потребителей этих API внутри кита нет (по поиску агентов).

## Открытые вопросы для лида
1. Ширина обводки outlined-компонентов: `1rem` в картах (рекомендация) / системный токен `1px` / `max(1px, 1rem)`.
2. Safe-area прибитых зон: в `carve.ts` для первой зоны у края (рекомендация) / отдельный размер в `useLayoutItem`.
3. CT-13: английский запасной вариант имён клавиш (`MESSAGES.hotkeyKeys`) оставить сейчас (рекомендация) /
   убрать с dev-warning / ждать источника сообщений приложения.
4. Порядок клавиш hotkey в RTL: зеркалить / `direction: ltr` на сочетании (рекомендация, гипотеза).
5. Имя корня-активатора lazy без текста: `aria-label` на MLazy / проп `activatorLabel` (рекомендация).
6. `itemSize` в virtual-scroll в px или rem; `initialOffset` прокручивает контейнер (рекомендация) или нет;
   `geometry.ts` из автоимпорта в `utils/` (рекомендация).

## Риски и долги
- Чужие баги: `fragments/time-picker/dial/index.vue` — путь `selector-transition-duration` не рендерится;
  `banner/index.vue:259` стилизует `.ui-icon`; `useStack.ts` — модульный `let uid` на сервере;
  `useTimer.ts` — `setInterval` 100 мс на каждый активный таймер; MBanner — порядок CSS с `.ui-surface`
  (гипотеза).
- Слоты system-bar изменили раздел API плана — план обновлён агентом.
- dev-предупреждения (surface, lazy) не покрыты юнитами: в Vitest `import.meta.dev === false`.
