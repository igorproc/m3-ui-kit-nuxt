import type { Ref } from 'vue'

/**
 * Parts that take a press of their own: the control itself, a button or link
 * in a slot, a chip's remove button, a label (it activates its control
 * natively), a grip. The box leaves them alone.
 */
const OWN_PRESS = 'input, textarea, select, button, a[href], label, [tabindex], [contenteditable="true"]'

export interface FieldBoxPress {
  onPointerdown: (event: PointerEvent) => void
  onClick: (event: MouseEvent) => void
}

function ownsPress(event: Event): boolean {
  return (event.target as Element | null)?.closest(OWN_PRESS) != null
}

/**
 * Makes the whole drawn box of a field act as its native control (M3: the
 * container is the hit target). A press on the padding, a decorative icon or
 * the area under an overlaid label focuses the control without starting a text
 * selection, and the click is passed on to it, so a composite that opens its
 * menu on the control's click opens it from anywhere in the box.
 *
 * @param control The native `<input>` / `<textarea>`.
 * @returns Listeners for the element that draws the box.
 */
export function createFieldBoxPress(control: Readonly<Ref<HTMLElement | null>>): FieldBoxPress {
  return {
    onPointerdown: (event) => {
      if (event.button !== 0 || ownsPress(event)) return

      event.preventDefault()
      control.value?.focus()
    },
    onClick: (event) => {
      if (ownsPress(event)) return

      control.value?.click()
    },
  }
}
