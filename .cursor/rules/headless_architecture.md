# Headless Architecture & Shared Primitives

Companion to [m3_architecture.md](file:///d:/dev/primetime/ui/kit/.cursor/rules/m3_architecture.md)
(SCSS axis) and [migration_workflow.md](file:///d:/dev/primetime/ui/kit/.cursor/rules/migration_workflow.md).
This doc covers the **logic axis**: splitting components into headless logic + thin
view, and the Phase 0 shared primitives that replace ad-hoc `provide`/`inject` and
raw DOM listeners. See the refactor tracker in
[plan.md](file:///d:/dev/primetime/ui/kit/plan.md).

## 1. The thin-view contract

A component is split into two halves:

- **Headless logic** — a `create*`/`use*` factory under `app/composables/<name>/`.
  Owns all state, derivations and the FSM. **Never binds DOM events itself** — only
  the ported wrappers (`useEventListener`, `useGlobalListener`, `useClickOutside`)
  touch the DOM. Returns refs/computeds/handlers.
- **Thin view** — the `.vue`. Attaches listeners, juggles styling variants, passes
  `props`/`emit` through to the composable, renders slots. No business logic.

Reference split: public `app/components/ui/slider/index.vue` plus private
`app/components/fragments/slider/` leaves (`root/` `track/` `range/` `thumb/`
`hidden-input/`), backed by
`app/composables/slider/createSlider.ts`. Fat/"god" components get decomposed into
a thin `index.vue` orchestrator plus small single-responsibility leaf folders.

`.vue` file order stays `<template>` → `<script setup>` → `<style>`.

## 2. Context — parent↔children coordination

Use `createContext` (`shared/utils/createContext.ts`) instead of raw
`provide`/`inject` Symbols. It throws on a missing provider, killing silent
`undefined` bugs.

```ts
const [useTabs, provideTabs] = createContext<TabsContext>('m3:tabs')
// parent: provideTabs({ select, selectedId })
// child:  const tabs = useTabs()   // throws if no <MTabs> ancestor
```

- **Always namespace the key** as `m3:<name>` (the dev build warns otherwise).
- **Nullable contexts** (a root with no parent, or an optional ancestor) pass a
  default so injection returns `null` instead of throwing — see
  `useModal` (`m3:modal`) and `useLayout` (`m3:layout`, `m3:layout-area`).
- Use it for component-local trees: tabs, radio-group, accordion, menus, list.

### ⚠ Never for theme

There is exactly **one** global theme — the Pinia store `app/store/theme.ts`. Do
**not** create `provideTheme`/`useTheme` or any per-subtree theme context. Per-tree
theme provision is forbidden (see plan.md guardrails).

## 3. DOM listeners — no raw `addEventListener` in `.vue`

Every global/element listener routes through a primitive with automatic cleanup.
No bare `addEventListener`/`onMounted`+`removeEventListener` pairs in components.

| Need | Use | File |
| --- | --- | --- |
| Element/window/document listener, auto-cleanup on unmount | `useEventListener` (+ `useWindowEventListener`, `useDocumentEventListener`) | `app/composables/useEventListener.ts` |
| One shared global listener fanned out to many consumers (`scroll`/`resize`/`pointermove`) | `useGlobalListener` | `app/composables/useGlobalListener.ts` |
| Outside-click dismissal (popovers, menus, sheets) | `useClickOutside` | `app/composables/useClickOutside.ts` |
| Overlay z-index ordering (menu/dialog/tooltip/snackbar/sheet) | `useStack` | `app/composables/useStack.ts` |

All four are SSR-safe (no-op on the server) and clean up via `onScopeDispose`, so
they are safe to call directly in `<script setup>`.

```ts
// outside-click + global reposition for a popover
const panel = useTemplateRef<HTMLElement>('panel')
useClickOutside(panel, () => (isOpen.value = false))
useGlobalListener('window', 'scroll', reposition, { passive: true })

// overlay stacking
const stack = useStack()
const ticket = stack.register({ onDismiss: () => (isOpen.value = false) })
watch(isOpen, v => (v ? ticket.select() : ticket.unselect()))
// :style="{ zIndex: ticket.zIndex.value }"
```

## 4. Auto-import note

`shared/**`, `app/composables/**` and `app/utils/**` are auto-imported (see
`nuxt.config.ts`). Reactivity APIs, hooks, composables and utils need no import.
**Other UI components must still be imported explicitly** — do not rely on
auto-import for them inside the library.

Component visibility is path-based:

- `app/components/ui/**` contains only public `M*` components;
- `app/components/fragments/**` contains private leaves and is never scanned;
- `app/components/core/**` contains internal runtime infrastructure;
- only `.vue` files participate in component scanning;
- component unit tests are co-located with their owner as `index.spec.ts`.

A private leaf is always imported explicitly from `~/components/fragments/...`.
Public family children remain inside their owning `ui/<family>/` directory.

## 5. Checklist per refactor

- [ ] Logic lives in a `create*`/`use*` factory; the `.vue` is thin.
- [ ] No raw `addEventListener` / manual `provide`/`inject` Symbols left.
- [ ] Context keys namespaced `m3:<name>`; nullable ones pass a default.
- [ ] Slots exposed for any content the component customises.
- [ ] SCSS migrated to the `$tokens` + `g()` system (see m3_architecture.md).
- [ ] `npm run lint` and `npm run lint:style` at 0 errors.
