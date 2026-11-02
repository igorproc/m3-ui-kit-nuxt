# Repairing the wave-1 merge (2026-10-20)

Merge `64fb4dc` brought `origin/feat/components-update-wave-1` (`be02c6a`, 2026-10-07) into
`components/redisign-update` (`3f7446b`, 2026-10-20). Base `ff6844f`. 13 files changed on both
sides; no files were lost or resurrected. The older branch lost wherever the two contradict.

## What was broken

- `composables/useShapeMorph.ts` did not parse (two copies of `buildInterpolator` /
  `getInterpolator`, duplicate import) — the build stopped there.
- `useShapeMorph.spec.ts` was theirs whole; our reduced-motion tests were gone.
- `MIconName` typing from theirs was half applied: timeline divider and item, fab-menu
  `openIcon`/`closeIcon` back to `String`; avatar typed but without the import.
- `segmented/props.ts` got their `interface MSegmentedItem` beside our `type MSegmentedItem`;
  `split/props.ts` got back `UiSplitMenuItem`, which ours had removed.
- `messages.ts` got back the five `dropdown*` strings ours had removed (no users).

## Resolution

- `useShapeMorph`: ours (reduced motion = calm curve without the swing via `useReducedMotion`,
  an interrupted morph unwinds from the live angle, no `easeM3Standard`) plus their bounded
  interpolator cache shared by all instances. Spec = our two reduced-motion tests + their
  motion, cache and server tests; their reduced-motion block (asserting an untouched
  `transition`) was dropped as it contradicts ours.
- `MIconName` applied everywhere theirs meant it, including where ours moved the type
  (`SegmentedItem.icon` in `useSegmentedButton`), `useAvatar`, file-upload item status icons,
  and the playground demos / timeline fixture that now feed typed props.
- `reduceTransition` stays exported from `utils/motion` (theirs, tested) but nothing uses it.
- `MESSAGES.hotkeyKeys` (theirs) stays: the hotkey labels use it, although newer components
  ship no copy.

## Checks (clean checkout)

`npm run build`, `lint`, `lint:style`, `lint:scss`, `typecheck`, `vitest run` — all green,
2125 tests. Local-only `playground/render/**` (excluded in `.git/info/exclude`) still has
pre-existing lint/type errors against the current API; its icon typing was fixed in place.
