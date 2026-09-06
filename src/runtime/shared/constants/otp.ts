/**
 * @module otp
 *
 * @remarks
 * Facts about how the one-time-code field works — deliberately not the defaults
 * a consumer picks. Those belong to the prop that exposes them, because a
 * default living in two places is a default that will eventually disagree with
 * itself, and only one of the two copies shows up in the API table.
 *
 * What is left here is what no prop configures.
 */

/** What `mask: true` draws. Not a default — it is what masking means. */
export const OTP_MASK_CHARACTER = '•'

/**
 * The attribute the whole component exists for — it is what lets the platform
 * offer a code straight from an SMS. Never make it configurable.
 */
export const OTP_AUTOCOMPLETE = 'one-time-code'

/** Which characters each mode accepts. */
export const OTP_ALPHABET = {
  numeric: /\d/,
  alphanumeric: /[0-9a-z]/i,
} as const

/** Virtual keyboard each mode asks for. */
export const OTP_INPUT_MODE = {
  numeric: 'numeric',
  alphanumeric: 'text',
} as const

/**
 * Decimal digit blocks that `NFKC` does not fold into ASCII, with the codepoint
 * of their zero. A code pasted from an Arabic-language SMS arrives in these.
 */
export const OTP_DIGIT_BLOCKS = [
  { pattern: /[\u0660-\u0669]/g, zero: 0x0660 },
  { pattern: /[\u06F0-\u06F9]/g, zero: 0x06F0 },
] as const
