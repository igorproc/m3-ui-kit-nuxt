/**
 * @module useNumberValue
 *
 * @remarks
 * Value layer of the number input: the draft-string ⇄ numeric-model loop, and
 * nothing else. It owns parsing, formatting, stepping and range clamping, and
 * knows nothing about ARIA, classes or markup.
 *
 * Two rules drive the design:
 *
 * - **A draft is not a value.** While the user types, the visible string is
 *   authoritative; the model only follows when the draft parses. `"-"`, `"1."`
 *   and `""` are legitimate intermediate states, not errors.
 * - **Never clamp on a keystroke.** A field that rewrites `1` to the minimum
 *   `10` while the user is on their way to `100` is broken. Clamping happens on
 *   commit (blur / Enter) and on stepping, never on input.
 *
 * @example
 * ```ts
 * const model = defineModel<number | null>({ default: null })
 * const focused = ref(false)
 * const value = useNumberValue(model, focused, props, {
 *   onStep: (direction, next) => emit(direction > 0 ? 'increment' : 'decrement', next),
 *   onInvalid: (draft, reason) => emit('invalid', draft, reason),
 * })
 * ```
 */
import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import {
  clampNumber,
  createNumberCodec,
  precisionFromStep,
  roundDecimal,
} from '#kit/shared/utils/number'
import type { NumberCodec, NumberInputInvalidReason } from '#kit/shared/utils/number'

/**
 * The props `<MNumberInput>` hands over. Read inside computeds, so the
 * component's reactive props object stays tracked — and a plain `reactive({})`
 * works just as well for a consumer with no component around it.
 */
export interface NumberValueProps {
  min?: number
  max?: number
  step?: number
  precision?: number
  locale?: string
  useGrouping?: boolean
  /** Pull committed values back inside `min`/`max`. @default true */
  clamp?: boolean
  disabled?: boolean
  readonly?: boolean
}

export interface NumberValueHooks {
  /** Fired after a successful step, with the direction and the resulting value. */
  onStep?: (direction: -1 | 1, value: number) => void
  /** Fired when a commit rejects the draft, or pulls it back into range. */
  onInvalid?: (draft: string, reason: NumberInputInvalidReason) => void
}

export interface UseNumberValueReturn {
  /** The visible string. Two-way bound to the input; may hold an unparsable draft. */
  draft: Ref<string>
  /** `step` coerced to a positive number — a zero or negative step would freeze the field. */
  safeStep: ComputedRef<number>
  /** Decimal places, from the `precision` prop or inferred from `step`. */
  precision: ComputedRef<number>
  codec: ComputedRef<NumberCodec>
  /** The model, or the nearest sensible anchor when it is empty. */
  currentValue: ComputedRef<number>
  canDecrement: ComputedRef<boolean>
  canIncrement: ComputedRef<boolean>
  nextDecrement: ComputedRef<number>
  nextIncrement: ComputedRef<number>
  /** Whether a bound exists to jump to (drives Home/End). */
  hasMin: ComputedRef<boolean>
  hasMax: ComputedRef<boolean>
  /** Apply one step; `multiplier` covers PageUp/PageDown and scrub modifiers. */
  step: (direction: -1 | 1, multiplier?: number) => void
  /** Set an absolute value through the same normalization as stepping (used by scrub). */
  set: (value: number) => void
  toMin: () => void
  toMax: () => void
  /** Parse the draft and write it back formatted. Clamps. */
  commit: (display?: boolean) => void
  /** Re-render the draft from the model, discarding an in-flight edit. */
  restore: (display?: boolean) => void
  /** Roll the value back to the last committed one — the Escape path. */
  revert: (display?: boolean) => void
  onInput: () => void
  onCompositionStart: () => void
  onCompositionEnd: () => void
  onFocus: () => void
  onBlur: () => void
}

/**
 * Binds a nullable numeric model to an editable draft string.
 *
 * @param model The numeric model; `null` means empty, never `NaN`.
 * @param focused Focus state — decides whether values render grouped (display) or bare (edit).
 * @param props Reactive props bag, see {@link NumberValueProps}.
 * @param hooks Optional bridges for the component's `increment`/`decrement`/`invalid` emits.
 */
