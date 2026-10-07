# ColorPickerPreview — образец текущего цвета (приватная часть)

<identity>M3: нет (часть авторского [MColorPicker](index.md)) · Код: `src/runtime/components/fragments/color-picker/Preview.vue` · Тип: sub, приватный</identity>

<implementation-status state="planned" updated="2026-10-07">Реализован: квадрат текущего цвета на шахматке для прозрачности. Изменения минимальны: forced colors и токены.</implementation-status>

## Вердикт

`авторский`. Декоративная часть. Цвет объявляет поле значения, поэтому образец скрыт от AT.

## Рендеры

Общие с родителем: `renders/color-picker` — квадрат слева от значения.

## Изменения

| Что | Сейчас | Цель |
|---|---|---|
| Граница | нет | `outline` hairline `outline-variant`: светлый цвет на светлом фоне иначе не виден; в forced colors `CanvasText` |
| Размер и скругление | литералы | токены карты родителя |
| Доступность | — | `aria-hidden="true"` |

## Тесты

`aria-hidden`; граница в forced colors.

## Готово, когда

Образец виден на любом фоне.

## Предложения по UX

Нет.

## Открытые вопросы

Нет.
