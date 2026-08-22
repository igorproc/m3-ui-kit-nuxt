# План: полное использование `@material/material-color-utilities` в теминге kit

**Статус:** план согласован, реализация не начата. Ждёт «погнали» по срезам.
**Дата:** 2026-08-22. **MCU:** `@material/material-color-utilities@0.4.0`.
**Цель:** довести теминг до полного использования MCU — реальный `contrast`, числовой
`neutral`/`chroma` вместо жёстких пресетов, семантические цвета (success/warning/info),
гибкий тип конфига, генерация только активной темы в рантайме, управление и на билде,
и в рантайме (демонстрация в docs_v2).

---

## РЕШЕНИЯ (зафиксировано 2026-08-22)

1. **spec 2025** — `specVersion: '2025'` по умолчанию (последняя в 0.4.0). Уходим от 2021.
   Побочно чинит `*-dim` роли, которые `$theme-color-link` уже ждёт.
2. **htmlAttrs + `<style>` → `MApp`.** Убрать `useHead({ htmlAttrs, style })` из
   `store/theme.ts`. Владельцем head-инъекции становится `MApp`. Стор — только состояние.
3. **Только активная комбинация CSS (scoped runtime).** НЕ эмитим все палитры на билде.
   `MApp` генерит CSS **только активной палитры** (оба definition: light+dark, чтобы
   переключение темы было мгновенным) на **текущем уровне контраста**. Смена
   palette/contrast/neutral/custom → перегенерация активного блока. SSR (без FOUC) +
   реактивно на клиенте. Обобщаем текущий custom-HEX путь на все палитры.
   → `[data-contrast]`-матрица НЕ нужна: значения активного блока уже соответствуют контрасту.
4. **Семантика:** глобально `success/warning/info` с дефолтными HEX (зел/янт/син), генерация
   через `customColor(..., { blend: true })` (гармонизация к сиду палитры), `blend`
   настраиваемый (дефолт **true**), per-theme override. Fallback в `$theme-color-link` —
   инертная страховка. Снять хак `MAlert`.
5. **Гибкий тип темы** — база + все ручки опциональны («писать как угодно»), `preset` алиас.
6. **themeFromImage/Score/Quantizer** — отдельный срез: альтернативный источник сида
   (картинка → HEX), живёт в `MApp`/сторе, кормит `setCustomColor`. Не отдельный пайплайн.

---

## 0. Плумбинг (как цвет доходит до компонента)

```
config.themes[].color (HEX) / custom HEX / seed из картинки
  └─ generateScheme()   src/runtime/shared/utils/defineKit.ts   → MCU DynamicScheme(light/dark) + semantic
       └─ buildThemeBlocks()  src/runtime/shared/utils/themeScss.ts  → CSS активной темы { --md-sys-color-* }
            └─ MApp  useHead({ htmlAttrs, style })  ← SSR + реактивно (НЕ store)
                 └─ $theme-color-link  _variables.scss  (var(--md-sys-color-*))
                      └─ g($theme-color-link, 'role')  ← ЕДИНСТВЕННЫЙ способ доступа компонентов
```
Правило проекта: **компонент берёт цвет только через `$theme-color-link`** → новые
semantic-роли обязаны попасть И в генерацию, И в `$theme-color-link`.

Билд-модуль `src/module.ts` и dev-модуль `app/modules/kit/module.ts` — после реформы
их роль в теме минимальна (breakpoints + прелюдия), генерация уезжает в `MApp`.

---

## 1. Аудит (подтверждено чтением)

1. `contrastLevel` захардкожен `0.0` в `generateScheme`; `buildBlock` эмитит только
   `[data-definition][data-palette]`. Стор пишет `data-contrast`, но ему ничего не отвечает.
   → контраст мёртв для MCU-палитр.
2. spec по умолчанию `2021` (`DynamicScheme.DEFAULT_SPEC_VERSION`), `specVersion` 4-м аргументом
   `Scheme*` не передаётся. `$theme-color-link` ждёт `*-dim` (2025) → для генерируемых палитр
   эти vars, вероятно, undefined (есть только в ручном `_m3-fallback`). Латентный баг.
