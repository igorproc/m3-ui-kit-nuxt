# MConfirmEdit — in design

The component was removed on 2026-10-06 while its behavior is reworked. It is not
registered and not shipped as a component; this note only keeps the name reserved.

Why it was pulled:

- `presentation: 'auto'` checked a `medium` breakpoint that does not exist, so it never
  switched to the dialog form — the adaptive behavior was never actually working.
- Its slot API (`activator`, `editor`, `actions`, `conflict`, `error`) was undeclared, and
  its copy (`Save`, `Discard changes?`, conflict text) was hardcoded English.

The last implementation (component, `useConfirmEditTransaction`, token map) is in git:
`git show f5287e1 -- src/runtime/components/ui/confirm-edit src/runtime/composables/confirm-edit`.
