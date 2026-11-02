# Showcase run (2026-10-20)

Experiment: five apps built on the kit to measure whether beautiful responsive products can be built today,
how convenient it is and which bricks are missing. Kit was read-only; nothing in `src/` changed by this run.

- Knowledge file for agents: `.cursor/handoff/showcase/kit-context.md` (~50k tokens, generated API via the
  docs_v3 extractor + condensed docs/system, layout, setup, known issues).
- Apps: `D:\dev\primetime\ui\showcase\apps\{mail,store,tasks,finance,home}` (no git), each with `FINDINGS.md`.
- Team: 3 Opus workers + Haiku QA (only QA ran dev servers / Playwright via `showcase/qa/shoot.mjs`), 10 QA requests.
- Result: `.cursor/handoff/showcase/report.md` — verdict, missing bricks ranked by apps affected, new kit bugs
  (`m-tabs` mount selection, `m-progress` expressive hydration, chip-group scroll, snackbar under layout,
  `m-layout-main` focusability, slider value formatter), responsive notes, proposed next steps.
- Note: the wave-1 merge `64fb4dc` broke `useShapeMorph.ts`; the owner repaired it in the working tree
  (`merge-wave-1-fix_2026-10-20.md`) during the run.