3. Пресеты (`tonalSpot/monochrome/vibrant/neutral/fidelity`) вместо числового neutral/chroma;
   нет `expressive/content/rainbow/fruitSalad`.
4. Нет `customColor` → хак `MAlert` (`success→tertiary, warning→primary, info→secondary`).
5. Не используются `themeFromImage`/`Score`/`QuantizerCelebi`, `Blend`, сырые рампы.
6. Дубль пайплайна темы в двух модулях.

---

## 2. MCU 0.4.0 — сверенный API

```ts
new DynamicScheme({
  sourceColorHct: Hct, variant: Variant, contrastLevel: number /*-1..1*/, isDark: boolean,
  specVersion?: '2021' | '2025' /*DEFAULT '2021'*/, platform?: 'phone'|'watch',
  primaryPalette?, secondaryPalette?, tertiaryPalette?, neutralPalette?, neutralVariantPalette?, errorPalette?: TonalPalette,
})
enum Variant { MONOCHROME, NEUTRAL, TONAL_SPOT, VIBRANT, EXPRESSIVE, FIDELITY, CONTENT, RAINBOW, FRUIT_SALAD }
new SchemeExpressive(sourceColorHct, isDark, contrastLevel, specVersion?, platform?)   // обёртки — позиционные

TonalPalette.fromHueAndChroma(hue: number, chroma: number): TonalPalette   // ← «neutral value»
TonalPalette.fromInt(argb) / fromHct(hct)

interface CustomColor { value: number/*argb*/, name: string, blend: boolean }
interface CustomColorGroup { color, value, light: ColorGroup, dark: ColorGroup }
//   ColorGroup = { color, onColor, colorContainer, onColorContainer } (argb ints)
customColor(source: number, color: CustomColor): CustomColorGroup   // blend:true → гармонизация к source

Hct.fromInt(argb) → { hue, chroma, tone };  argbFromHex(hex); hexFromArgb(argb)
// Для картинки: QuantizerCelebi.quantize(pixels, maxColors) → Map<argb,count>; Score.score(map) → argb[]
```
`schemeToTokens` уже читает `DynamicScheme.colors.allColors` — оставляем.

---

## 3. Гибкий тип темы (`src/runtime/shared/types/kit.ts`)

```ts
export type TThemeVariant
  = 'tonalSpot' | 'neutral' | 'vibrant' | 'expressive'
  | 'monochrome' | 'fidelity' | 'content' | 'rainbow' | 'fruitSalad'

/** 'standard'|'medium'|'high' → 0|0.5|1; число пробрасывается (клампится -1..1). */
export type TThemeContrast = 'standard' | 'medium' | 'high' | number

/** name → HEX (или { color, blend } для точечного переопределения blend). */
export type TSemanticColors = Record<string, string | { color: string, blend?: boolean }>

export interface ITheme {
  key: string
  name: string
  color?: string
  definedInScss?: boolean
}

export interface IDynamicThemeOptions {
  variant?: TThemeVariant
  /** @deprecated алиас variant. */
  preset?: 'tonalSpot' | 'monochrome' | 'neutral' | 'vibrant' | 'fidelity'
  contrast?: TThemeContrast
  /** Chroma нейтральных палитр (neutral + neutralVariant). Переопределяет вариант. */
  neutralChroma?: number
  /** Опциональная общая chroma (primary/secondary/tertiary). */
  chroma?: number
  /** Переопределение semantic для этой темы (сверх глобальных). */
  semanticColors?: TSemanticColors
  /** По умолчанию '2025'. */
  specVersion?: '2021' | '2025'
}

export type TTheme = ITheme & IDynamicThemeOptions
```

