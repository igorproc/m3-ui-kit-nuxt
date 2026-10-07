# BreadcrumbsItem — крошка (приватная часть)

<identity>M3: нет (часть авторского [MBreadcrumbs](index.md)) · Код: `src/runtime/components/fragments/breadcrumbs/item/index.vue` · Тип: sub, приватный</identity>

<implementation-status state="planned" updated="2026-10-07">Реализован 2026-07-16: активная крошка — `MButton variant="text" tag="link"`, текущая и disabled — текст с `aria-current` / `aria-disabled`. Меняется вид текущей и поведение в forced colors.</implementation-status>

## Вердикт

`авторский`. Одно решение на крошку — ссылка, текущая или disabled — остаётся. Порядок:
текущая важнее disabled, ссылка — только при `to` и не текущей.

## Рендеры

Общие с родителем: `renders/pagination`, нижний кадр.

## Анатомия

| Ветка | Разметка | Изменение |
|---|---|---|
| Ссылка | `MButton variant="text" tag="link"` | без изменений; слой и кольцо — общие у кнопки |
| Текущая | `span[aria-current="page"]` | `font-weight: 500`, `on-surface` |
| Disabled | `span[aria-disabled="true"]` | `on-surface` 38% |

## Поведение и доступность

- В forced colors ссылка подчёркнута, текущая — жирная, disabled — `GrayText`.
- Слот получает только содержимое (`item`, `index`, `current`, `disabled`); семантику держит часть.

## Тесты

Ветки, приоритет текущей, Tab-порядок (текущая и disabled не в Tab), слот.

## Готово, когда

Текущая крошка отличается не только цветом, в forced colors все три ветки различимы.

## Предложения по UX

Нет: расширения — у [родителя](index.md).

## Открытые вопросы

Нет.
