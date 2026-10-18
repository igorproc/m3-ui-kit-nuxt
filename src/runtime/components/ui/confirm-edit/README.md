# MConfirmEdit — not a component

The component was removed on 2026-10-06 and is not coming back as a component for now
(plan `inputs/confirm-edit.md`, question 1, option 2): until two products need the same
markup, the kit ships the behavior, not the layout.

What ships instead is `useConfirmEditTransaction` (`composables/confirm-edit/`): a draft
taken when the edit begins, `commit()` resolving to `saved | cancelled | conflict | error`,
`cancel()` aborting a save in flight through an `AbortSignal`, and an outside change under a
dirty draft turned into a conflict (`keepDraft()` / `takeExternal()`).

The recipe — a field of the field family, `MButtonIcon` confirm (tonal) and cancel
(standard), `MLoading` while `pending`, a polite live region that says the outcome, Enter to
commit, Escape to cancel, focus back on the "Edit" button after a save — belongs in the docs.

The last component implementation is in git:
`git show f5287e1 -- src/runtime/components/ui/confirm-edit src/runtime/composables/confirm-edit`.
