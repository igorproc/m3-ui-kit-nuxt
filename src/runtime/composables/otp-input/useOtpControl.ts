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
 * - {@link useOtpCaret} — the caret mapped onto the drawn cells
 * - `useOtpControl` — those plus focus, ids and ARIA, markup-agnostic
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
import { computed, shallowRef, useId } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useField } from '#kit/composables/useField'
import { useTimer } from '#kit/composables/useTimer'
import { useOtpCaret } from '#kit/composables/otp-input/useOtpCaret'
import { useOtpValue } from '#kit/composables/otp-input/useOtpValue'
import type { OtpValueHooks, OtpValueProps, UseOtpValueReturn } from '#kit/composables/otp-input/useOtpValue'
import { OTP_AUTOCOMPLETE, OTP_INPUT_MODE, OTP_MASK_CHARACTER, OTP_MASK_REVEAL } from '#kit/shared/constants/otp'

/** When typed characters are hidden; see `MOtpInputMask`. */
export type OtpMaskMode = false | 'last' | 'always'

export interface OtpControlProps extends OtpValueProps {
  label?: string
  name?: string
  /** Validation-adapter path. Evaluated once at setup; absent means inert. */
  path?: string
  error?: boolean
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** A check is running (typically after `complete`): the code is held still. */
  loading?: boolean
  autofocus?: boolean
  /** When characters are hidden. */
  mask?: OtpMaskMode
  /** Per-cell pattern for empty cells; see {@link OtpCell.hint}. */
  placeholder?: string
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
  /** The placeholder pattern's character for this cell; drawn only while it is empty. */
  hint: string
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
  'required': boolean
  'autofocus': boolean
  'aria-busy': 'true' | undefined
  'aria-required': 'true' | undefined
  'aria-labelledby': string
  'aria-invalid': 'true' | undefined
  'aria-describedby': string | undefined
  'onFocus': (event: FocusEvent) => void
  'onBlur': () => void
  'onClick': (event: MouseEvent) => void
  'onBeforeinput': (event: InputEvent) => void
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
  /** Focus the field and select the whole code, so the next keystroke starts a new one. */
  selectAll: () => void
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
  const { activeIndex, syncCaret, watchCaret, stopWatchingCaret, focusAt, selectAll, registerCell, cellAt } = useOtpCaret({
    element,
    model,
    focused,
    disabled: () => Boolean(props.disabled),
  })

  const value = useOtpValue(model, props, hooks)
  const field = useField({ path: props.path, model })

  const isError = computed(() => Boolean(props.error) || Boolean(props.errorMessage) || field.hasError.value)
  const message = computed(() => field.errorMessage.value || props.errorMessage)

  const maskMode = computed<OtpMaskMode>(() => props.mask ?? false)

  // `last` leaves the newest character readable for a moment, so a mistyped
  // digit can be caught before it disappears behind the mask.
  const revealIndex = shallowRef<number | null>(null)
  const revealTimer = useTimer(() => {
    revealIndex.value = null
  }, { duration: OTP_MASK_REVEAL })

  function reveal(index: number | null) {
    if (maskMode.value !== 'last') return

    revealIndex.value = index
    if (index === null) revealTimer.stop()
    else revealTimer.start()
  }

  function revealNewest(previous: string, next: string, caret: number | null) {
    reveal(next.length === previous.length + 1 && caret ? caret - 1 : null)
  }

  const hintFor = (index: number) => props.placeholder?.[index] ?? props.placeholder?.[0] ?? ''

  const isMasked = (index: number, character: string) => character !== ''
    && maskMode.value !== false
    && !(maskMode.value === 'last' && revealIndex.value === index)

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
        masked: isMasked(index, character),
        maskCharacter: OTP_MASK_CHARACTER,
        hint: character === '' ? hintFor(index) : '',
      }
    },
  )))

  function applyInput(target: HTMLInputElement) {
    const previous = model.value
    const committed = value.commit(target.value)

    // The DOM value is rewritten to the sanitized one, which also collapses the
    // selection to the end — so the caret is read back after, not before.
    target.value = committed
    syncCaret(target.selectionStart)
    revealNewest(previous, committed, target.selectionStart)
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

  // `maxlength` refuses a keystroke into a full code. Typed inside it, the
  // character replaces the one under the caret instead — fixing one digit is
  // one keystroke; paste and SMS autofill go through `input` as before.
  function overwriteFullCode(event: InputEvent) {
    const target = event.target as HTMLInputElement
    if (event.inputType !== 'insertText' || !event.data || target.readOnly || target.disabled) return

    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? start
    if (start !== end || start >= target.value.length || target.value.length < value.length.value) return

    event.preventDefault()
    const typed = value.sanitize(event.data).value
    if (!typed) {
      value.commit(target.value + event.data)
      return
    }

    const committed = value.commit(target.value.slice(0, start) + typed + target.value.slice(start + typed.length))
    const caret = Math.min(start + typed.length, committed.length)
    target.value = committed
    target.setSelectionRange(caret, caret)
    syncCaret(caret)
    reveal(caret - 1)
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
    'required': Boolean(props.required),
    'autofocus': Boolean(props.autofocus),
    'aria-busy': props.loading || field.meta.pending ? 'true' : undefined,
    'aria-required': props.required ? 'true' : undefined,
    'aria-labelledby': labelId,
    'aria-invalid': isError.value ? 'true' : undefined,
    'aria-describedby': message.value ? messageId : undefined,
    'onFocus': (event: FocusEvent) => {
      focused.value = true
      watchCaret()

      // A code that came back wrong is retyped, not edited: with all of it
      // selected the first keystroke starts the new code, and `maxlength` no
      // longer blocks typing into a full field. A click that follows still
      // puts the caret on the cell under the pointer.
      if (value.isComplete.value && isError.value) {
        (event.target as HTMLInputElement).select()
        activeIndex.value = 0
      }
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
    'onBeforeinput': overwriteFullCode,
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
    'ref': registerCell(index),
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
    selectAll,
    inputAttrs,
    labelAttrs,
    supportAttrs,
    cellAttrs,
    value,
  }
}
