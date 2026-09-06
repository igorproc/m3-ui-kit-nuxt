/**
 * @module useOtpValue
 *
 * @remarks
 * Value layer of the one-time-code field: what counts as a character, how many
 * of them there are, and how they split into groups. It owns no DOM and no
 * ARIA.
 *
 * The code is a **single string**, never an array of per-cell values. That is
 * what lets the field be one real `<input>` behind a grid of drawn cells, which
 * in turn is what makes paste, SMS autofill and the caret work without being
 * re-implemented.
 *
 * @example
 * ```ts
 * const model = defineModel<string>({ default: '' })
 * const value = useOtpValue(model, props, {
 *   onComplete: code => emit('complete', code),
 *   onInvalid: (raw, rejected) => emit('invalid', raw, rejected),
 * })
 * ```
 */
import { computed, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { OTP_ALPHABET, OTP_DIGIT_BLOCKS } from '#kit/shared/constants/otp'

/** Half-open `[start, end)` slice of the code that renders as one group. */
export interface OtpRange {
  start: number
  end: number
}

/**
 * The resolved configuration, not a wish list. `length` and `mode` are required
 * on purpose: their defaults belong to `<MOtpInput>`'s props, and a fallback
 * here would be a second copy of the same decision — one that no API table
 * shows and that nothing keeps in step.
 */
export interface OtpValueProps {
  /** Number of characters in the code. Coerced to at least one. */
  length: number
  /**
   * Which characters are accepted. Spelled out rather than imported so this
   * layer stays free of the component; the public alias is `OtpInputMode` in
   * `components/ui/otp-input/props.ts`, and the two must agree.
   */
  mode: 'numeric' | 'alphanumeric'
  /** Group sizes, e.g. `[3, 3]`. Absent means one group; ignored unless they add up to `length`. */
  groups?: number[]
}

export interface OtpValueHooks {
  /** Fired once, on the transition from incomplete to full. */
  onComplete?: (value: string) => void
  /** Fired when a non-empty code becomes empty. */
  onClear?: () => void
  /** Fired with the raw input and the characters that were dropped from it. */
  onInvalid?: (raw: string, rejected: string[]) => void
}

export interface OtpSanitizeResult {
  value: string
  rejected: string[]
}

export interface UseOtpValueReturn {
  length: ComputedRef<number>
  ranges: ComputedRef<OtpRange[]>
  /** `true` once every position is filled. */
  isComplete: ComputedRef<boolean>
  /** Filter raw text down to acceptable characters without touching the model. */
  sanitize: (raw: string) => OtpSanitizeResult
  /** Sanitize, write the model, fire the hooks. Returns what was written. */
  commit: (raw: string) => string
}

/**
 * Binds a code string to a length, an alphabet and a grouping.
 *
 * @param model The code. Always a plain string of accepted characters.
 * @param props Reactive props bag, see {@link OtpValueProps}.
 * @param hooks Bridges for the component's `complete` / `clear` / `invalid` emits.
 */
export function useOtpValue(
  model: Ref<string>,
  props: OtpValueProps,
  hooks: OtpValueHooks = {},
): UseOtpValueReturn {
  const length = computed(() => Math.max(1, Math.floor(props.length)))

  const ranges = computed<OtpRange[]>(() => {
    const sizes = (props.groups ?? []).filter(size => Number.isInteger(size) && size > 0)
    const total = sizes.reduce((sum, size) => sum + size, 0)

    // A grouping that does not add up would silently hide or duplicate cells,
    // so an inconsistent one is dropped rather than partially honoured.
    if (!sizes.length || total !== length.value) {
      return [{ start: 0, end: length.value }]
    }

    let start = 0

    return sizes.map((size) => {
      const range = { start, end: start + size }
      start += size

      return range
    })
  })

  const isComplete = computed(() => model.value.length === length.value)

  function sanitize(raw: string): OtpSanitizeResult {
    const normalized = OTP_DIGIT_BLOCKS.reduce(
      (text, block) => text.replace(block.pattern, char => String(char.charCodeAt(0) - block.zero)),
      raw.normalize('NFKC'),
    )

    const allowed = OTP_ALPHABET[props.mode]
    const characters = Array.from(normalized)

    return {
      value: characters.filter(char => allowed.test(char)).join('').slice(0, length.value),
      rejected: characters.filter(char => !allowed.test(char)),
    }
  }

  function commit(raw: string) {
    const previous = model.value.length
    const { value, rejected } = sanitize(raw)

    model.value = value

    if (rejected.length) {
      hooks.onInvalid?.(raw, rejected)
    }

    if (previous < length.value && value.length === length.value) {
      hooks.onComplete?.(value)
    }

    if (previous > 0 && value.length === 0) {
      hooks.onClear?.()
    }

    return value
  }

  watch(length, (next) => {
    if (model.value.length > next) {
      model.value = model.value.slice(0, next)
    }
  })

  return { length, ranges, isComplete, sanitize, commit }
}
