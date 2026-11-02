/**
 * Whether a keydown belongs to an input method rather than to the widget: a
 * key that picks or confirms a candidate must not move a list or choose a row.
 *
 * `isComposing` covers Chrome, Firefox and Edge. Safari delivers
 * `compositionend` before the Enter that confirms the text (WebKit 165004), so
 * that Enter arrives with `isComposing` already `false` and only its legacy
 * `keyCode` 229 tells it apart. The 229 check stays under the Enter gate: a
 * virtual keyboard reports 229 for ordinary characters too (modern-web,
 * ime-safe-enter-submit).
 */
export function isImeKeydown(event: KeyboardEvent): boolean {
  return event.isComposing || (event.key === 'Enter' && event.keyCode === 229)
}
