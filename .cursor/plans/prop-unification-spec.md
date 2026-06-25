# Prop Unification Spec (Phase A) — обязательный контракт для всех агентов

Цель: привести публичные пропсы всех `app/components/ui/**` к единому виду через
`propsFactory`, с MD3-именами, сохранив правило **Zero-Runtime M3** (никаких
runtime CSS-переменных для цветов/состояний — резолв остаётся в SCSS через `g($t,…)`).

## СНАЧАЛА прочитай эталон (не редактируй эти файлы — они готовы)
- `shared/utils/propsFactory.ts` — фабрика.
- `shared/utils/props/index.ts` — `makeColorProps / makeVariantProps / makeSizeProps / makeStateProps / makeReadonlyProps`.
- `shared/types/props.ts` — типы `MColor / MVariant / MSize`.
- `app/components/ui/button/props.ts` — ЭТАЛОН co-located props.
- `app/components/ui/button/index.vue` — ЭТАЛОН SFC (`defineProps(mButtonProps)`), MD3-цвета, `loading`.
- `app/components/ui/button/icon/index.vue` + `app/components/ui/button/split/props.ts` — эталон тонких обёрток/композиции.

## Правила (применять к КАЖДОМУ своему компоненту)

1. **Co-located `props.ts`**. Для компонента создай `props.ts` рядом с `index.vue`:
   ```ts
   import type { ExtractPublicPropTypes, PropType } from 'vue'
   import { makeColorProps, makeStateProps, makeVariantProps } from '#shared/utils/props'
   export const mXProps = {
     ...makeStateProps(),            // disabled + loading — где применимо
     // ...makeColorProps(), makeVariantProps(), makeSizeProps(), makeReadonlyProps()
     // + специфичные пропсы компонента: { type: ..., default: ... }
   }
   export type MXProps = ExtractPublicPropTypes<typeof mXProps>
   ```
   Если нужно переопределить дефолт у shared-пропа — вызывай фабрику с аргументом:
   `...makeVariantProps({ variant: 'text' })` либо `propsFactory({...})({ variant:'text' })`.

2. **SFC**: убери старый `interface Props` + `withDefaults`, замени на
   `const props = defineProps(mXProps)` (или `defineProps(mXProps)` без присваивания,
   если props используются только в шаблоне). Порядок блоков: `<template>`→`<script setup>`→`<style>`.

3. **Цвета — ТОЛЬКО MD3 роли**: `primary | secondary | tertiary | error`.
   - Старые `accent → secondary`, `warn → error`. Если у компонента в SCSS-token-мапе
     (`app/assets/stylesheet/components/<name>/_index.scss`) есть scheme-ключи `accent`/`warn`
     — переименуй ключи + добавь `tertiary` (по образцу button `_index.scss`), и обнови
     class-модификаторы в `.vue`/SCSS (`&--accent`→`&--secondary`, и т.д.).
   - Любой нестандартный color-enum (напр. FAB `surface`) приводи к MD3 ролям; «surface»-вид
     выражай через `variant` (tonal/elevated), а НЕ через color.

4. **`variant` — только surface-style** (`elevated|filled|tonal|outlined|text`).
   Если у компонента `variant` означает ДРУГУЮ таксономию — переименуй проп:
   - `chip`: `variant: assist|filter|input|suggestion` → **`type`**.
   - `progress`: `variant: linear|circular` → **`type`**.
   - `divider`: `variant: full|inset` → **`inset?: boolean`** (сохрани `vertical` если есть).
   Обнови SCSS class-имена и ВСЕ вызовы внутри своих компонентов. Внешние вызовы
   (в чужих компонентах/docs) — НЕ правь, а ВЫПИШИ в отчёт (file:line) для интеграции.

5. **Cross-cutting пропсы**: `disabled` всегда через `makeStateProps`; `loading` добавляй где
   есть async-действие (кнопкоподобные); `readonly` через `makeReadonlyProps` для input-like.

6. **Слоты**: где контент захардкожен, а должен кастомизироваться — добавь `<slot/>`
   (напр. `search` — leading/clear иконки). Именование слотов приводи к `leading`/`trailing`
   там, где трогаешь (старые `prepend/append`, `icon/trailing` — на `leading/trailing`),
   но НЕ ломай существующие, если это вне твоего скоупа — выпиши в отчёт.

7. **Точечные баги** (см. свой список ниже) — почини.

8. **Zero-Runtime M3**: НЕ вводи `--custom-properties` для цветов/состояний; не читай
   `var(--md-sys-color-*)` в рантайме `.vue`. Состояния — `color-mix` в SCSS (8% hover/12% pressed).

9. **Стиль кода**: без `;`, ESLint stylistic (inline arrow без скобок на 1 арг; block-body arrow в скобках).
   В КОНЦЕ прогони `npx eslint <свои файлы>` из `kit/` и доведи до 0 ошибок. НЕ запускай dev-сервер.

10. **Границы**: правь только свои компоненты (+ их `props.ts`/SCSS-token-мапы). НЕ трогай
    `shared/**`, чужие группы, `app/pages/**`. Импорт типов — через `#shared/...` или относительный.

## Формат отчёта (верни в финальном сообщении, кратко)
- Список изменённых/созданных файлов.
- Какие пропсы унифицированы (color/variant/size/state) и какие переименования сделаны.
- Внешние call-sites, требующие правки (file:line) — из-за твоих переименований.
- Любые TS-ошибки, которые НЕ смог починить в своём скоупе (для отдельного прохода).
- Подтверждение `npx eslint` = 0 на своих файлах.
