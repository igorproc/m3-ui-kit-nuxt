import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import MDialog from '../index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

async function mount(props: Record<string, unknown> = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const Harness = defineComponent({
    setup: () => () => h(MDialog, {
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

describe('m-dialog · a11y', () => {
  describe('role', () => {
    it('is a native modal <dialog>, without an invented role', async () => {
      await mount({ title: 'Confirm' })

      expect(dialog().hasAttribute('role')).toBe(false)
      expect(dialog().getAttribute('aria-modal')).toBe('true')
    })
  })

  describe('alertdialog', () => {
    it('becomes an alertdialog described by its body', async () => {
      await mount({ title: 'Delete file?', role: 'alertdialog' })

      expect(dialog().getAttribute('role')).toBe('alertdialog')
      const describedBy = dialog().getAttribute('aria-describedby')!
      expect(document.getElementById(describedBy)!.classList).toContain('ui-dialog__content')
    })

    // A form in the body read out whole is worse than silence.
    it('leaves a plain dialog undescribed', async () => {
      await mount({ title: 'Edit profile' })

      expect(dialog().hasAttribute('aria-describedby')).toBe(false)
    })
  })

  describe('naming', () => {
    it('is named by its headline', async () => {
      await mount({ title: 'Confirm' })

      const headlineId = dialog().getAttribute('aria-labelledby')!
      expect(document.getElementById(headlineId)?.textContent?.trim()).toBe('Confirm')
      expect(dialog().hasAttribute('aria-label')).toBe(false)
    })

    // The kit ships no English copy: an untitled dialog is named by its caller.
    it('invents no name for an untitled dialog', async () => {
      await mount()

      expect(dialog().hasAttribute('aria-label')).toBe(false)
      expect(dialog().hasAttribute('aria-labelledby')).toBe(false)
    })

    it('is named by the title slot', async () => {
      const model = ref(true)
      const Harness = defineComponent({
        setup: () => () => h(MDialog, { 'modelValue': model.value, 'onUpdate:modelValue': (v: boolean) => { model.value = v } }, {
          title: () => 'Rename',
          default: () => 'Body',
        }),
      })
      await mountTracked(Harness)
      await settle()

      expect(document.getElementById(dialog().getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Rename')
    })

    it('takes the caller’s aria-label when it has no title', async () => {
      await mount({ 'aria-label': 'Подтверждение' })

      expect(dialog().getAttribute('aria-label')).toBe('Подтверждение')
    })

    // The missing-name warning is guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; it cannot be asserted here.
  })

  describe('focus', () => {
    it('takes focus while open and gives it back on close', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      const { model } = await mount({ modelValue: false, title: 'Confirm' })
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
