# Ревью де-Pinia рефактора + полная переработка документации

Дата: 2026-08-30. Ветка: `nightwatch`.

## Контекст

Сессия началась с независимого ревью незакоммиченного диффа (уход от Pinia: тема →
cookie-контроллер, viewport → `useState` + клиентский плагин, расширяемые брейкпоинты,
`restrict.customPalette`). По итогам ревью закрыты P0-пункты, затем целиком переписана
документация.

## Что нашли ревью

Направление рефактора верное, но он был не завершён: с уходом Pinia потерялись два её
свойства — синглтон и синхронная кросс-компонентная реактивность — и ничем не заменились.

Ключевые находки:

1. `useMaterialTheme()` не был синглтоном — каждый вызов создавал новый контроллер (~20
   computed) и свой `usePreferredColorScheme` (2 matchMedia-листенера). Кросс-компонентная
   реактивность держалась на `useCookie`-синхронизации Nuxt, которая на клиенте асинхронна
   (BroadcastChannel / cookieStore), а на сервере отсутствует вовсе.
2. Плагин `viewport.client` синхронизировал размер окна в теле плагина, то есть **до**
   `app.mount()` → гидрационный mismatch на всём, что зависит от ширины. До рефактора
   VueUse `useWindowSize` обновлялся в `tryOnMounted`, то есть после гидрации — это был
   регресс.
3. Layer-модуль `app/modules/kit/module.ts` не регистрировал ни одного плагина кита. В
   `.nuxt/types/plugins.d.ts` не было ни `viewport.client`, ни `directives`, ни
   `vue-final-modal`. Тесты этого не ловили, потому что окружение vitest строилось на
   рукописном дубликате конфига, а не на `src/module.ts`.
4. `BreakpointFlags` был объявлен как `Record<BreakpointName, boolean> & Record<string,
   boolean>` — открытая index-signature гасила проверку опечаток. Живой пример:
   `confirm-edit/index.vue:99` читает `less.value.medium`, а брейкпоинта `medium` не
   существует, поэтому `presentation: 'auto'` никогда не давал `dialog`.

## Что сделано

**Синглтон темы** — `useMaterialTheme()` кеширует контроллер на `nuxtApp` (per-request на
сервере) и создаёт его в detached `effectScope(true)`. Detached-скоуп обязателен: иначе
`usePreferredColorScheme` привязался бы к скоупу первого вызвавшего компонента и умер бы
вместе с ним. Модульный кеш сознательно не используется — утёк бы между SSR-запросами.

**Гидрация** — первая синхронизация viewport перенесена на `app:suspense:resolve`,
подписки на `resize`/`orientationchange` остались немедленными.

**Layer-модуль удалён** — `app/` удалён целиком (playground в ките больше нет),
`nuxt.config.ts` сокращён с 78 строк до 26 и теперь подключает `resolve('./src/module')`.
Продублированные блоки (`components`, `imports`, `css`, `alias`, `build.transpile`,
`vite.css.preprocessorOptions`, `icon`) убраны — всё приходит из самого модуля. Побочный
эффект, ради которого это и делалось: окружение vitest теперь гоняет настоящий модуль
вместе с плагинами.

**Типизация брейкпоинтов** — из `BreakpointFlags` убрана открытая index-signature.
Опечатки ловятся компилятором, `KitBreakpointRegistry` получил смысл.

**Тест-гард** — `tests/component-boundaries.spec.ts` ассертил границу сканирования по
содержимому `nuxt.config.ts`. Инвариант не менялся, переехал его источник → ассерты
перенаправлены на `src/module.ts`.

## Документация

README сокращён с 456 до 196 строк и переписан под потребителя. Всё остальное разнесено по
`docs/`. Язык — английский (решение владельца).

- `docs/configuration.md` (новый) — все опции `materialKit`
- `docs/architecture.md` (новый) — токены, `g()`, цветовые роли, флюидная типографика,
  пайплайн темизации, viewport-слой
- `docs/layout.md` — переведён на английский, убраны ссылки на `/demo/*` (страницы жили в
  удалённом playground)
- `docs/contributing.md` (новый) — структура репозитория, конвенции, добавление компонента
- `docs/ROADMAP.md` — переведён, статусы проставлены по факту наличия кода
- `docs/token_mapping.md`, `docs/m3_token_migration.md` — удалены (документы про
  завершённую миграцию)

Что в старом README было неправдой: `materialKit.themes` вместо `theme.themes`,
`useThemeStore().setTheme()` (такого API нет), `@pinia/nuxt` и `@vee-validate/nuxt` в
`moduleDependencies`, `npm run test:e2e` и Playwright (нет ни скрипта, ни зависимости),
вся секция структуры проекта (`app/components`, `app/store/theme.ts`), «30+ компонентов»
при фактических 67 групп / ~90 публичных `.vue`.

## Проверено

- `npx vitest run` — 86/86 файлов, 674/674 теста
- `npx eslint .` — 0 errors, 11 warnings (преэкзистирующие `no-explicit-any` и jsdoc)
- `npx stylelint "src/**/*.{vue,css,scss}"` — чисто
- Все внутренние ссылки в markdown резолвятся (файлы + якоря)
- Примеры API в README сверены с реальными пропсами: `MCard.title/subtitle` + слот
  `actions`, `MButton.variant/color`, `MTextField.label/type`, экспорт `MColor`/`MVariant`

## Осталось

Из ревью не сделано (P1/P2): мёртвые опции `theme.default.variant` и `neutralChroma`
(объявлены в типах, рантаймом не читаются), типизация `PublicRuntimeConfig`, константа для
ключа `md:viewport` (сейчас захардкожен в двух файлах), коалесинг resize, вынос сортировки
брейкпоинтов из per-width computed, `textarea` мимо реестра `useGlobalListener`.

Открытые развилки: мёртвая зона `more`/`less` ровно на значении брейкпоинта; асинхронный
`setColorFromImage` ради выноса квантизатора из бандла; возврат билд-тайм генерации палитр
(MCU сейчас ~25–35 КБ gz в клиенте плюс построение схемы на гидрации); шим для старой формы
конфига.

`confirm-edit` намеренно не тронут — владелец увёл компонент на переработку. Закрытие
`BreakpointFlags` оставило там ошибку типов на строке 99 как маркер.
