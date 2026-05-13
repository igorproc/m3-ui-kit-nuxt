# Автоматизированный Layout

Система автоматизированного лейаута в PrimeTime UI Kit предназначена для динамического управления геометрией интерфейса (App Bar, Navigation Rail, UI Main и др.) без возникновения эффекта Cumulative Layout Shift (CLS).

Система построена на принципах **Material Design 3** и использует комбинацию Vue Injection API и нативных CSS-переменных с функцией `calc()`.

---

## 🏗 Архитектура

Архитектура системы разделена на два уровня: **Управляющий (Root)** и **Исполнительный (Item)**.

### 1. Управляющий уровень (`createLayout`)
Функция `createLayout` вызывается в корневом лейауте или компоненте. Она:
- Инициализирует реактивный реестр всех элементов лейаута.
- Предоставляет (`provide`) методы регистрации (`register`, `unregister`).
- Вычисляет глобальные CSS-переменные отступов.

**Глобальные токены:**
- `--ui-layout-top`: Суммарная высота всех верхних элементов.
- `--ui-layout-bottom`: Суммарная высота всех нижних элементов.
- `--ui-layout-left`: Суммарная ширина всех левых элементов.
- `--ui-layout-right`: Суммарная ширина всех правых элементов.

### 2. Исполнительный уровень (`useLayoutItem`)
Компоненты (например, `MAppBar` или `MNavigationRail`) используют этот композабл для:
- Саморегистрации в системе.
- Получения собственных стилей позиционирования и размеров.
- Учета приоритета (`order`) для правильного наложения элементов друг на друга.

---

## 🛠 Технические детали

### Композабл `useLayout`

Система находится в файле `app/composables/useLayout.ts`.

#### Регистрация элемента
При регистрации элемента указываются следующие параметры:
- `id`: Уникальный идентификатор.
- `position`: Позиция (`top`, `bottom`, `left`, `right`).
- `sizeToken`: CSS-переменная или значение размера (например, `var(--ui-nav-rail-width)`).
- `order`: Приоритет отрисовки (чем меньше число, тем «выше» приоритет при расчете отступов для других элементов).

#### Пример логики расчета
Если у нас есть `MAppBar` (top, order: 0) и `MNavigationRail` (left, order: 1), то:
1. `MAppBar` займет верхнюю часть экрана (top: 0).
2. `MNavigationRail` автоматически получит `top: var(--ui-app-bar-height)`, чтобы не перекрываться хедером.

---

## 🚀 Использование

### В корневом компоненте (`layouts/default.vue`)

```vue
<script setup lang="ts">
import { createLayout } from '~/app/composables/useLayout'

const { layoutStyles } = createLayout()
</script>

<template>
  <div class="ui-layout" :style="layoutStyles">
    <slot />
  </div>
</template>

<style lang="scss">
.ui-layout {
  position: relative;
  min-height: 100vh;
  // Контентная область автоматически подстраивается под лейаут
  padding-top: var(--ui-layout-top);
  padding-left: var(--ui-layout-left);
}
</style>
```

### В компоненте элемента (`components/ui/app-bar/index.vue`)

```vue
<script setup lang="ts">
import { useLayoutItem } from '~/app/composables/useLayout'

const { layoutItemStyles } = useLayoutItem({
  id: 'app-bar',
  position: 'top',
  sizeToken: 'var(--m-app-bar-height)',
  order: 0
})
</script>

<template>
  <header class="ui-app-bar" :style="layoutItemStyles">
    <slot />
  </header>
</template>
```

---

## 💎 Преимущества системы

1.  **Zero CLS**: Все расчеты происходят через CSS `calc()`. Даже если размер элемента изменится реактивно (например, Navigation Rail раскроется), браузер пересчитает геометрию мгновенно.
2.  **Децентрализация**: Компоненты ничего не знают друг о друге, они общаются только с центральным реестром.
3.  **Гибкость токенов**: В качестве `sizeToken` можно передавать CSS-переменные, которые сами меняются в зависимости от медиа-запросов.
4.  **Material 3 Ready**: Позволяет легко реализовывать сложные адаптивные паттерны (например, Side Sheets, Bottom App Bars).

---

## 📊 Справочник переменных

| Переменная | Описание | Применяется к |
| :--- | :--- | :--- |
| `--ui-layout-top` | Отступ сверху | `main`, `container` |
| `--ui-layout-bottom` | Отступ снизу | `main`, `fixed elements` |
| `--ui-layout-left` | Отступ слева | `main`, `rail`, `drawer` |
| `--ui-layout-right` | Отступ справа | `main`, `side sheet` |

---

> [!IMPORTANT]
> При использовании системы автоматизированного лейаута, всегда следите за уникальностью `id` и правильностью `order`. Элементы с меньшим `order` определяют отступы для элементов с большим `order`.
