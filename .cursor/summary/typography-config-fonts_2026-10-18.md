# Типографика: конфиг typeface + загрузка шрифтов через useHead — 2026-10-18

Было: `typography.fontFamily` объявлена, имела дефолт, описана в docs, но нигде не читалась;
шрифты грузились `@import` из `base/_fonts.scss` (цепочка HTML → main.css → googleapis →
woff2, отключить или заменить нельзя); `Google Sans Text` (plain — body/label/title-m/s) не
грузился вовсе; `Noto Sans Mono` грузился, но не использовался. Коммитов нет.

## Решения владельца

| Тема | Решение |
|---|---|
| Дефолт без конфига | Roboto (MD3 baseline) из Google Fonts |
| Форма `fonts` | список URL стилей: Google/CDN, прогретый S3, путь из `public/` |
| `typography.fontFamily` | удалить без legacy-ошибки — стабильной версии нет |
| Legacy-проверка тем (`options/legacy.ts`) | удалить — вышло два мажора |
| SCSS | читать типографику через `$…-link` карты |

## Что сделано

- `shared/types/kit.ts` — `IMaterialKitTypography { typeface?: { brand, plain, mono }, fonts?: string[] | false }`.
- `shared/constants/typography.ts` — `DEFAULT_TYPEFACE` (Roboto / Roboto / `ui-monospace, monospace`), `DEFAULT_FONTS`.
- `utils/typography/resolveTypography.ts` — дефолты подставляются в `setup`, не в module `defaults`:
  defu склеивает массивы, свои `fonts` грузились бы поверх Roboto. `typefaceToScss()` — карта
  `$material-kit-typeface` для `~material-kit-config`.
- `utils/typography/buildFontLinks.ts` — stylesheet + preconnect: Google → googleapis + gstatic
  (crossorigin); чужой origin (S3/CDN) → оба режима; относительный путь → без preconnect.
- `plugins/fonts.ts` — `useHead({ link })` из `runtimeConfig.public.materialKit.typography.fonts`
  (resolved; env `NUXT_PUBLIC_MATERIAL_KIT_TYPOGRAPHY_FONTS` может подменить хост по окружению).
- `module.ts` — без `typography` в defaults и без legacy-проверки; resolve → шаблон + runtimeConfig.
- `base/_fonts.scss` — без `@import`, `--md-ref-typeface-*` из `cfg.$material-kit-typeface`.
- `base/_typography.scss` — `font-family` из `$theme-typography-link` (body.medium); `14rem` и
  `line-height: 1.5` оставлены как были.
- `shell/scss-smoke.mjs` — заглушка конфига дополнена `$material-kit-typeface`.
- `docs/configuration.md` — раздел `typography` переписан.
- Удалены `src/options/legacy.ts` + spec.

## Проверки

- Vitest: 133 файла / 1604 теста — зелёные (новые specs в `utils/typography/specs`).
- `lint:scss` — 152 стиля, без deprecations; `main.scss` компилируется, `@import` в выходе нет.
- ESLint / Stylelint по изменённым файлам — 0 ошибок. Полные прогоны красные из-за старых
  ошибок в `playground/render/*` и др. (не тронуто).
- vue-tsc: 47 старых ошибок, в изменённых файлах — 0 (после `nuxi prepare playground`).

## Не проверено / дальше

- В браузере не смотрел (Nuxt не запускал): `<link>` в `<head>`, отсутствие FOUT-регрессии.
- env-override `fonts` — стандартное поведение Nuxt, руками не прогонялось.
- docs (отдельный репо) после публикации должен явно задать Google Sans, иначе станет Roboto.
