/**
 * @module useTextareaResize
 *
 * @remarks
 * Height layer of the textarea: auto-growth, the user-draggable corner grip and
 * the CSS custom properties both of them drive. It owns no markup — a consumer
 * spreads `gripAttrs` onto whatever element draws the grip and `style` onto the
 * native `<textarea>`.
 *
 * Growth has exactly one mechanism per browser, never two at once:
 * - `field-sizing: content` (declared in SCSS) does the work where supported;
 * - otherwise `sync()` measures `scrollHeight` once per value change, and the
 *   `min-height`/`max-height` already resolved by CSS clamp the result.
 *
 * A height the user set by dragging always wins over growth — the field stops
 * moving under the cursor once it has been sized by hand, until {@link
 * UseTextareaResizeReturn.reset} is called (Escape on the grip).
 *
 * @example
 * ```ts
 * const element = shallowRef<HTMLTextAreaElement | null>(null)
 * const { gripAttrs, style } = useTextareaResize(element, props)
 * ```
 */
import { computed, readonly, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { IN_BROWSER } from '#kit/shared/constants/globals'

/** Fallback row height when the element is not laid out (SSR, jsdom). */
const FALLBACK_ROW_HEIGHT = 24

/** Rows added or removed per arrow key; Page steps by five. */
const KEYBOARD_STEP = 1
const KEYBOARD_PAGE_STEP = 5

const DEFAULT_ROWS = 3

/**
 * The height-related slice of `<MTextarea>`'s props. Pass the reactive props
 * object straight through — every read happens inside a computed, so a plain
 * object works too for a consumer that has no component around it.
 */
export interface TextareaResizeProps {
  /** Minimum (and initial) height in rows. @default 3 */
  rows?: number
  /** Growth ceiling in rows; `undefined` means uncapped. */
  maxRows?: number
  /** Grow with content instead of staying at `rows`. */
  autoGrow?: boolean
  /** Render an interactive grip the user can drag or arrow-key. */
  resizable?: boolean
  /** Freezes the grip without removing it from the accessibility tree. */
  disabled?: boolean
  /** Read-only fields accept no interaction either. */
  readonly?: boolean
  /** `aria-label` for the grip. @default 'Resize' */
  resizeLabel?: string
}

export interface TextareaGripAttrs {
  'role': 'separator'
  'tabindex': number
  'aria-orientation': 'horizontal'
  'aria-label': string
  'aria-valuenow': number
  'aria-valuemin': number
  'aria-valuemax': number | undefined
  'aria-disabled': 'true' | undefined
  'onPointerdown': (event: PointerEvent) => void
  'onKeydown': (event: KeyboardEvent) => void
}

export interface UseTextareaResizeReturn {
  /** Height in px once the user has sized the box, `null` while automatic. */
  height: Readonly<ShallowRef<number | null>>
  /** `true` while a pointer drag is in flight. */
  isResizing: Readonly<ShallowRef<boolean>>
  /** `true` once a manual height is committed — growth is frozen from then on. */
  hasManualHeight: ComputedRef<boolean>
  /** Current height expressed in rows — what the grip announces. */
  currentRows: ComputedRef<number>
  gripAttrs: ComputedRef<TextareaGripAttrs>
  /** Custom properties plus the resolved height for the native control. */
  style: ComputedRef<Record<string, string>>
  /** Drops the manual height and hands the box back to automatic growth. */
  reset: () => void
  /** Re-measures the auto-grown height (no-op where `field-sizing` works). */
  sync: () => void
}

/**
 * `field-sizing: content` makes the browser grow the box natively. Measured
 * once: the answer cannot change for the life of the document.
 */
const SUPPORTS_FIELD_SIZING = IN_BROWSER
  && typeof CSS !== 'undefined'
  && typeof CSS.supports === 'function'
  && CSS.supports('field-sizing', 'content')

function readPixels(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function useTextareaResize(
  element: Ref<HTMLTextAreaElement | null>,
  props: TextareaResizeProps,
): UseTextareaResizeReturn {
  const height = shallowRef<number | null>(null)
  const isResizing = shallowRef(false)

  const minRows = computed(() => Math.max(props.rows ?? DEFAULT_ROWS, 1))
  const maxRows = computed(() => props.maxRows === undefined
    ? undefined
    : Math.max(props.maxRows, minRows.value))

  const hasManualHeight = computed(() => height.value !== null)

  /** Live box metrics; falls back to a token-sized row before first layout. */
  function metrics() {
    const el = element.value

    if (!el || !IN_BROWSER) {
      return { row: FALLBACK_ROW_HEIGHT, chrome: 0 }
    }

    const style = window.getComputedStyle(el)
    const row = readPixels(style.lineHeight, FALLBACK_ROW_HEIGHT) || FALLBACK_ROW_HEIGHT
    const chrome = readPixels(style.paddingTop, 0)
      + readPixels(style.paddingBottom, 0)
      + readPixels(style.borderTopWidth, 0)
      + readPixels(style.borderBottomWidth, 0)

    return { row, chrome }
  }

  function toPixels(rowCount: number): number {
    const { row, chrome } = metrics()

    return rowCount * row + chrome
  }

  function toRows(pixels: number): number {
    const { row, chrome } = metrics()

    return Math.max(1, Math.round((pixels - chrome) / row))
  }

  function bounds() {
    return {
      min: toPixels(minRows.value),
      max: maxRows.value === undefined ? Number.POSITIVE_INFINITY : toPixels(maxRows.value),
    }
  }

  function clampHeight(pixels: number): number {
    const { min, max } = bounds()

    return Math.min(Math.max(pixels, min), max)
  }

  const currentRows = computed(() => height.value === null
    ? minRows.value
    : toRows(height.value))

  function reset() {
    height.value = null
  }

  function sync() {
    const el = element.value

    // Native growth already handles it; a manual height outranks growth.
    if (!el || !IN_BROWSER || SUPPORTS_FIELD_SIZING || !props.autoGrow || hasManualHeight.value) {
      return
    }

    el.style.height = 'auto'
    const measured = el.scrollHeight

    // jsdom and pre-layout paints report 0 — leave the CSS height in charge.
    if (measured > 0) {
      el.style.height = `${measured}px`
    }
  }

  function commit(pixels: number) {
    height.value = clampHeight(pixels)
  }

  function stepRows(delta: number) {
    const base = height.value ?? toPixels(currentRows.value)

    commit(base + delta * metrics().row)
  }

  const isInactive = computed(() => Boolean(props.disabled || props.readonly))
  const isInteractive = () => Boolean(props.resizable) && !isInactive.value

  function onPointerdown(event: PointerEvent) {
    const el = element.value

    if (!isInteractive() || !el || event.button !== 0) {
      return
    }

    // The grip is not a text control: keep the press from starting a selection
    // and from pulling focus off the textarea.
    event.preventDefault()

    const startY = event.clientY
    const startHeight = el.getBoundingClientRect().height

    isResizing.value = true

    const stopMove = useGlobalListener('document', 'pointermove', (moveEvent) => {
      commit(startHeight + ((moveEvent as PointerEvent).clientY - startY))
    })

    const finish = () => {
      isResizing.value = false
      stopMove()
      stopUp()
      stopCancel()
    }

    const stopUp = useGlobalListener('document', 'pointerup', finish)
    const stopCancel = useGlobalListener('document', 'pointercancel', finish)
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isInteractive()) {
      return
    }

    const { min, max } = bounds()

    const actions: Record<string, () => void> = {
      ArrowDown: () => stepRows(KEYBOARD_STEP),
      ArrowUp: () => stepRows(-KEYBOARD_STEP),
      PageDown: () => stepRows(KEYBOARD_PAGE_STEP),
      PageUp: () => stepRows(-KEYBOARD_PAGE_STEP),
      Home: () => commit(min),
      End: () => commit(Number.isFinite(max) ? max : toPixels(currentRows.value + KEYBOARD_PAGE_STEP)),
      Escape: reset,
    }

    const action = actions[event.key]

    if (!action) {
      return
    }

    event.preventDefault()
    action()
  }

  const gripAttrs = computed<TextareaGripAttrs>(() => ({
    'role': 'separator',
    'tabindex': isInactive.value ? -1 : 0,
    'aria-orientation': 'horizontal',
    'aria-label': props.resizeLabel ?? 'Resize',
    'aria-valuenow': currentRows.value,
    'aria-valuemin': minRows.value,
    'aria-valuemax': maxRows.value,
    'aria-disabled': isInactive.value ? 'true' : undefined,
    onPointerdown,
    onKeydown,
  }))

  const style = computed(() => {
    const declarations: Record<string, string> = {
      '--m-textarea-rows': String(minRows.value),
    }

    if (maxRows.value !== undefined) {
      declarations['--m-textarea-max-rows'] = String(maxRows.value)
    }

    if (height.value !== null) {
      declarations.height = `${height.value}px`
    }

    return declarations
  })

  // Growth follows the width of the box as well as its value, so observe the
  // element itself instead of subscribing every instance to `window` resize.
  watch(element, (el, _previous, onCleanup) => {
    if (!el || !IN_BROWSER || SUPPORTS_FIELD_SIZING || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => sync())
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  }, { immediate: true })

  return {
    height: readonly(height) as Readonly<ShallowRef<number | null>>,
    isResizing: readonly(isResizing) as Readonly<ShallowRef<boolean>>,
    hasManualHeight,
    currentRows,
    gripAttrs,
    style,
    reset,
    sync,
  }
}
