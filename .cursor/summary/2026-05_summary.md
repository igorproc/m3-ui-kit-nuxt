# Дайджест — май 2026

Период: 2026-05-12 … 2026-05-29. Свёрнуто из 11 отчётов сессий.
Главные вехи месяца: рождение архитектуры **Zero-Runtime M3** (токен-мапы + `g()`),
переход префикса `ui-` → `m-`, первая версия auto-layout и линейка компонентов
(slider, progress, text-field, time-picker, toolbar).

## Оглавление
1. [Тема, префикс, иконки (05-12)](#1-тема-префикс-иконки)
2. [Auto-layout v1 и навигация (05-14)](#2-auto-layout-v1-и-навигация)
3. [Slider, shape morphing, loading (05-15)](#3-slider-shape-morphing-loading)
4. [Zero-Runtime M3: Button / Progress / Text Field (05-16…05-17)](#4-zero-runtime-m3)
5. [Motion, docs-dogfooding, time-picker, toolbar (05-21)](#5-motion-docs-time-picker-toolbar)
6. [Слайдер: props/emits + чистый state machine (05-29)](#6-слайдер-архитектура)

---

## 1. Тема, префикс, иконки
- **Централизация темы в Pinia** (`app/store/theme.ts`): вся логика темы (`useTheme`,
  `useThemeDefinition`, plugin) собрана в один setup-store с валидацией куки
  (`definition` light/dark, `contrast`, `palette`); `htmlAttrs` (`data-definition`,
  `data-pallet`) инжектятся через `useHead`.
- **Build-time SCSS вместо рантайма**: `@material/material-color-utilities` убран из
  клиентского бандла; модуль kit (`module.ts`) парсит темы на билде и генерит
  `material-kit-themes.scss`. Проблемный Vite `additionalData` заменён alias-инжектом
  (`~material-kit-config`, `~material-kit-themes`) — устранены циклы сборки.
- **Миграция префикса `ui-*` → `m-*`** авто-скриптом по `app/components/ui/**/*.vue`
  (только теги; CSS-классы `.ui-*` намеренно не тронуты).
- **Централизация иконок**: `shared/constants/icons.ts` с типизированным `ICONS`
  (`ic:outline-*`); хардкод-строки заменены в 7+ компонентах.

## 2. Auto-layout v1 и навигация
- **Движок `useLayout` (v1)**: компоненты саморегистрируются через `useLayoutItem`,
  размеры грида — через рантайм CSS-переменные (`--m3-layout-left-width`),
  семантический HTML5 (`header/aside/main/footer`), 3×3 грид.
- **Navigation Rail**: фикс `isExpanded` под проп `expanded` на десктопе, динамическая
  ширина (`--ui-navigation-rail-width[-expanded]`), адаптация индикатора
  collapsed/expanded.
- **App Bar**: `sticky` проп, корень → `div` (чтобы не вкладывать `<header>` в
  `<header>`), саморегистрация высоты.
- Фиксы: `ReferenceError` в `useBreakpoint` (импорт `DEFAULT_BREAKPOINTS`), `calc()`
  в `_app-bar.scss`; демо-страницы переведены на `<NuxtLayout>`. Z-index через `z($key)`:
  aside(40) < header(50) < dialog(100). Статус: STABLE.

## 3. Slider, shape morphing, loading
- **`UiShape`**: SVG-морфинг путей через `flubber`; 35 официальных M3-фигур из `shapes.ts`.
- **`UiLoading`**: экспрессивный вариант, циклический state machine по набору M3-фигур
  с M3-таймингами.
- **`UiSlider`**: continuous / discrete (тики) / range; двойные нативные
  `<input type=range>` через `opacity:0` + `clip-path`; M3-пин через повёрнутый
  `::before`; вертикальная ориентация (`rotate(-90deg)`) с корректным тултипом; state
  layers. Статус: STABLE.

## 4. Zero-Runtime M3
**Ключевая архитектура месяца.** Переход от рантайм CSS-переменных к статическому
паттерну «Declare & Pick»: токены объявляются в co-located `_index.scss` как вложенная
`$tokens`-мапа, `.vue` выбирает значения через `g($t, 'path')`.
- **Button (05-16)**: полностью мигрирован; все 5 M3-состояний × 5 вариантов;
  исправлен баг разбиения пути в `g()` (перестройка вложенности мапы); глобальный
  `m3-button-scheme()` в `abstracts/functions.scss`; протокол миграции задокументирован
  в `.cursor/rules/m3_architecture.md`; создан `docs/token_mapping.md`.
- **Progress (05-16)**: M3-слои для linear/circular, density small/medium/large;
  экспрессивные «волны» (синусоида для circular, квадратичный Безье для linear),
  непрерывный phase-shift; фиксы плейграунда доки (типы, vee-validate crash).
- **Text Field (05-17)**: миграция на токены; устранён CLS в outlined (резерв
  `padding-top`, фикс высоты 94px); реактивный отступ под prepend/append; полноценные
  error-состояния (`error`/`errorMessage` + vee-validate) через `--md-sys-color-error`;
  опциональный `path` (standalone-режим без варнингов).

## 5. Motion, docs, time-picker, toolbar
- **Navigation Rail**: item-логика вынесена в `<m-navigation-rail-item>`; expanded-режим
  (80rem→256rem) с плавным индикатором.
- **Expansion Panel**: фикс дёрганья анимации — внутренний `overflow:hidden`-враппер,
  анимация `grid-template-rows` 0fr→1fr.
- **Docs-dogfooding**: layout доки переведён на нативные kit-компоненты (`m-app-bar`,
  `m-text-field`, `m-navigation-rail/drawer`, `m-button tag=link`).
- **Time Picker** (`m-time-picker`): zero-runtime токены (`keyboard/`, `dial/`);
  двухкольцевой циферблат 24ч (внешнее 0–11, внутреннее 12–23); drag через глобальные
  window-листенеры + `atan2`/`hypot`, cleanup в `onUnmounted`; horizontal-вариант
  (landscape). TODO: ARIA на числа циферблата.
- **Toolbar** (`m-toolbar`): zero-runtime токены (standard/baseline, `color-mix`
  elevation); data-driven (`items`) + slot-driven; авто-выбор `MButton`/`MIconButton`;
  layout horizontal/vertical; API-метаданные для доки.

## 6. Слайдер: архитектура
- **Props/Emits вместо provide/inject**: slider переведён на презентационную архитектуру
  Vue 3 с композаблом-оркестратором. Атомы: `SliderRoot/Track/Range/Thumb/HiddenInput`.
  Кеш `getBoundingClientRect()` в начале drag → нет layout thrashing, 60fps. Вертикаль
  через поворот контейнера, дети остаются в горизонтальном layout.
- **`createSlider` → чистый state machine (05-29)**: старый `createSlider.vue` удалён;
  создан `createSlider.ts` — чистая математика (snap/fromPercent/updateValue) с JSDoc; все
  DOM-листенеры перенесены в компонент. Фиксы: vertical `dragOffset` (прибавлять, не
  вычитать), reactivity thrashing (эмит только при реальном изменении значения). STABLE.
