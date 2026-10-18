import { ref, shallowRef, watch } from 'vue'
import { useTimer } from '#kit/composables/useTimer'

/** How long a message with an undo stays up — long enough to reach "Отменить". */
const SNACKBAR_DURATION_MS = 8000

/**
 * One snackbar for the whole dashboard. `MSnackbar` has no timeout of its own,
 * so the dismissal timer lives here.
 */
export function useCrmSnackbar() {
  const open = ref(false)
  const label = ref('')
  const canUndo = ref(false)
  const undoAction = shallowRef<(() => void) | null>(null)

  const timer = useTimer(() => {
    open.value = false
  }, { duration: SNACKBAR_DURATION_MS })

  function show(text: string, undo?: () => void) {
    label.value = text
    undoAction.value = undo ?? null
    canUndo.value = Boolean(undo)
    open.value = true
    timer.start()
  }

  function undo() {
    undoAction.value?.()
    undoAction.value = null
    canUndo.value = false
  }

  watch(open, (value) => {
    if (!value) timer.stop()
  })

  return { open, label, canUndo, show, undo }
}

export type CrmSnackbar = ReturnType<typeof useCrmSnackbar>
