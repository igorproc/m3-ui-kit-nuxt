# Checklist

## Before writing anything

1. **Does the system already answer this?** Which family does the component join, and which
   of its axes apply unchanged? Derivation beats invention — if you are drawing rather than
   deriving, find the missing rule first.
2. **Which axes does it need?** Take them from [axes.md](axes.md). A new axis is a system
   change: name it, justify it, and expect to answer for it in more than one component.
3. **Is any prop a collapsed enum?** Expand it now, not after it ships.
4. **Who is the customer for every variant?** No customer, no variant.
5. **Which external constraints bind here?** Accessibility minimums, native element
   behaviour, platform limits. Name at least one, or you are in the taste zone — stop and
   ask.
6. **Has any of this been decided before?** Check [decisions.md](decisions.md).

## While building

- Native element first; draw over it rather than reimplementing it.
- Behaviour into a control composable, presentation into the component
  ([behavior.md](behavior.md)). Templates stay thin.
- Colour by role only, from the table in [color-and-state.md](color-and-state.md).
- All five states, `color-mix` at 8% / 12%, one property per state, never colour-only.
- Tokens via `g($t, 'dot.path')` — dot form, whole file, no exceptions.
- No hardcoded values, no local `$colour` variables, no runtime custom properties for
  colour or state. Live geometry is the only exception.
- Components that host content expose `<slot />`s.
- Inside the library, import other UI components **explicitly**; auto-import is for
  composables, utils and reactivity APIs only.
- A new Pinia store needs explicit human approval. Prefer `useState()` and
  `provide`/`inject`.

## Before calling it done

```bash
npm run lint && npm run lint:style && npm run lint:scss && npm run test
```

- `lint:scss` is the only thing that compiles SFC Sass — a broken mixin arity or a dead
  token path reaches the consumer's dev server otherwise. It fails on deprecations too.
- Check the compiled CSS actually contains rules for the state modifiers you added. Tests
  assert DOM and classes; they cannot see that a token path resolved to `null`.
- Regenerate the docs manifests (`docs:sync`) so the new axes appear in the prop tables.
- Write the summary in `.cursor/summary/<short-description>_<timestamp>.md`.

## Definition of done

State plainly: what changed (file list), how to verify it, what assumptions were made and
where they could be wrong, what is left, and what the risks are.

Say explicitly when a change is CSS-heavy and was **not** looked at in a browser — the test
suite reads DOM and classes, so a visual regression passes it untouched. Dev servers are
started by a human; ask.
