# MAlert (vuetify-run phase 3) — 2026-07-16

## Что сделано

Реализован первый компонент фазы 3 по плану
`.cursor/plans/feature/vuetify-run/alert.md`. Plan переведён в
`state="done"`, счётчики в `index.md` обновлены (29 done / 13 planned).

### kit

- `app/assets/stylesheet/components/alert/_index.scss` — единственная вложенная
  `$tokens` map. Хелперы `alert-tonal()` / `alert-outlined()` собирают
  container/content/icon/outline + close state layers (8% hover, 12% pressed,
  38% disabled) через `color-mix` с интерполяцией Sass-значений.
- `app/components/ui/alert/props.ts` — `MAlertType`, `MAlertVariant`,
  `MAlertAnnounce`, типы слотов. Без свободного `color` prop: severity —
  единственный источник цвета, иконки и live-region семантики.
- `app/components/ui/alert/index.vue` — композиция `MSurface` + `MIcon` +
  `MButtonIcon` (все импортированы явно). `defineModel<boolean>` + `close`
  только на явное действие пользователя.
- `tests/alert.spec.ts` — 12 кейсов (severity/variant, icon resolution,
  slot precedence, aria-labelledby/describedby, close vs external hide,
  close slot, actions). Зелёные; eslint + stylelint — 0 ошибок.

### docs_v2

- `server/content/{en,ru}/components/alert.json` — страница по schemaVersion 2.
- `server/content/tokens/alert.json` — ручной token manifest (`extends`:
  surface, button).
- `app/components/docs/example/alert.vue`, `example/alert-interactive.vue`,
  `playground/alert-playground.vue`.
- `shared/constants/component-catalog.json` — добавлен `alert` (Feedback),
  после чего `npm run docs:sync` + `docs:validate` проходят (20 файлов, 2 локали).

## Ключевые решения

- **Severity → semantic role.** Генерируемая MD3-схема не даёт выделенных
  success/warning ролей, поэтому mapping объявлен явно в alert tokens:
  `info → secondary`, `success → tertiary`, `warning → primary`,
  `error → error`. Это **открытый review gate** для человека.
- **`announce="off"`** рендерит `role="group"` (именованная секция без
  объявлений), а не полное отсутствие семантики.
- **Close через `MButtonIcon`**, но цвета/state layers переопределяются alert
  токенами по селектору `.ui-alert--<variant>.ui-alert--<type> .ui-alert__close.ui-button`
  (0,4,0) — детерминированный порядок вместо зависимости от порядка стилей.
- **Wrapping без media queries:** `content-min-width` (240rem) как flex-basis;
  actions падают под текст, когда контейнер сужается.

## Следующий шаг

Фаза 3 по roadmap: `MAvatar` (plan `avatar.md`, state `planned`), затем
`MBanner`, `MBreadcrumbs`, `MChipGroup`, `MListSubheader`. Пустые каталоги
`app/assets/stylesheet/components/{avatar,list-subheader}/` уже существуют, но
реализации в них нет.

## Не проверено

Визуальная проверка в браузере не выполнялась (по конвенции dev server не
запускается автономно) — нужен человек для скриншотов светлой/тёмной темы и
контраста severity-контейнеров.
