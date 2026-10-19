# M3-polish — брифы прогона (2026-10-18)

Прогон по всем компонентам, переделанным в ветке `components/redisign-update`: дух M3, «прыгает /
бегает не в ту сторону», кастомизация, минимизация стилей и логики. Команда — 5 Opus-воркеров и
Haiku-дирижёр, который один держит dev-сервер, Playwright и браузер.

## Файлы

| Файл | Кому | ~токенов |
|---|---|---|
| `00-common.md` | всем воркерам | ~20k |
| `11-buttons.md` | `w1-buttons` | ~11k |
| `12-containment-data.md` | `w2-containment-data` | ~10k |
| `13-fields.md` | `w3-fields` | ~11k |
| `14-select-files.md` | `w4-select-files` | ~11k |
| `15-pickers-color.md` | `w5-pickers-color` | ~10k |
| `90-conductor.md` | `conductor` (только он) | ~4k |
| `audit/<группа>.md` | пишут воркеры в фазе P1 | — |

Воркер читает `00-common.md` + свой `1N-*.md` + 4 главы `docs/system/en-US` (~11k) — около 42k из
лимита 70k (оценка по символам).

## Решения владельца, на которых стоит прогон

- Аудит без правок → развилки владельцу по одной → реализация утверждённого автономно.
- 5 Opus + 1 Haiku; браузер (Playwright + встроенная панель) — только у дирижёра.
- Морф: плавно там, где он уже есть; статичные формы состояний остаются статичными.
- `modern-web-guidance` — обязательный первый шаг перед HTML/CSS/JS (PowerShell, `npx.cmd`).
- MMenu / popover — вне объёма.
- Коммиты делает владелец.

## Порядок запуска (оркестратор)

P0 — подготовка (после «погнали»):
1. `playground/e2e/probe.ts` — `traceMotion`, `analyzeMotion`, `shootStates`, `saveProbe` (API — §2.5
   `00-common.md`).
2. `playwright.probe.config.ts` (testDir `playground/probes`, `*.probe.ts`, reuse :3200, 1 worker).
3. `playground/probes/_conductor/look.probe.ts` (шаги из `LOOK_SPEC`) и
   `playground/probes/_baseline/sweep.probe.ts` (карта скачков по фикстурам ветки).
4. `/playground/probes/` в `.git/info/exclude`.
5. `.cursor/temp/m3-polish/css-sizes.mjs` — читает `playground/.output/public/_nuxt/*.css`,
   относит файл к компоненту по его блоку `.ui-<name>`, пишет байты и gzip (вне git).
6. Каталоги `.cursor/temp/m3-polish/{queue/req,queue/res,queue/work,baseline}`.
7. Запуск дирижёра: prod-сборка `npx nuxi build playground` на HEAD → `css-sizes.mjs` →
   `baseline/css-sizes.json` (метрика минимизации — выходной CSS компонента) → dev-сервер →
   `READY` → `BASELINE` → свод `baseline/<группа>.md`.

P1–P3 — запуск воркеров (параллельно), ростер `.cursor/temp/m3-polish/roster.md`, аудит → развилки →
реализация (воркеры продолжаются через `SendMessage` с их контекстом) → полный прогон на prod-сборке
→ ревью diff по группам → интеграция, `docs/system`, summary, память.

## Стартовый промт воркера

```text
Ты — <id> (группа <имя>) в прогоне M3-polish кита PrimeTime, D:\dev\primetime\ui\kit.
Твой системный контекст — два файла целиком:
  D:\dev\primetime\ui\kit\.cursor\handoff\m3-polish\00-common.md
  D:\dev\primetime\ui\kit\.cursor\handoff\m3-polish\<1N-группа>.md
Затем docs/system/en-US/{craft,color-and-state,behavior,decisions}.md.
Дирижёр: id <conductor-id> (заявки — §2.4 общего брифа). Ростер: .cursor/temp/m3-polish/roster.md.
Базовая карта скачков твоей группы: .cursor/temp/m3-polish/baseline/<группа>.md.
Фаза сейчас: P1 — аудит. src/ не правишь. Результат — .cursor/handoff/m3-polish/audit/<группа>.md
по шаблону §5.5 и короткий финальный ответ (§12.1). Браузер, dev-сервер и Playwright — только
через дирижёра.
```

## Стартовый промт дирижёра

```text
Ты — conductor в прогоне M3-polish кита PrimeTime. Твой контекст — файл целиком:
  D:\dev\primetime\ui\kit\.cursor\handoff\m3-polish\90-conductor.md
Сделай §6: подними dev-сервер (§2.1), поставь сторожа очереди (§3.1), ответь READY.
```
