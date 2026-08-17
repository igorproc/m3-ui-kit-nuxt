/**
 * @module avatar
 *
 * @remarks
 * Pure initials derivation for `<MAvatar>`. Kept free of component and
 * reactive state so SSR and client produce identical output for the same
 * input, and so consumers can reuse it for their own identity surfaces.
 */

/**
 * Splits a string into grapheme clusters.
 *
 * `Intl.Segmenter` is the only correct source of clusters (emoji sequences,
 * combining marks, Hangul). Where it is unavailable the fallback iterates code
 * points: surrogate pairs stay intact, but a ZWJ sequence or a base character
 * with combining marks may count as more than one cluster.
 */
function graphemes(value: string, locale?: string): string[] {
  const Segmenter = Intl.Segmenter
  if (!Segmenter) return Array.from(value)

  const segments = new Segmenter(locale, { granularity: 'grapheme' }).segment(value)
  return Array.from(segments, segment => segment.segment)
}

function toUpper(value: string, locale?: string): string {
  return locale ? value.toLocaleUpperCase(locale) : value.toUpperCase()
}

/**
 * Derives at most two grapheme clusters of initials from a person or entity
 * name.
 *
 * Multi-word names use the first cluster of the first and last words; a single
 * word uses at most its first two clusters. Output stays in logical order, so
 * RTL scripts render correctly instead of being reversed.
 *
 * @param name - Raw display name; whitespace is normalized.
 * @param locale - Locale used for grapheme segmentation and upper-casing.
 * @returns Upper-cased initials, or an empty string for an empty name.
 */
export function getAvatarInitials(name: string, locale?: string): string {
  const normalized = (name ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  const words = normalized.split(' ')
  const first = graphemes(words[0]!, locale)

  if (words.length === 1) return toUpper(first.slice(0, 2).join(''), locale)

  const last = graphemes(words.at(-1)!, locale)
  return toUpper(`${first[0] ?? ''}${last[0] ?? ''}`, locale)
}