`MaterialKitOptions` дополняется:
```ts
semanticColors?: TSemanticColors      // глобальные success/warning/info (дефолты ниже)
semanticBlend?: boolean               // глобальный дефолт blend (default true)
defaultVariant?: TThemeVariant
defaultNeutralChroma?: number
defaultContrast?: TThemeContrast      // было string
```
Дефолты semantic (если не заданы): `{ success:'#2e7d32', warning:'#ed6c02', info:'#0288d1' }`.

---

## 4. `generateScheme` — пересборка (`src/runtime/shared/utils/defineKit.ts`)

```ts
import { argbFromHex, Hct, TonalPalette, DynamicScheme, Variant, customColor } from '@material/material-color-utilities'

const VARIANT_MAP: Record<TThemeVariant, Variant> = {
  tonalSpot: Variant.TONAL_SPOT, neutral: Variant.NEUTRAL, vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE, monochrome: Variant.MONOCHROME, fidelity: Variant.FIDELITY,
  content: Variant.CONTENT, rainbow: Variant.RAINBOW, fruitSalad: Variant.FRUIT_SALAD,
}
const CONTRAST_MAP = { standard: 0, medium: 0.5, high: 1 }
function toLevel(c) { return typeof c === 'number' ? Math.max(-1, Math.min(1, c)) : (CONTRAST_MAP[c ?? 'standard']) }

function buildScheme(sourceHct, isDark, data, level) {
  const variant = VARIANT_MAP[data.variant ?? data.preset ?? 'tonalSpot']
  const specVersion = data.specVersion ?? '2025'
  const hue = sourceHct.hue
  const custom = {}
  if (data.neutralChroma != null) {
    custom.neutralPalette = TonalPalette.fromHueAndChroma(hue, data.neutralChroma)
    custom.neutralVariantPalette = TonalPalette.fromHueAndChroma(hue, data.neutralChroma + 4)
  }
  if (data.chroma != null) {
    custom.primaryPalette = TonalPalette.fromHueAndChroma(hue, data.chroma)
    custom.secondaryPalette = TonalPalette.fromHueAndChroma(hue, data.chroma / 3)
    custom.tertiaryPalette = TonalPalette.fromHueAndChroma(hue + 60, data.chroma / 2)
  }
  return new DynamicScheme({ sourceColorHct: sourceHct, variant, contrastLevel: level, isDark, specVersion, ...custom })
}

// semantic: глобальные merge-нутся с per-theme override; blend по цвету || глобальный || true
export const generateScheme = (data, opts = {}) => {
  if (data.definedInScss || !data?.color) return null
  const argb = argbFromHex(data.color)
  const sourceHct = Hct.fromInt(argb)
  const level = toLevel(opts.contrast ?? data.contrast)

  const semanticInput = { ...(opts.semanticColors ?? {}), ...(data.semanticColors ?? {}) }
  const semantic = Object.entries(semanticInput).map(([name, v]) => {
    const color = typeof v === 'string' ? v : v.color
    const blend = typeof v === 'string' ? (opts.semanticBlend ?? true) : (v.blend ?? opts.semanticBlend ?? true)
    return customColor(argb, { name, value: argbFromHex(color), blend })
  })

  return { light: buildScheme(sourceHct, false, data, level), dark: buildScheme(sourceHct, true, data, level), semantic }
}
```
Коэффициенты chroma (`+4`, `/3`, `+60`, `/2`) — стартовые, подбор визуально владельцем.

---

## 5. Эмит CSS активной темы (`src/runtime/shared/utils/themeScss.ts`)

```ts
function semanticToTokens(groups, isDark) {
  const t = {}
  for (const g of groups) {
    const n = g.color.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    const c = isDark ? g.dark : g.light
    t[n] = hexFromArgb(c.color); t[`on-${n}`] = hexFromArgb(c.onColor)
    t[`${n}-container`] = hexFromArgb(c.colorContainer); t[`on-${n}-container`] = hexFromArgb(c.onColorContainer)
  }
  return t
}
```
`buildThemeBlocks(key, scheme)` эмитит **только** light+dark блоки активной палитры
(значения уже на нужном контрасте — уровень прошит в generateScheme). semantic мержится в
оба блока:
```
[data-definition="light"][data-palette="KEY"] { --md-sys-color-*: … (core+2025) + semantic-light }
[data-definition="dark"][data-palette="KEY"]  { --md-sys-color-*: … + semantic-dark }
```
Никаких `[data-contrast]`-блоков — контраст меняет значения, не селектор.

