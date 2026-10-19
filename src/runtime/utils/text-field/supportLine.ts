import { getCurrentInstance } from 'vue'

const hyphenate = (name: string) => name.replace(/\B([A-Z])/g, '-$1').toLowerCase()

/**
 * Reads whether the parent passed a prop to the current component: the key is
 * in its vnode props, camelCase or kebab-case, whatever the value — `false`
 * and `undefined` included (bound, but empty for now). Call the reader while
 * rendering: the vnode is the latest one, so a binding the parent adds or
 * drops later is seen, and the server's first frame is already right.
 *
 * Must be created in `setup`.
 */
export function useBoundProp(): (name: string) => boolean {
  const instance = getCurrentInstance()

  return (name) => {
    const passed = instance?.vnode.props

    return Boolean(passed && (name in passed || hyphenate(name) in passed))
  }
}

/** The props of a field that decide whether its support line can say anything. */
export interface SupportLineProps {
  helperText?: string
  /** A validation-adapter path: an error can arrive from the adapter. */
  path?: string
  required?: boolean
}

/** The slots that can fill the support line. */
export interface SupportLineSlots {
  helper?: unknown
  error?: unknown
}

/**
 * Whether a field reserves its support line (owner's decision 2026-10-19):
 * only when something can appear in it — a helper text, an adapter path, a
 * required mark, a helper or error slot, or `error` / `errorMessage` bound by
 * the parent even while empty. Without any of them no error can arrive, so the
 * line and its live region are not rendered at all, and the field takes no room
 * below its box.
 *
 * Must be created in `setup`; the returned reader is called while rendering.
 */
export function useSupportLine(props: SupportLineProps, slots: SupportLineSlots): () => boolean {
  const isBound = useBoundProp()

  return () => Boolean(props.helperText || props.path || props.required || slots.helper || slots.error)
    || isBound('error')
    || isBound('errorMessage')
}
