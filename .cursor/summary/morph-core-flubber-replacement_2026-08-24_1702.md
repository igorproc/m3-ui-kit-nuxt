# Morph core — replacing flubber (step 1)

## Context
`useShapeMorph` morphed M3 shapes via `flubber`, whose linear per-point lerp
collapses shapes that differ by rotation/scale, depends on browser
`getPointAtLength` (SSR-nondeterministic), and densifies to a variable, heavy
point count. All M3 shapes are single closed subpaths (`M/C/H/V/L/Z`), so the
heavy multi-subpath machinery of flubber/morphicons is unnecessary.

## What changed
New pure, deterministic, SSR-safe morph core (morphicons-inspired algorithm,
reimplemented in-house — no dependency, no vendoring):

- `src/runtime/utils/morph/parse.ts` — SVG path → cubic subpath (lines as
  degenerate cubics). Absolute `M L H V C Z` only; throws on anything else.
- `resample.ts` — arc-length resampling to fixed N with corner anchoring
  (8-pt Gauss-Legendre + Newton inversion). Intrinsic, deterministic.
- `align.ts` — closed-form 2D Procrustes (θ/σ via `atan2`) + circular/direction
  search for the single ring.
- `plan.ts` — precomputes centered A and B-in-A's-frame.
- `interpolate.ts` — polar interpolation `c(t)+σᵗ·R(tθ)·[(1−t)aC+t·bT]` into a
  preallocated buffer (real rotation, no collapse; zero per-frame alloc).
- `serialize.ts` — polyline in flight (2 decimals).
- `index.ts` — `createPathInterpolator(fromD, toD, { samples })`, snaps to the
  canonical `d` at `t≈0/1` (no endpoint pop). Default `samples = 96`.

`useShapeMorph.ts`: swapped `flubber.interpolate` → `createPathInterpolator`,
renamed option `maxSegmentLength` → `samples`. **Public API and both consumers
(`MShape`, `MLoading`) unchanged.**

`package.json`: removed `flubber` + `@types/flubber`.

## Verification
- `src/runtime/utils/morph/index.spec.ts` — endpoints exact, deterministic,
  closed polyline with N points, stays centered on square→diamond (no
  collapse), rejects unsupported syntax; every M3 shape samples to N finite
  points. 6/6 pass; shape + loading specs still green (17/17 total).
- `eslint` clean on the new files + composable.

## Follow-ups
- `npm install` to prune `flubber` from `package-lock.json` (code no longer
  imports it, so builds are unaffected; lockfile is just stale).
- Icon morphing in `MFabMenu` (plus→close) was explored and **rejected** — a
  curated `MORPH_ICONS` registry + `morphIcon` prop read as tech debt. Left
  `MFabMenu` on its existing CSS crossfade. Revisit only with a cleaner design.
- The core is icon-agnostic: `useShapeMorph` already takes any `d`, so future
  icon morphing needs no new component — just a target that toggles between two
  single-subpath `d` strings.
- If large-scale rendering shows mid-flight facets, raise `samples`.