---

## 6. Мост в SCSS (`src/runtime/assets/stylesheet/abstracts/_variables.scss`)

Добавить semantic в `$theme-color-link` (фикс-трио, v1). Fallback — инертная страховка
(при дефолтах не срабатывает, т.к. трио всегда генерится):
```scss
'success': var(--md-sys-color-success),  'on-success': var(--md-sys-color-on-success),
'success-container': var(--md-sys-color-success-container), 'on-success-container': var(--md-sys-color-on-success-container),
'warning': var(--md-sys-color-warning),  'on-warning': var(--md-sys-color-on-warning),
'warning-container': var(--md-sys-color-warning-container), 'on-warning-container': var(--md-sys-color-on-warning-container),
'info': var(--md-sys-color-info),        'on-info': var(--md-sys-color-on-info),
'info-container': var(--md-sys-color-info-container), 'on-info-container': var(--md-sys-color-on-info-container),
```
Произвольные брендовые semantic (сверх трио) — бэклог (generated map-merge в link).

---

## 7. `MApp` — владелец темы в head (`src/runtime/components/ui/app` + `store/theme.ts`)

- **Перенести из `store/theme.ts` в `MApp`:** `useHead({ htmlAttrs: { data-definition, data-palette,
  data-contrast }, style: [активный theme CSS] })`. Стор экспонирует состояние/сеттеры, `MApp`
  их читает и рендерит head.
- **Активный CSS в `MApp` (SSR+клиент):**
  ```ts
  const activeCss = computed(() => {
    const t = store.currentThemeConfig            // конфиг активной палитры (или {color: customHEX})
    if (!t || t.definedInScss) return ''          // _m3-fallback — чисто SCSS
    const scheme = generateScheme(t, {
      contrast: store.contrast, semanticColors: opts.semanticColors, semanticBlend: opts.semanticBlend,
    })
    return buildThemeBlocks(store.resolvedPalette, scheme)   // только активная палитра
  })
  ```
- Смена palette/contrast/neutral/custom → `activeCss` пересобирается → `useHead` реактивно.
- Стор: `setContrast(c)`, `setNeutralChroma(n)`, `setVariant(v)`, `setCustomColor(hex)`,
  плюс геттеры `currentThemeConfig`, `resolvedPalette`, `contrast`. Персист в cookie.
- `contrast` cookie: значения `standard/medium/high` (миграция `low`→`standard`).

---

## 8. Модули (`src/module.ts`, `app/modules/kit/module.ts`)

- Убрать `registerThemePipeline` (эмит всех палитр). Остаётся: `material-kit-config.scss`
  (breakpoints), инъекция прелюдии, регистрация компонентов/импортов, прокинуть
  `semanticColors`/`semanticBlend`/дефолты в `runtimeConfig.public.materialKit`.
- Генерация тем-CSS теперь в `MApp` (рантайм). `_m3-fallback` остаётся статикой (SSR-baseline
  до гидрации / no-JS).
- Дедупнуть два модуля (общий код — в утиль).

---

## 9. themeFromImage / Score / Quantizer (отдельный срез)

Альтернативный источник сида, НЕ отдельный пайплайн:
```ts
// клиент: <img>/ImageBitmap → canvas → pixels(Uint32 argb)
const ranked = Score.score(QuantizerCelebi.quantize(pixels, 128))   // argb[], топ — доминирующий
store.setCustomColor(hexFromArgb(ranked[0]))                        // дальше — обычный generateScheme
```
Живёт в `MApp`/сторе (браузерный API). Опция «интегрировать в текущую тему» = взять сид из
картинки и прогнать через тот же generateScheme (при желании — `blend` к текущему цвету).
Детализировать при реализации среза.

