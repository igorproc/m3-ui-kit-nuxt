import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import MSheet from '../index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

async function mount(props: Record<string, unknown> = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const Harness = defineComponent({
    setup: () => () => h(MSheet, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
    }, { default: () => h('button', { class: 'inside' }, 'Inside') }),
  })
  await mountTracked(Harness)
  await settle()
  return { model }
}

const dialog = () => overlayHost().querySelector<HTMLDialogElement>('dialog.ui-overlay')!

describe('m-sheet · a11y', () => {
  describe('role', () => {
    it('is a native modal <dialog>', async () => {
      await mount()

      expect(dialog().hasAttribute('role')).toBe(false)
      expect(dialog().getAttribute('aria-modal')).toBe('true')
    })

    it('takes an accessible name through attrs', async () => {
      await mount({ 'aria-label': 'Share' })

      expect(dialog().getAttribute('aria-label')).toBe('Share')
    })

    it('takes an accessible name through the aria-label prop', async () => {
      await mount({ ariaLabel: 'Поделиться' })

      expect(dialog().getAttribute('aria-label')).toBe('Поделиться')
    })

    it('invents no name of its own', async () => {
      await mount()

      expect(dialog().hasAttribute('aria-label')).toBe(false)
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })

  describe('decoration', () => {
    // Escape and the scrim close the sheet from the keyboard; the handle is a pointer affordance.
    it('hides the drag handle from assistive tech', async () => {
      await mount()

      expect(overlayHost().querySelector('.ui-sheet__drag-handle')!.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('focus', () => {
    it('takes focus while open and gives it back on close', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      const { model } = await mount({ modelValue: false })
      model.value = true
      await settle()
      expect(dialog().contains(document.activeElement)).toBe(true)

      model.value = false
      await settle()
      expect(document.activeElement).toBe(opener)
      opener.remove()
    })
  })
})
