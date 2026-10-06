/**
 * @module useOtpControl
 *
 * @remarks
 * Behavior layer of the one-time-code field. Composes the value loop with the
 * caret, the focus state and every ARIA relationship into ready-to-spread attr
 * bags — `inputAttrs`, `labelAttrs`, `supportAttrs`, `cellAttrs(index)` — plus
 * the cell grid the view renders. It produces no classes and no `data-*`.
 *
 * The field is layered the same way the textarea and the number input are:
 * - {@link useOtpValue} — alphabet, length, grouping
 * - `useOtpControl` — that plus caret, focus, ids and ARIA, markup-agnostic
 * - `<MOtpInput>` — one possible markup on top of this composable
 *
 * The cells it hands back are decorations: the value lives in one real input,
 * so every cell is `aria-hidden` and assistive tech sees a single field.
 *
 * @example
 * ```vue
 * <label v-bind="labelAttrs">One-time code</label>
 * <span v-for="cell in group" v-bind="cellAttrs(cell.index)">{{ cell.character }}</span>
 * <input ref="element" v-bind="inputAttrs">
 * ```
 */
import { computed, onScopeDispose, shallowRef, useId } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { useOtpValue } from '#kit/composables/otp-input/useOtpValue'
import type { OtpValueHooks, OtpValueProps, UseOtpValueReturn } from '#kit/composables/otp-input/useOtpValue'
import { OTP_AUTOCOMPLETE, OTP_INPUT_MODE, OTP_MASK_CHARACTER } from '#kit/shared/constants/otp'

export interface OtpControlProps extends OtpValueProps {
  label?: string
  name?: string
  path?: string
  error?: boolean
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  /** A check is running (typically after `complete`): the code is held still. */
  loading?: boolean
  autofocus?: boolean
  /** `true` masks with the default bullet; a string masks with that character. */
  mask?: boolean | string
}

/** One drawn position. Purely descriptive — the real value is in the input. */
export interface OtpCell {
  index: number
  /** 1-based, for anything user-facing. */
  position: number
  character: string
  filled: boolean
  active: boolean
  error: boolean
  disabled: boolean
  readonly: boolean
  /** `true` when this cell should render `maskCharacter` instead of its value. */
  masked: boolean
  maskCharacter: string
}

export interface OtpInputAttrs {
  'id': string
  'value': string
  'name': string | undefined
  'inputmode': (typeof OTP_INPUT_MODE)[keyof typeof OTP_INPUT_MODE]
  'autocomplete': typeof OTP_AUTOCOMPLETE
  'maxlength': number
  'disabled': boolean
  'readonly': boolean
  'autofocus': boolean
  'aria-busy': 'true' | undefined
  'aria-labelledby': string
  'aria-invalid': 'true' | undefined
  'aria-describedby': string | undefined
  'onFocus': () => void
  'onBlur': () => void
  'onClick': (event: MouseEvent) => void
  'onInput': (event: Event) => void
  'onPaste': (event: ClipboardEvent) => void
  'onCompositionstart': () => void
  'onCompositionend': (event: CompositionEvent) => void
}

export interface OtpLabelAttrs {
  id: string
  for: string
}

export interface OtpSupportAttrs {
  id: string
  /**
   * Constant on purpose: a live region has to exist before its text changes,
   * so the element stays mounted and only its content comes and goes.
   */
  role: 'alert'
}

export interface OtpCellAttrs {
  'aria-hidden': 'true'
  /** Registers the drawn cell, so a click on the input above it can find it. */
  'ref': (element: unknown) => void
  'onClick': () => void
}