---

## 10. docs_v2 — showcase «везде»

Страница Foundations/Theme: контролы (color picker · variant · contrast standard/medium/high ·
neutral chroma slider · toggle semantic · **upload image → сид**) + живое превью всех
`--md-sys-color-*` (core + surface-containers + fixed + semantic), пары color/on-color.
Завязать на рантайм-стор.

---

## 11. Снять хак `MAlert`

severity → реальные `success/warning/info/error`. Обновить alert `_index.scss`, docs_v2 alert
(token manifest, примеры), `alert.spec` + e2e.

---

## 12. Обратная совместимость

- `preset` → `variant` (deprecated).
- Нормализация cookie `contrast`: `low`→`standard`.
- `_m3-fallback` статичный остаётся (SSR-baseline).
- `defaultContrast: string` → `TThemeContrast`.

---

## 13. Риски

- Переход на spec `2025` меняет значения всех ролей + включает `*-dim` → визуальная проверка
  владельцем (light/dark), dev автономно не поднимаю.
- Генерация в рантайме: MCU в клиентском бандле (уже так). Первичный SSR-рендер обязан
  содержать активный блок (MApp на сервере) — иначе FOUC.
- `scheme.colors.allColors` на `DynamicScheme` — подтвердить при первом прогоне.
- Коэффициенты neutral/overall chroma — подбор визуально.

---

## 14. Изменяемые файлы

- `src/runtime/shared/types/kit.ts` (§3)
- `src/runtime/shared/utils/defineKit.ts` (§4)
- `src/runtime/shared/utils/themeScss.ts` (§5)
- `src/runtime/assets/stylesheet/abstracts/_variables.scss` (§6)
- `src/runtime/components/ui/app/**` + `src/runtime/store/theme.ts` (§7)
- `src/module.ts`, `app/modules/kit/module.ts` (§8)
- `src/runtime/.../components/ui/alert/**` + токены (§11)
- (срез image) `MApp`/утиль (§9)
- `docs_v2/**` (§10), тесты (§16)

---

## 15. (—)

## 16. Тесты

- `generateScheme`: contrast 0/0.5/1 → разные тона; `neutralChroma` меняет chroma нейтральных
  ролей; semantic (глоб+override, blend true/false) → 4 роли на имя; variant маппинг;
  `definedInScss`→null; spec 2025 → присутствуют `*-dim`.
- `themeScss`: эмитятся только 2 блока активной палитры; semantic в обоих.
- `MApp`: SSR содержит активный блок; смена contrast/palette пересобирает; htmlAttrs.
- alert: severity→semantic (юнит + e2e docs_v2).
- Гейты: lint/lint:style 0; vitest зелёный.

---

## 17. Порядок реализации (вертикальные срезы)

1. **Срез 0 — вынести head в `MApp` + scoped-runtime генерация активной палитры** (§7, §8, §5).
   Фундамент: без него контраст/neutral негде применять. Spec 2025 включаем здесь.
2. **Срез 1 — Contrast** (§3 contrast, §4 level). Переключатель начинает работать.
3. **Срез 2 — Semantic** (§3 semantic, §4 customColor, §5 semanticToTokens, §6, §11 снять хак).
4. **Срез 3 — Neutral/chroma числом** (§3, §4 custom palettes, §7 setNeutralChroma).
5. **Срез 4 — Variants** (`expressive` и др.).
6. **Срез 5 — themeFromImage** (§9) + docs showcase (§10) + дедуп модулей.

Рекомендация: начать со **Среза 0** (архитектурный фундамент), затем 1→2→3.

---

## 18. Открытые (мелочь, решить по ходу)

- Коэффициенты chroma neutral/overall — подбор визуально.
- Произвольные semantic сверх трио — бэклог.
- Точная форма cookie для neutral/variant (расширить `IPaletteCookie` или новые ключи).
