# Агент F — убрать `--ui-*` из полей (A6, решение владельца по Q35/B6.9)

Сначала прочитай `00-common.md` рядом. Владелец: «CSS-переменные по сути нужны только в layout-системе,
публичных CSS в обычных компонентах быть не должно». Это перекрывает рекомендацию Б из Q35.

## Твоя зона файлов

`src/runtime/components/ui/{text-field,textarea,number-input}/**`,
`src/runtime/assets/stylesheet/components/{text-field,textarea,number-input}/**`,
`src/runtime/assets/stylesheet/abstracts/_mixins.scss` (только миксин скроллбара),
`src/runtime/assets/stylesheet/base/_scrollbar.scss`,
`src/runtime/components/fragments/dropdown/Panel.vue` и `src/runtime/components/ui/table/index.vue`
(только строки `--ui-scrollbar-inset-*`), `docs/system/**` (решение Q-1 / оси полей).

## Что сделать

1. **До любой правки** сними эталон: временный Playwright-спек **вне репо** (в scratchpad
   оркестратора, путь ниже), который открывает фикстуры `text-field`, `textarea`, `number-input`
   (все страницы `matrix`/`cases`, какие есть в `playground/fixtures/<name>/`), light+dark,
   ширины 360/768/1366, и делает `toHaveScreenshot` **по элементу** (корень каждого поля/секции,
   не страница целиком — параллельно агент layout меняет `m-layout-main`, страница может сдвинуться). Первый прогон —
   `--update-snapshots`. Каталог для спека и снимков:
   `C:\Users\pr0s1k\AppData\Local\Temp\claude\C--Users-pr0s1k--claude-spares-spare-XDSS77\7a32aea2-eb8c-4fd8-81e2-fb876a7c6c87\scratchpad\field-shots\`
   (запуск: `npx playwright test --config <свой временный конфиг там же>` с `baseURL` `http://127.0.0.1:3200`,
   без `webServer`). Анимации отключи (`animations: 'disabled'`), каретку спрячь.
2. Убери **все** `--ui-text-field-*`, `--ui-textarea-*`, `--ui-number-input-*` (определения и чтения),
   включая чтение `--ui-number-input-zone-radius` в `number-input/unit.vue`. Значения осей
   (density, shape, variant, label placement, controls) резолвятся при сборке из `$tokens` через
   `g()` под BEM-модификаторами. Чтобы не сдвинуть каскад: **префикс оси оборачивай в `:where()`**
   (специфичность прежняя) и генерируй правило на месте исходного объявления (порядок прежний).
   Помогут миксины с `@content(...)`/`using (...)`: «для каждого значения оси выдай блок».
   Комбинации двух осей (например `min(radius, height / 2)` = shape × density) разворачивай явно.
   Производные `calc()` — в карте токенов (`derived-values-in-token-map`).
3. Скроллбар: `--ui-scrollbar-inset-block/inline` → параметры миксина
   (`@include scrollbar($inset-block: …, $inset-inline: …)` или как устроено), обнови
   `fragments/dropdown/Panel.vue` и `ui/table/index.vue`, удали дефолты из `base/_scrollbar.scss`.
4. Не трогай: переменные зон layout и runtime-мосты (список в `00-common.md`).
5. Докажи, что вид не изменился: тот же скриншот-спек без `--update-snapshots` — 0 отличий;
   e2e `playground/fixtures/{text-field,textarea,number-input,dropdown,autocomplete,search,table}` —
   без новых падений; vitest этих компонентов — зелёный. В отчёт: размер скомпилированного CSS трёх
   полей до/после (через `node <scratchpad>/css-dump.mjs . <out>` — скрипт уже есть в scratchpad
   оркестратора, эталон до волны — `<scratchpad>/css-baseline`).
6. Обнови `docs/system/en-US/decisions.md` + ru-RU: Q-1 закрыт решением владельца 2026-10-23
   (оси полей — статический Sass, CSS-переменные только у layout). Если `axes.md` описывает
   приватные переменные — поправь.

Если какая-то переменная окажется действительно рантаймовой (её пишет JS или анимирует CSS),
не превращай её силой — оставь и объясни в отчёте.

## Не делать

Любые изменения внешнего вида, поведения или DOM полей; другие баги полей (B6.* — следующая волна,
только отметь в отчёте, если увидишь).
