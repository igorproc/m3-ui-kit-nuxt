# PrimeTime UI Kit Summary (MD3 Migration)

Этот документ описывает архитектуру, систему токенов и текущее состояние миграции UI-кита на систему Material Design 3 (MD3).

## 🚀 Обзор проекта
Проект представляет собой современную библиотеку UI-компонентов, построенную на **Nuxt 3**, с глубокой интеграцией **Material Design 3**. Основная цель текущего этапа — полная децентрализация стилей и переход на строгую систему токенов.

---

## 🏗 Архитектура стилей
Стили организованы в директории `assets/stylesheet/` с использованием SCSS и разделены на логические слои:

### 1. Abstracts (`/abstracts`)
*   `_variables.scss`: Глобальные технические переменные.
*   `_mixins.scss`: Основные инструменты, включая:
    *   `@mixin typescale($name)`: Управляет типографикой (font-size, line-height, weight).
    *   `@mixin desktop`, `@mixin tablet`: Адаптивные брейкпоинты.

### 2. Base (`/base`)
*   `_animations.scss`: Глобальные параметры анимаций (durations, easings) согласно MD3.
*   `_shapes.scss`: Системные скругления (`--sys-shape-corner-medium` и др.).
*   `_reset.scss`: Сброс базовых стилей браузера.

### 3. Themes (`/themes`)
*   `index.scss`: Центральный файл темы, определяющий системные цветовые токены (`--color-primary`, `--color-surface` и т.д.).
*   Шрифты по умолчанию:
    *   Display: `Google Sans`
    *   Text: `Google Sans Text`
    *   Mono: `Google Sans Mono`
    *   Symbols: `Google Symbols`

### 4. Components (`/components`)
Каждый компонент имеет свой файл токенов (например, `_button.scss`), который:
*   Описывает локальные переменные компонента через системные токены.
*   Использует флаг `!default` для возможности переопределения.

---

## 💎 Система токенов (Token Pattern)
Мы следуем строгому паттерну при написании стилей компонентов:

1.  **Локальный файл токенов**: `assets/stylesheet/components/_<name>.scss`
2.  **Использование в компоненте**:
    ```scss
    <style lang="scss">
    @use '~/assets/stylesheet/components/button' as v;

    .ui-button {
      background-color: v.$filled-bg;
      @include typescale(v.$label-text-type);
    }
    </style>
    ```
3.  **Состояния (Hover/Active)**: Реализуются через `color-mix`:
    ```scss
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    ```

---

## 📊 Статус миграции (Phases)

| Фаза | Группы компонентов | Статус |
| :--- | :--- | :--- |
| **1** | Базовые (Button, Card, Badge) | ✅ Завершено |
| **2** | Навигация (App Bar, Nav Bar, Drawer) | ✅ Завершено |
| **3** | Формы (Text Field, Checkbox, Slider) | ✅ Завершено |
| **4** | Действия (Chip, Menu, Tabs, Dropdown) | ✅ Завершено |
| **5** | Контент (Divider, Loading, Progress, Search) | ✅ Завершено |
| **6** | Оптимизация и Скелеты | 🔄 В процессе |

---

## 🛠 Инструментарий
*   **Vee-Validate**: Для валидации форм.
*   **Vue Final Modal**: Для модальных окон и слоев (Dialog, Sheet, Drawer).
*   **Iconify**: Для работы с иконками Google Symbols.
*   **Color-mix (CSS)**: Для динамического наложения стейт-лееров.

---

## 📝 Гайдлайны для разработчиков
1.  **Никакого хардкода**: Все значения (размеры, цвета, шрифты) должны быть вынесены в локальный SCSS файл токенов.
2.  **Типографика**: Использовать только `@include typescale(...)`.
3.  **Именование**: Локальные токены именуются через дефис (kebab-case) и импортируются как `v`.
4.  **Сетки**: В проекте активно используется `grid` для сложных анимаций (например, Expansion Panel).
