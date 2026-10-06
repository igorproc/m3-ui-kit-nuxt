# QA-аудит: инфраструктура (фаза A) и подтверждённые баги (фаза B)

**Дата:** 2026-10-06
**Основа:** отчёт `.cursor/summary/runs/quality/index.html` (локальный, в `.git/info/exclude`),
план из сессии: фазы A (инфраструктура) → B (баги) → C (глобальные стили) → D (витрина: поля + кнопка).

## Решения пользователя

- Корневой `font-size: calc(1vw / f)` — фича кита. RS-04/05/06 из-за него — принятое отклонение.
- Тесты лежат рядом с кодом, корневой папки `tests/` нет.
- Браузерные тесты: Playwright + axe на фикстурах в `playground/`. Storybook отложен. Скриншотной
  регрессии нет.
- CI только на `main` (релизы) и `nightwatch` (экспериментальная ветка). Публикация по тегу
  через npm Trusted Publishing (OIDC).
- MConfirmEdit снят до переработки.
- Служебные скрипты лежат в `shell/`.

## Фаза A — инфраструктура

- `tests/*` разнесены к коду, `component-boundaries` превратился в `src/module.spec.ts`.
- `playground/` заменил корневое приложение: на нём работают `npm run dev`, окружение Vitest
  (`environmentOptions.nuxt.rootDir`) и e2e. Корневой tsconfig наследует `playground/.nuxt/tsconfig.json`,
  а `nuxt.d.ts` подключён через `files`, иначе `exclude` отрезает глобальные декларации авто-импортов.
- **Подсказки пропсов в IDE (жалоба пользователя):** mkdist собирал без лоадера `vue`, поэтому в `dist`
  не было деклараций SFC и TypeScript потребителя не видел пропсы. Теперь стоит `vue-tsc` и
  лоадеры `['js', 'vue']`: в `dist` появляются `index.d.vue.ts`, а скрипты SFC транспилируются в JS
  (TS вычищается и из шаблонов). Проверено голым `tsc` на `dist`: старая сборка давала
  `Cannot find module`, новая отвергает неверный `variant`.
- `vue-tsc` даёт 0 ошибок. По ходу нашлись дефекты публичных типов: `MChip.value` выводился как
  `undefined`, слоты MConfirmEdit не были объявлены, у generic-SFC типы props/emits не попадали в
  декларации (вынесены в `types.ts`/`props.ts`).
- CI: `.github/workflows/ci.yml` (checks + e2e на production-сборке), `release.yml`
  (vX.Y.Z → latest из main, vX.Y.Z-nightwatch.N → nightwatch, OIDC). Glob у stylelint взят в кавычки.
- e2e: `playground/fixtures/<component>/{matrix,stress}.vue + <component>.e2e.ts`, хелперы в
  `playground/e2e/support.ts`. Для button 12 тестов; толщина кольца фокуса и forced-colors помечены
  `test.fail` до шагов C6/C7.
- `build:module` удалён, `prepack` вызывает `npm run build`.

## Фаза B — баги

- `:deep()` в стилях без `scoped`. У icon правило ожило без визуальной разницы. У dropdown и
  autocomplete мёртвые правила удалены: при «оживлении» `top/right: 0` ломали бы позиционирование popover.
- `&:hover { &-state }` у date-picker и dialog/date: hover дня теперь работает.
- `lint:scss` падает на `:deep/:slotted/:global` вне `scoped` и на `:hover-suffix`.
- Slider: одна отправка `update:modelValue` на шаг, есть тест.
- Фокус-трап: `rememberFocus()` до `showModal()`, есть тест.

## Что дальше

Фаза C, шаги C1–C12 (токены state-layer, hover-миксин, sr-only, шкала отступов, скроллбары,
кольцо фокуса, forced-colors, color-scheme, reduced motion, тени, z-index, scroll-padding).
Затем фаза D: button, text-field, textarea, number-input, otp-input, dropdown, autocomplete.

## Риски и долги

- `useModal.spec` › «opens through the host and follows the status» один раз упал при полном прогоне
  и прошёл при повторе. Похоже на нестабильный тест под нагрузкой.
- docs_v2 после обновления кита сломается на MConfirmEdit (страницы и примеры) и на
  `--sys-elevation-level-2` (до C10).
- Локально e2e идут в один воркер: dev-сервер компилирует страницы при первом обращении.