export interface UseOtpControlReturn {
  element: ShallowRef<HTMLInputElement | null>
  fieldId: string
  /** Cells split into groups, ready for a nested `v-for`. */
  groups: ComputedRef<OtpCell[][]>
  isComplete: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  message: ComputedRef<string | undefined>
  /** Put the caret on a position and focus the field. */
  focusAt: (index: number) => void
  inputAttrs: ComputedRef<OtpInputAttrs>
  labelAttrs: ComputedRef<OtpLabelAttrs>
  supportAttrs: ComputedRef<OtpSupportAttrs>
  cellAttrs: (index: number) => OtpCellAttrs
  /** The underlying value layer, for consumers that need the raw controls. */
  value: UseOtpValueReturn
}

/**
 * Binds a code string to one input, a caret and a grid of drawn cells.
 *
 * @param model The code.
 * @param focused The component-owned focus model.
 * @param props Reactive props bag, see {@link OtpControlProps}.
 * @param hooks Bridges for the component's `complete` / `clear` / `invalid` emits.
 * @param fieldId Stable id; generated when omitted.
 */
export function useOtpControl(
  model: Ref<string>,
  focused: Ref<boolean>,
  props: OtpControlProps,
  hooks: OtpValueHooks = {},
  fieldId: string = useId() ?? 'm-otp-input',
): UseOtpControlReturn {
  const element = shallowRef<HTMLInputElement | null>(null)
  const labelId = `${fieldId}-label`
  const messageId = `${fieldId}-message`

  const composing = shallowRef(false)
  const activeIndex = shallowRef(0)
  const cells = new Map<number, Element>()

  const value = useOtpValue(model, props, hooks)

  const isError = computed(() => Boolean(props.error) || Boolean(props.errorMessage))
  const message = computed(() => props.errorMessage)
  const maskCharacter = computed(() => (typeof props.mask === 'string' ? props.mask : OTP_MASK_CHARACTER))

  const groups = computed(() => value.ranges.value.map(range => Array.from(
    { length: range.end - range.start },
    (_, offset): OtpCell => {
      const index = range.start + offset
      const character = model.value[index] ?? ''

      return {
        index,
        position: index + 1,
        character,
        filled: character !== '',
        // Only a focused field has a live position: otherwise a half-typed code
        // would look focused while the caret is somewhere else entirely.
        active: focused.value && activeIndex.value === index,
        error: isError.value,
        disabled: Boolean(props.disabled),
        readonly: Boolean(props.readonly),
        masked: character !== '' && Boolean(props.mask),
        maskCharacter: maskCharacter.value,
      }
    },
  )))

  // Caret positions outnumber cells by one: a code of six has seven of them,
  // and the seventh sits past the last cell. Clamping it onto the last cell
  // made a full field light one up for no reason, and ate the first ArrowLeft —
  // the caret moved 6 → 5 while the clamped index stayed at 5.
  function syncCaret(caret: number | null) {
    activeIndex.value = caret ?? model.value.length
  }

  // `selectionchange` is the only event that reports every way a caret moves:
  // a held arrow key repeats `keydown` and fires `keyup` once, so watching keys
  // left the highlight frozen until release and then jumped it to the end.
  // It covers the pointer, drag-selection and programmatic moves as well.
  let stopCaretWatch: (() => void) | undefined

  function watchCaret() {
    stopCaretWatch ??= useGlobalListener('document', 'selectionchange', () => {
      // `focused` is this composable's own source of truth for liveness — the
      // same flag the cells read — so the guard cannot disagree with them.
      if (!focused.value) return

      syncCaret(element.value?.selectionStart ?? null)
    })
  }

  function stopWatchingCaret() {
    stopCaretWatch?.()
    stopCaretWatch = undefined
  }

  onScopeDispose(stopWatchingCaret, true)

  function applyInput(target: HTMLInputElement) {
    const committed = value.commit(target.value)

    // The DOM value is rewritten to the sanitized one, which also collapses the
    // selection to the end — so the caret is read back after, not before.
    target.value = committed
    syncCaret(target.selectionStart)
  }

  // `maxlength` cuts a paste down to the length *before* it is sanitised, so a
  // code sent as "123-456" or "123 456" arrived one digit short. The paste is
  // spliced into the value here and sanitised whole instead.
  function applyPaste(event: ClipboardEvent) {
    const target = event.target as HTMLInputElement
    const pasted = event.clipboardData?.getData('text') ?? ''
    if (!pasted || target.readOnly || target.disabled) return

    event.preventDefault()

    const start = target.selectionStart ?? target.value.length
    const end = target.selectionEnd ?? start
    const committed = value.commit(target.value.slice(0, start) + pasted + target.value.slice(end))
    const caret = Math.min(committed.length, start + value.sanitize(pasted).value.length)

    target.value = committed
    target.setSelectionRange(caret, caret)
    syncCaret(caret)
  }

  function focusAt(index: number) {
    if (props.disabled) return

    // The caret cannot stand past the typed text, so neither can the highlight.
    const caret = Math.min(index, model.value.length)

    element.value?.focus()
    element.value?.setSelectionRange(caret, caret)
    activeIndex.value = caret
  }

  /** The drawn cell under a horizontal pointer position: the one containing it, else the nearest. */
  function cellAt(x: number) {
    let nearest: { index: number, distance: number } | undefined

    for (const [index, cell] of cells) {
      const { left, right } = cell.getBoundingClientRect()
      const distance = x < left ? left - x : x > right ? x - right : 0
      if (!nearest || distance < nearest.distance) nearest = { index, distance }
    }

    return nearest?.index
  }

  const inputAttrs = computed<OtpInputAttrs>(() => ({
    'id': fieldId,
    'value': model.value,
    'name': props.name ?? props.path,
    'inputmode': OTP_INPUT_MODE[props.mode],
    // The one attribute this component exists for: it is what lets the platform
    // offer a code straight from an SMS.
    'autocomplete': OTP_AUTOCOMPLETE,
    'maxlength': value.length.value,
    'disabled': Boolean(props.disabled),
    'readonly': Boolean(props.readonly) || Boolean(props.loading),
    'autofocus': Boolean(props.autofocus),
    'aria-busy': props.loading ? 'true' : undefined,
    'aria-labelledby': labelId,
    'aria-invalid': isError.value ? 'true' : undefined,
    'aria-describedby': message.value ? messageId : undefined,
    'onFocus': () => {
      focused.value = true
      watchCaret()
    },
    'onBlur': () => {
      focused.value = false
      stopWatchingCaret()
    },
    // The input lies over the whole grid, so it takes every click, and its own
    // caret would land wherever the invisible text happens to reach. The cell
    // drawn under the pointer decides instead.
    'onClick': (event: MouseEvent) => {
      const index = cellAt(event.clientX)
      if (index !== undefined) focusAt(index)
    },
    'onInput': (event: Event) => {
      if (composing.value) return

      applyInput(event.target as HTMLInputElement)
    },
    'onPaste': applyPaste,
    'onCompositionstart': () => {
      composing.value = true
    },
    'onCompositionend': (event: CompositionEvent) => {
      composing.value = false
      applyInput(event.target as HTMLInputElement)
    },
  }))

  const labelAttrs = computed<OtpLabelAttrs>(() => ({
    id: labelId,
    for: fieldId,
  }))

  const supportAttrs = computed<OtpSupportAttrs>(() => ({
    id: messageId,
    role: 'alert',
  }))

  const cellAttrs = (index: number): OtpCellAttrs => ({
    // The value is carried by the input; the grid is a picture of it.
    'aria-hidden': 'true',
    'ref': (cell) => {
      if (cell instanceof Element) cells.set(index, cell)
      else cells.delete(index)
    },
    'onClick': () => focusAt(index),
  })

  return {
    element,
    fieldId,
    groups,
    isComplete: value.isComplete,
    isError,
    message,
    focusAt,
    inputAttrs,
    labelAttrs,
    supportAttrs,
    cellAttrs,
    value,
  }
}
