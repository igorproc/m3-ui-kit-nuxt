# Phase 1 complete — 1.4–1.8 (2026-06-04)

Built in parallel by two coordinated sub-agents (animation/gesture cluster +
form cluster), reviewed and lint-verified by the coordinator. All files pass
`npx eslint` (0 errors) and the two `.vue` files pass `npx stylelint` (0 errors).

## 1.4 `useDrag` — `app/composables/useDrag.ts`
Kit-native Pointer-Events drag gesture (mouse/touch/pen, one path). `pointerdown`
on the target via `useEventListener`; `pointermove`/`pointerup`/`pointercancel`
on `window` via `useGlobalListener` **only while dragging** (stop fns kept).
`threshold`/`axis`/`disabled` as `MaybeRefOrGetter`; readonly `dx`/`dy`/`isDragging`;
`onStart` fires once at threshold crossing; `cancel()` aborts without `onEnd`.
For slider (2.21) + sheet (2.14).

## 1.6 `useRaf` + `useTimer` — `app/composables/useRaf.ts`, `useTimer.ts`
Faithful 1:1 ports from v0 (`#v0` imports → `~~/shared/...`, `@see` lines dropped).
`useRaf`: cancel-then-request, callable + `cancel`/`isActive`, scope-disposed,
SSR-safe. `useTimer`: start/stop/pause/resume, reactive `remaining`,
`MaybeRefOrGetter<duration>` re-read on `start()`, one-shot/`repeat`. For
loading/shape/progress (2.22–2.24).

## 1.7 `useFormBuilder` refactor — `app/composables/useFormBuilder.ts`
All `any` removed: `validationSchema: AnyObjectSchema`, `initialValues:
Partial<TValues>`, generic `TValues extends Record<string, unknown>`,
`resolveInitialValues(schema: AnyObjectSchema | undefined)` with a typed
`field.type` switch (`YupFieldType` union). Bare `console.error` dropped — failure
surfaces solely via the existing `throw` rethrow when no `onError`. Public API
(`useFormBuilder`/`defineFormBuilder`/`resolveInitialValues`/`InferFormValues`/
`FormBuilderOptions`/`FormBuilderReturn`) preserved. One justified, commented `as`
cast remains on `initialValues` to satisfy vee-validate's generic.

## 1.5 `useField` — `app/composables/useField.ts`
Consolidates the duplicated vee-validate wiring (path → conditional `useField`,
two-way model↔field watch, `errorMessage`). `useField({ path, model,
validateOnValueUpdate })` → `{ errorMessage, hasError, meta }`. `path` read once at
setup; absent → inert (no validation, `errorMessage` undefined). Components are
**not** migrated onto it yet (radio 2.3 / checkbox 2.18 / text-field 2.17).

## 1.8 `useFormSchema` + `<MFormRenderer>`
- `app/composables/useFormSchema.ts` — declarative `FieldRules` descriptor
  (`required`/`min`/`max`/`email`/`pattern`) mapped to yup internally (defensive:
  string-only rules guarded), type-appropriate initial values, delegates to
  `useFormBuilder`. Returns `{ schema, form, fields }`.
- `app/components/ui/form-renderer/index.vue` — `<MFormRenderer :config :onSubmit>`
  orchestrator; `<form @submit.prevent="form.submit">`, default submit slot.
- `app/components/ui/form-renderer/field/index.vue` — per-type leaf, passes
  `:path="field.name"` so each input's path-based validation participates.

### ⚠ Caveats to resolve in Phase 2 (carried from agent reports)
- **`textarea`** → falls back to `<MTextField>` (no dedicated textarea component).
- **`search`** → mapped to `<MTextField>`: `MSearch` exists but has **no `path`
  prop / no vee-validate wiring**, so it can't validate yet. Revisit in 2.19.
- **`switch`** → `<MSwitch>` accepts `path` but only forwards it as the input
  `name`; it does **not** call vee-validate `useField`. Validation will sync once
  switch is refactored onto `useField` in 2.20.
- Styling in both `.vue` is layout-only; matches the kit's `1rem = 1px` convention
  (e.g. `gap: 16rem` = 16px), no theme colors hardcoded.

## Phase 1 status
**1.1–1.8 all complete.** Foundations: `shared/utils/{createContext,createTrinity,
guards,helpers,toArray,logger}`, `shared/constants/globals`, `shared/types/registry`.
Composables: registry chain (`app/composables/registry/*`), `popover/usePopover`,
`useEventListener`/`useGlobalListener`/`useStack`/`useClickOutside`, `useRaf`/
`useTimer`/`useDrag`, `useField`/`useFormBuilder`/`useFormSchema`, `<MFormRenderer>`.

## Verification
`npx eslint` 0 errors on all 8 Phase-1.4–1.8 files; `npx stylelint` 0 on the 2
`.vue`. (`npm run lint:style` globs the whole repo → 249 pre-existing errors in
unrelated legacy components, untouched.) No dev server run — composables/renderer
are not yet wired into pages, so nothing browser-observable changed. No commits.

## Next
Phase 2 — per-component refactors (SCSS migration + wiring components onto the
Phase-1 primitives). Starts with the selection/group cluster (tabs 2.1 …).
