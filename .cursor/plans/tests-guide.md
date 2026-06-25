# Component Tests Guide (Phase D) — обязательный контракт для агентов

Цель: покрыть публичный контракт каждого UI-компонента юнит-тестами.

## Harness (как в репозитории — НЕ изобретай свой)
- Эталон: `tests/grid.spec.ts`. Используй **`mountSuspended`** из `@nuxt/test-utils/runtime`
  (env уже `nuxt` в `vitest.config.ts`). Компоненты импортируй относительным путём из `../app/components/ui/...`.
- Файлы тестов клади в `tests/<component>.spec.ts` (плоско, kebab-case; для под-папок — `tests/<parent>-<child>.spec.ts`).
- Запуск одного файла: `npm run test -- tests/<file>.spec.ts --run` (флаг `--run` = без watch).

## Что покрывать на каждый компонент (публичный контракт)
1. **Render**: монтируется без ошибок; корневой класс/тег присутствует; дефолтный слот рендерится.
2. **Props → выходной контракт**: ключевые пропсы дают ожидаемые классы/атрибуты
   (напр. `variant`/`color`/`size`/`disabled` → `ui-x--<variant>`, `ui-x--<color>`, `disabled`-атрибут).
   Используй НОВЫЕ имена (MD3: color primary|secondary|tertiary|error; chip/progress/loading `type`;
   divider `inset`; app-bar/toolbar `type`).
3. **v-model / emits**: где есть `defineModel`/emit — проверь, что взаимодействие эмитит/обновляет
   (напр. чекбокс toggle → `update:modelValue`; chip click; button click).
4. **a11y роли/атрибуты** (Phase C): проверь ключевые роли/aria, добавленные недавно
   (напр. tabs role="tab"+aria-selected; dropdown trigger role="combobox"+aria-expanded;
   table sort `<button>`+aria-sort; expansion aria-controls; dialog aria-labelledby;
   nav aria-current; icon-button aria-label).
5. **disabled**: disabled подавляет взаимодействие/класс.

## Правила
- Тесты ДЕТЕРМИНИРОВАНЫ и быстрые: не полагайся на реальный layout/позиционирование/анимации/таймеры
  (overlay-позиционирование menu/tooltip — НЕ проверяй пиксели; проверяй наличие ролей/атрибутов/эмитов).
- Overlay-компоненты (menu/dialog/dropdown/tooltip/snackbar) телепортируются в `#ui-overlay-host`.
  Для проверки контента используй `attachTo`/поиск в `document.body`, ИЛИ проверяй открытое состояние
  через эмиты/классы; если что-то нетестируемо в unit-среде — оставь TODO-коммент и покрой остальное.
- Не меняй исходники компонентов (только тесты). Если тест выявил баг — выпиши в отчёт, не правь сам.
- Каждый тест-файл должен ПРОХОДИТЬ: запусти `npm run test -- tests/<file>.spec.ts --run` и доведи до green.
- Не запускай dev-сервер. eslint на своих тест-файлах = 0 (`npx eslint tests/<file>.spec.ts`).

## Отчёт
- Список созданных тест-файлов + сколько тестов в каждом.
- Результат прогона (passed/total) по каждому файлу.
- Найденные баги в компонентах (file:line) — для отдельной правки.
