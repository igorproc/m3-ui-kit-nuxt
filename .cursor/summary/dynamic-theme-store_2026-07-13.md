# Dynamic theme store — 2026-07-13

## Проблема
`app/store/theme.ts` был перегружен валидацией по словарям (`allowedDefinitions/Contrasts/Palettes` + `includes`). Палитра держалась в куке как простой ключ, `definition` — только `light|dark`. Нужна была динамика: system-тема и произвольный HEX-цвет с SSR-инжектом.

## Что сделано (kit only)
- **Убрана вся dictionary-валидация** в сторе. Геттеры доверяют куке, при пустой — конфиг-дефолт.
- **`definition: light | dark | system`**. Раздельные рефы:
  - `definition` — writable, персистится (обратно совместимо: `store.definition = 'dark'` работает).
  - `resolvedDefinition` — readonly `light|dark`, идёт в `data-definition`.
  - `systemDefinition` — из VueUse `usePreferredColorScheme` (вызван один раз, не в геттере).
  - `definitionState` — `{ type, forSystem }` (объектный вид).
  - Гашение system-FOUC на SSR — забота потребителя (по решению владельца).
- **Динамическая палитра**. Кука теперь `{ isCustom, key }` (`IPaletteCookie`), строки из старых кук нормализуются.
  - `isCustom:false` → `key` = ключ пресета, селектор с билда.
  - `isCustom:true` → `key` = HEX; схема генерится в рантайме, SCSS инжектится через `useHead({ style })` под `data-palette="_custom"` (SSR + реактивно на клиенте). `setCustomColor(hex)`.
  - Экспорт: `palette` (writable key), `resolvedPalette` (data-palette), `isCustomPalette`, `customColor`, `currentTheme` (undefined для custom).
- **Единый генератор SCSS** — `shared/utils/themeScss.ts` (`schemeToTokens`, `buildThemeBlocks`). Модуль `app/modules/kit/module.ts` теперь зовёт его вместо inline `getTokens` (дедуп с рантаймом стора).
- **Конфиг-дефолты** в `MaterialKitOptions`: `defaultDefinition` (built-in `'dark'`), `defaultPalette` (fallback на deprecated `defaultTheme`), `defaultContrast`.
- Константы: `THEME_DEFINITIONS.SYSTEM`, `CUSTOM_PALETTE_KEY='_custom'`, `FALLBACK_PALETTE_KEY='_m3-fallback'`.

## Побочки / заметки
- `@material/material-color-utilities` теперь в клиентском бандле (нужно для рантайм-генерации custom-палитры) — приемлемо ради color picker.
- docs НЕ трогал; обратная совместимость экспортов сохранена, `DocsHeader.vue` продолжит работать. UI для custom-цвета/system в docs — отдельная задача.
- `themes/*.scss` уже содержал только `_m3-fallback` — менять не потребовалось.
- Lint changed files: 0 errors.

## TODO next
- docs: UI выбора custom HEX (через `MColorPicker` + `setCustomColor`) и переключатель `system`.
- Прогнать полный `npm run lint` / typecheck и визуальную проверку dev-сервером.
