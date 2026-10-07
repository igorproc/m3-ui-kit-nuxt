# MShape — фигуры Expressive и морфинг между ними

<identity>M3: Styles → Shape → Shape library (M3 Expressive, 35 фигур) · Исходник: Compose `MaterialShapes.kt`, пружины `ExpressiveMotionTokens` · Код: `src/runtime/components/ui/shape/index.vue`, `src/runtime/assets/icon/shapes.ts`, `src/runtime/composables/useShapeMorph.ts`, `src/runtime/utils/motion/` · Аудит: `data/shape.json` · Тип: public, декоративный примитив</identity>

<implementation-status state="planned" updated="2026-10-07">Сделано: фигура по умолчанию скрыта от AT, проп `label` даёт `role="img"` и имя; общий кэш интерполяторов (только на клиенте, ограничен 64 парами); reduced motion укорачивает морф до `short2` без крена вместо мгновенного скачка; viewBox — константа `M3_SHAPE_SIZE`; таблица сверки `M3_SPRING` в спеке (не сверена с Compose). Перенесены ClamShell (нет кэша Gradle) и документация (docs_v2 вне репо).</implementation-status>

## Вердикт

`совпадает`. В ките есть почти вся библиотека фигур Expressive: 34 из 35, нет только
ClamShell, плюс собственный `hexagon`. Есть морф между фигурами на пружинах M3. Разрыв
небольшой:
- ключи фигур названы иначе, чем в Compose (`12SidedCookie` вместо `Cookie12Sided`, `ghostIsh`
  вместо `Ghostish`);
- у SVG нет `aria-hidden`;
- каждый экземпляр заново строит интерполяторы.

## Рендеры

| Сейчас | Концепт |
|---|---|
| ![Сейчас](../../renders/surface/current.webp) | ![Концепт](../../renders/surface/concept.webp) |

Рендеры общие с [MSurface](surface.md). На текущем — все фигуры кита. На
концепте — покрытие библиотеки Compose: залитые фигуры есть в ките, пунктир — нет. Нет
только ClamShell.

## Анатомия

| # | Часть | В ките | Статус |
|---|---|---|---|
| 1 | Фигура (RoundedPolygon в Compose) | `<svg viewBox="0 0 380 380"><path :d fill="currentColor">` | есть |
| 2 | Цвет | `currentColor` от родителя | есть |
| 3 | Морф между фигурами | `useShapeMorph` (интерполяция путей, вращение) | есть |
| 4 | Последовательность (loading indicator) | проп `sequence`, кэш пар для цикла | есть, кэш локален экземпляру |

## Оси дизайна

| Ось | M3 | Кит сейчас | Цель | Ломает API |
|---|---|---|---|---|
| `name` | 35 фигур `MaterialShapes` | 35 ключей в `M3_SHAPES`, ClamShell нет, `hexagon` сверх | Добавить `clamShell`. Алиасы имён Compose (вопрос 1) | нет |
| `transition` | Пружины expressive / standard × fast / default / slow | `MorphTransitionInput`, дефолт `'expressive'`; пружины в `utils/motion` (`M3_SPRING`) | совпадает | — |
| `duration` | Выводится из пружины | Опциональный override | совпадает | — |
| Смысл (декор или изображение) | — | Всегда безымянная графика | Проп `label` (вопрос 2) | нет |

## Оси состояний

| Ось | Нужно | Есть | Не хватает |
|---|---|---|---|
| Движение | Морф на пружине; reduced motion сокращает | Пружины в JS | Проверить, что морф уважает `prefers-reduced-motion`: укорачивается, а не исчезает |
| Доступность | Декоративная фигура скрыта от AT | — | `aria-hidden="true"` и `focusable="false"` по умолчанию (A11-05) |

## Токены: расхождения

| Часть | M3 | Кит сейчас | Действие |
|---|---|---|---|
| Пружина expressive default spatial | damping 0.8, stiffness 380 (по плану, не сверено с исходником) | В `M3_SPRING` схемы Expressive нет; переход `expressive` намеренно настроен сверх спецификации (0.6 / 380) | Сверить с `ExpressiveMotionTokens`, когда будет кэш Gradle (`it.todo` в спеке `utils/motion`) |
| Пружина standard | damping 0.9, stiffness 700 / 1400 / 300 | `M3_SPRING.spatial` + `effects` 1 / 3800 / 1600 / 800 | Таблица в спеке `utils/motion` по константам кита, помечена «not verified against Compose» |
| CSS-токены пружин | — | нет | Появятся по S4. `MShape` их не потребляет (морф в JS), но значения должны совпасть |

## Поведение и доступность

- По умолчанию фигура декоративная: `aria-hidden="true"`, `focusable="false"`.
- Если фигура несёт смысл (статус, аватар-заглушка), нужен `role="img"` и `aria-label`.
- Аудит:
  - A11-05 — шаг 2;
  - EN-10 (кэш на экземпляр: N индикаторов на странице строят одни и те же пары N раз) — шаг 3;
  - DC-01…05 (документации нет) — шаг 5.

## API

| Что | Изменение | Ломает |
|---|---|---|
| `name` | Добавить `clamShell`. Принимать и имена в стиле Compose (`cookie12Sided`) как алиасы, если выбран вариант 1 вопроса 1 | нет |
| `label?: string` | Новый: при наличии — `role="img"` + `aria-label`, без него — `aria-hidden` | нет |

## План работ

