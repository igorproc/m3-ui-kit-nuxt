/**
 * @module utils/focus/focusAfterRemoval
 *
 * @remarks
 * A block that holds focus and leaves the page (a dismissed alert) would drop
 * focus to `<body>` (WCAG 2.4.3). These helpers pick where it goes instead: the
 * next focusable element after the block, else the nearest heading before it,
 * which takes focus without entering the Tab order.
 */
import { getFocusableElements } from '#kit/composables/overlay/useFocusTrap'

const FOLLOWING = 4
const PRECEDING = 2

/** Read while `el` is still in the document. */
export function focusTargetAfter(el: HTMLElement): HTMLElement | null {
  const outside = (node: HTMLElement) => !el.contains(node)
  const after = getFocusableElements(document.body)
    .find(node => outside(node) && (el.compareDocumentPosition(node) & FOLLOWING) !== 0)
  if (after) return after

  const headings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .filter(node => outside(node) && (el.compareDocumentPosition(node) & PRECEDING) !== 0)
  return headings.at(-1) ?? null
}

export function focusWithoutTabStop(target: HTMLElement) {
  if (!target.hasAttribute('tabindex') && !getFocusableElements(target.parentElement ?? document.body).includes(target))
    target.tabIndex = -1
  target.focus()
}
