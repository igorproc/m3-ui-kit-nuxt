# 💎 Переход на M3-like Token Format (Hybrid Approach)

Этот документ описывает финальную стратегию работы с токенами, которая сочетает чистоту вложенных структур и удобство плоского доступа.

---

## 📊 Оценка DX (Developer Experience)

### Текущее состояние (Nested Maps + `g()` helper)
```scss
// Определение (assets/stylesheet/components/badge/_index.scss)
$tokens: (
  text: (
    color: map.get($theme-color-link, on-error),
    typography: map.get($theme-typography-link, label, small),
  )
);

// Использование (components/ui/badge/index.vue)
.ui-badge {
  color: g($t, 'text-color');
  font-family: g($t, 'text-typography-font');
}
```

*   **Плюсы**:
    *   **Чистота определения**: Вложенные карты позволяют логически группировать токены (border, text, variants).
    *   **Скорость написания**: Функция `g()` позволяет обращаться к глубоким свойствам через дефис, не загромождая код множественными `map.get`.
    *   **Читаемость**: Код выглядит как обращение к обычным CSS-переменным, но сохраняет типизацию и связь с Sass-картой.

---

## 💡 Идеи и Улучшения

1.  **Функция `g($map, $path)`**:
    Универсальный помощник, который парсит строку пути (например, `'large-padding-inline'`) и рекурсивно извлекает значение из мапы.

2.  **Сохранение иерархии в Spec**:
    Мы можем описывать токены точно так же, как они описаны в Figma или официальном M3 Spec, сохраняя их вложенность, но обращаясь к ним плоско.

---

## 📜 Правила написания значений

### 1. Определение токенов
Описывайте токены во вложенных мапах для логической группировки:
```scss
$tokens: (
  container: (
    color: ...,
    shape: ...
  ),
  label: (
    text: (
      color: ...,
      font: ...
    )
  )
);
```

### 2. Доступ к значениям
Всегда используйте функцию `g($t, 'path-to-token')`:
*   `background-color: g($t, 'container-color');`
*   `font-size: g($t, 'label-text-font');`

### 3. Ссылки на Системные Токены
Продолжаем использовать `$theme-*-link` для связи с системными переменными.

---

## 🛠 Пример реализации (Badge)

### Стили компонента
```scss
.ui-badge {
  $prefix: 'm3-badge';
  $t: material-map(t.$tokens, $prefix);
  
  &.--variables {
    @include generate-tokens(t.$tokens, $prefix);
  }

  border-radius: g($t, 'border-radius');
  background-color: g($t, 'background-color');
  
  &--large {
    min-width: g($t, 'large-size');
    @include apply-typography(g($t, 'text-typography'));
  }
}
```

---

> [!TIP]
> Функция `g()` — это "синтаксический сахар", который делает работу с вложенными токенами такой же удобной, как с плоскими, сохраняя при этом все преимущества структурированного кода.