1. **S — ClamShell.** **Перенесено:** в окружении нет кэша Gradle с исходниками
   `material3-android-1.5.0-alpha22`, а геометрию не выдумываем. Существующие фигуры — экспорт
   SVG из Figma (`assets/icon/shapes/Shape=*.svg`, сетка 380) → `shell/extract-shapes.js` →
   `shapes.ts`; ClamShell нужно довести до такого же SVG и прогнать генератор (у генератора
   устаревшие пути `app/assets/...`).
2. **S — доступность.** Сделано: `aria-hidden="true"` и `focusable="false"` по умолчанию, проп
   `label` → `role="img"` + `aria-label`.
3. **M — общий кэш интерполяторов.** Сделано: модульный `Map` в `useShapeMorph.ts` создаётся
   только при `IN_BROWSER`, ключ — `samples`, флаги геометрии и пара канонических путей;
   пара из середины прерванного морфа не кэшируется; не больше 64 пар, старые вытесняются.
4. **S — сверка пружин.** Сделано частично: таблица `M3_SPRING` ↔ `StandardMotionTokens` по
   константам кита («not verified against Compose»); `ExpressiveMotionTokens` — `it.todo`.
5. **S — документация.** **Перенесено** решением владельца: docs_v2 живёт вне репозитория.
6. **S — reduced motion.** Сделано: морф не пропускается, а укорачивается по правилу кита
   (длительность больше `short4` → `short2`) и идёт без крена.

## Тесты

- Unit:
  - каждое имя из `M3_SHAPES` даёт непустой `d`;
  - `label` переключает `role="img"` и `aria-hidden`;
  - кэш: второй экземпляр с тем же `sequence` не строит пары заново (шпион на построителе).
- e2e: на фикстуре loading indicator под `prefers-reduced-motion: reduce` морф всё равно идёт,
  но быстрее.

## Готово, когда

- 35 фигур Compose доступны.
- Декоративная фигура не попадает в дерево доступности, значимая — объявляется по имени.
- На странице с десятью индикаторами интерполяторы строятся один раз.

## Предложения по UX

Расширения сверх паритета с M3. Это предложения владельцу, а не шаги плана: в «План работ» попадают только после решения. Без Expressive-анимаций и без новых зависимостей.

| Предложение | Что получает пользователь | Заказчик | Цена | Рекомендация |
|---|---|---|---|---|
| Фигура как маска изображения (`MShape` → `clip-path` для аватара и обложки) | Аватары и превью в фигурах Expressive (cookie, clover) без своих SVG у продукта | avatar, карточки с медиа | S · статичная маска, без морфа | да, после плана avatar |
| Статичный выбор фигуры по состоянию (например, у выбранного элемента другая фигура) без анимации | Выбор читается формой, не только цветом | chip filter, toggle-кнопки | S · CSS-класс, без JS | обсудить: пересекается с S3 «статичная форма допустима» |

## Открытые вопросы

**1. Имена фигур.**
1. Оставить ключи кита и добавить алиасы в стиле Compose. Ничего не ломается, но у каждой
   фигуры два имени.
2. Переименовать ключи в стиль Compose (`cookie12Sided`, `clover4Leaf`) с деприкацией старых.
   Один словарь с M3, но это ломающее изменение для потребителей `MShape` и loading.
3. Оставить как есть, сопоставление описать в документации.

Рекомендация: 3. Имена — внутренняя деталь, а M3 публикует фигуры картинками, а не ключами.

**Решено владельцем 2026-10-07: вариант 3.** Ключи кита остаются, сопоставление — ниже. Имена
Compose взяты из плана и по памяти, с `MaterialShapes.kt` не сверены (кэша Gradle нет).

| Ключ кита | `MaterialShapes` в Compose |
|---|---|
| `circle` | `Circle` |
| `square` | `Square` |
| `slanted` | `Slanted` |
| `arch` | `Arch` |
| `fan` | `Fan` |
| `arrow` | `Arrow` |
| `semicircle` | `SemiCircle` |
| `oval` | `Oval` |
| `pill` | `Pill` |
| `triangle` | `Triangle` |
| `diamond` | `Diamond` |
| — | `ClamShell` (в ките нет, шаг 1) |
| `pentagon` | `Pentagon` |
| `gem` | `Gem` |
| `verySunny` | `VerySunny` |
| `sunny` | `Sunny` |
| `4SidedCookie` | `Cookie4Sided` |
| `6SidedCookie` | `Cookie6Sided` |
| `7SidedCookie` | `Cookie7Sided` |
| `9SidedCookie` | `Cookie9Sided` |
| `12SidedCookie` | `Cookie12Sided` |
| `ghostIsh` | `Ghostish` |
| `4LeafClover` | `Clover4Leaf` |
| `8LeafClover` | `Clover8Leaf` |
| `burst` | `Burst` |
| `softBurst` | `SoftBurst` |
| `boom` | `Boom` |
| `softBoom` | `SoftBoom` |
| `flower` | `Flower` |
| `puffy` | `Puffy` |
| `puffyDiamond` | `PuffyDiamond` |
| `pixelCircle` | `PixelCircle` |
| `pixelTriangle` | `PixelTriangle` |
| `bun` | `Bun` |
| `heart` | `Heart` |
| `hexagon` | — (своя фигура кита) |

**2. Нужен ли `label` (значимая фигура)?**
1. Да: аватар-заглушка или статус-фигура без имени — это дефект доступности.
2. Нет: фигура всегда декор, смысл передаёт обёртка.

Рекомендация: 1, это дёшево и закрывает A11-05 полностью.

**Решено 2026-10-07: вариант 1** (рекомендация плана, поправка владельца к шагу 2).