export function useNumberValue(
  model: Ref<number | null>,
  focused: Ref<boolean>,
  props: NumberValueProps,
  hooks: NumberValueHooks = {},
): UseNumberValueReturn {
  const composing = ref(false)
  const dirty = ref(false)

  // The model follows the draft keystroke by keystroke, so it cannot double as
  // the undo target: by the time Escape is pressed it already holds the typed
  // value. This is the value to come back to.
  const committed = ref<number | null>(model.value)

  const safeStep = computed(() => (props.step && props.step > 0 ? props.step : 1))
  const precision = computed(() => props.precision ?? precisionFromStep(safeStep.value))
  const codec = computed(() => createNumberCodec({
    locale: props.locale,
    useGrouping: props.useGrouping,
    precision: precision.value,
  }))

  const draft = ref(codec.value.format(model.value))

  const hasMin = computed(() => props.min !== undefined)
  const hasMax = computed(() => props.max !== undefined)
  const isInactive = computed(() => Boolean(props.disabled || props.readonly))

  // An empty field still has to step somewhere: the lower bound is the least
  // surprising anchor, and zero when the range is open.
  const currentValue = computed(() => model.value ?? props.min ?? 0)

  const nextDecrement = computed(() => peek(-1))
  const nextIncrement = computed(() => peek(1))
  const canDecrement = computed(() => !isInactive.value
    && (props.min === undefined || currentValue.value > props.min))
  const canIncrement = computed(() => !isInactive.value
    && (props.max === undefined || currentValue.value < props.max))

  function normalize(value: number, clamp: boolean) {
    const rounded = roundDecimal(value, precision.value)
    return clamp ? clampNumber(rounded, props.min, props.max) : rounded
  }

  function peek(direction: -1 | 1, multiplier = 1) {
    return normalize(currentValue.value + direction * safeStep.value * multiplier, true)
  }

  function render(value: number | null, display: boolean) {
    draft.value = codec.value.format(value, display ? 'display' : 'edit')
    dirty.value = false
  }

  function write(next: number, display = !focused.value) {
    model.value = next
    committed.value = next
    render(next, display)
  }

  function step(direction: -1 | 1, multiplier = 1) {
    if (isInactive.value) return

    const next = peek(direction, multiplier)
    write(next)
    hooks.onStep?.(direction, next)
  }

  function set(value: number) {
    if (isInactive.value) return

    write(normalize(value, true))
  }

  function toMin() {
    if (isInactive.value || props.min === undefined) return
    write(props.min)
  }

  function toMax() {
    if (isInactive.value || props.max === undefined) return
    write(props.max)
  }

  function restore(display = !focused.value) {
    render(model.value, display)
  }

  function commit(display = !focused.value) {
    const parsed = codec.value.parse(draft.value)

    if (!parsed.ok) {
      // An empty field is a legitimate value (`null`), not a rejected draft.
      if (parsed.reason === 'empty') {
        model.value = null
        committed.value = null
        draft.value = ''
        dirty.value = false
        return
      }

      hooks.onInvalid?.(draft.value, parsed.reason)
      restore(display)
      return
    }

    const raw = normalize(parsed.value, false)
    const next = props.clamp === false ? raw : clampNumber(raw, props.min, props.max)

    // Report the pull-back so the consumer can explain it in the support line —
    // silently rewriting a number the user typed is the thing the spec forbids.
    if (next !== raw) {
      hooks.onInvalid?.(draft.value, 'out-of-range')
    }

    model.value = next
    committed.value = next
    render(next, display)
  }

  function revert(display = !focused.value) {
    model.value = committed.value
    render(committed.value, display)
  }

  function onInput() {
    dirty.value = true
    if (composing.value) return

    const parsed = codec.value.parse(draft.value)
    // Deliberately unclamped: the model follows the draft keystroke by keystroke,
    // and the range is only enforced when the value is committed.
    if (parsed.ok) model.value = normalize(parsed.value, false)
  }

  function onCompositionStart() {
    composing.value = true
  }

  function onCompositionEnd() {
    composing.value = false
    onInput()
  }

  function onFocus() {
    focused.value = true
    committed.value = model.value
    render(model.value, false)
  }

  function onBlur() {
    commit(true)
    focused.value = false
  }

  // An external write wins, unless the user is mid-edit — reformatting a draft
  // under the caret is how fields eat keystrokes.
  watch(model, (value) => {
    if (focused.value && dirty.value) return
    render(value, !focused.value)
  })

  watch(codec, () => restore())

  return {
    draft,
    safeStep,
    precision,
    codec,
    currentValue,
    canDecrement,
    canIncrement,
    nextDecrement,
    nextIncrement,
    hasMin,
    hasMax,
    step,
    set,
    toMin,
    toMax,
    commit,
    restore,
    revert,
    onInput,
    onCompositionStart,
    onCompositionEnd,
    onFocus,
    onBlur,
  }
}
