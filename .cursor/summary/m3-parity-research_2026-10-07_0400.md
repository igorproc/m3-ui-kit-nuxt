# Исследование: кит как прямой наследник M3

**Дата:** 2026-10-07
**Задача владельца:** концепты для всех компонентов и подробные планы с рендерами и осями,
эталон — m3.material.io (последняя M3 / Expressive). Код кита не менялся.

## Что сделано

- **Планы.**
  - У всех 67 папок `src/runtime/components/ui` есть план нового формата.
  - Есть gap-планы для компонентов M3, которых в ките нет: button group, side sheet, rich
    tooltip, carousel.
  - Формат плана: вердикт, рендеры, анатомия, оси дизайна, оси состояний, расхождения
    токенов, поведение, API, шаги, тесты, «Предложения по UX», открытые вопросы.
- **Вход.** Карта — `.cursor/plans/feature/components-should-update/index.md`.
  - Контракт: `common.md` — системный слой S1–S10, вопросы СВ-1..3, шаблон.
  - Покрытие каталога M3: `coverage-matrix.md`.
  - Волны работ: `roadmap.md`.
- **Раскладка** (по решению владельца).
  - Все планы — в `components-should-update/` по категориям `button/ inputs/ form/ navigation/
    overlays/ containment/ feedback/ foundation/ data/`.
  - Общие документы (`common`, `index`, `coverage-matrix`, `roadmap`) — в его корне.
  - Папка `vuetify-run/` удалена: её переписанные планы перенесены, `virtual-scroll.md` — в
    `foundation/`, `summary.md` и `reuse-map.md` остались только в истории git.
- **Рендеры.**
  - Лежат в `.cursor/plans/feature/renders/<name>/{current,concept}.webp`: 52 папки, 9,1 МБ.
  - `current` — настоящие компоненты кита, состояния выставлены через CDP `forcePseudoState`.
  - `concept` — HTML на системных переменных кита со значениями из токенов Compose.
  - Окно 1200 (1rem = 1dp), сид `#6750A4`, контраст standard.
- **Источники.**
  - Токены Compose Material3 1.5.0-alpha22 (исходники из кэша Gradle).
  - material-web (`m3-reference`).
  - `docs/system`, аудит `runs/quality`.
  - m3.material.io: использован один заход из двух (каталог компонентов).

## Решения владельца (записаны в контракт и в память)

1. Эталон — последняя M3. Планы описывают компоненты кита, а не docs.
2. Авторские компоненты (их нет в M3) развиваются в текущем видении, без редизайна: вердикт
   `авторский`.
3. Expressive-анимации (пружины S4, морф формы S3) в вебе не делаем. Статичная форма состояния
   допустима.
4. Ось масштаба — только `density` с тремя ступенями `compact | default | comfortable`, без
   XS–XL. Кнопки: 32 / 40 / 56.
5. `tonal` у кнопок — `<role>-container`. Split-кнопка без круглого открытого состояния.
6. В каждом плане есть раздел «Предложения по UX».

Не закрыто в `docs/system/*/decisions.md`: пункты 2–5 нужно перенести туда в обе локали (волна 1
дорожной карты).

## Дефекты, найденные рендерами (не было в аудите)

- toolbar: выбор не виден;
- timeline: рейка рвётся;
- file-input: лейбл поверх значения;
- file-upload: `autoStart` не запускает начальную модель;
- autocomplete: начальное значение не видно до blur;
- date-picker: вид годов открывается на 1926;
- menu: невидимо при изначально открытом `v-model`;
- segmented: подписи ломаются по буквам в узком контейнере — следствие переносов фазы D;
- color-picker: образец не выбирается при другом регистре;
- hotkey: «ARROWUP»;
- loading: hydration mismatch в `<p>`;
- rating: «двойная звезда»;
- split: «×» и волосяная линия;
- text-field: анимация `float`-лейбла и вырез у `inset`.

Ссылки на каждый — в `components-should-update/index.md`.

## Временная инфраструктура (не в git)

- `playground/render/{gallery,concept}/*.vue`, `playground/render/_board.scss`,
  `playground/app/pages/render/[kind]/[name].vue` — исключены через `.git/info/exclude`.
- `.claude/render.mjs` — скрипт съёмки: `node .claude/render.mjs <name> [--kind] [--theme]`.
  Нужен запущенный playground на 3200.
- Чтобы переснять рендер после правки компонента, достаточно запустить playground и скрипт.

## Открыто

- **Системные вопросы.**
  - СВ-1: pressed 10 или 12%. Без морфа 10% равен focus.
  - СВ-3: иконки — пары `outline` / `baseline`.
  - Hairline: `1rem` или `1px`.
- **Вопросы фазы D** Q10–Q17.
- **Вопрос по кнопкам.** Закрывает ли «всё ок» по fab, extended-fab, icon и segmented их
  вопросы рекомендациями.
- **Роль drawer** рядом с развёрнутым рейлом.
- **Вопросы по компонентам** — в разделах «Открытые вопросы» каждого плана.
- **Сверка с каталогом M3:**
  - зазоры и углы групп кнопок для compact и comfortable (в Compose есть только Small);
  - side sheet (токенов в Compose нет);
  - ступени капсулы значения у slider.

## Как проверить

Открыть `components-should-update/index.md` и пройти по ссылкам: у каждого плана рядом рендеры `current` и
`concept`. Битых ссылок нет (проверено скриптом: 570 ссылок).
