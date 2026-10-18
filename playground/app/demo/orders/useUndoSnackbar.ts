import { ref, watch } from 'vue'

const VISIBLE_MS = 6000

/**
 * One snackbar for the whole dashboard. MSnackbar has no timeout of its own,
 * so the kit's `useTimer` closes it; the timer is disposed with the scope.
 */
export function useUndoSnackbar() {
  const open = ref(false)
  const message = ref('')
  const actionLabel = ref('')
  let undo: (() => void) | null = null

  const timer = useTimer(() => {
    open.value = false
  }, { duration: VISIBLE_MS })

  watch(open, (value) => {
    if (!value) timer.stop()
  })

  function show(text: string, onUndo?: () => void) {
    message.value = text
    actionLabel.value = onUndo ? 'Отменить' : ''
    undo = onUndo ?? null
    open.value = true
    timer.start()
  }

  function runAction() {
    undo?.()
    undo = null
  }

  return { open, message, actionLabel, show, runAction }
}

export type UndoSnackbar = ReturnType<typeof useUndoSnackbar>
