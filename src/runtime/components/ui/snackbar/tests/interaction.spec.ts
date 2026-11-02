import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import MSnackbar from '../index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { keydown, mountTracked, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const find = (selector: string) => document.querySelector<HTMLElement>(selector)

describe('m-snackbar · interaction', () => {
  describe('action', () => {
    it('emits `action`, then dismisses for the action and closes exactly once', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' } })
      await settle()

      find('.ui-snackbar__action')!.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('action')).toHaveLength(1)
      expect(wrapper.emitted('dismiss')).toEqual([['action']])
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('hands the action slot a dismiss of its own', async () => {
      const wrapper = await mountTracked(MSnackbar, {
        props: { modelValue: true, label: 'Saved' },
        slots: { action: ({ dismiss }: { dismiss: () => void }) => h('a', { class: 'open-link', href: '#', onClick: dismiss }, 'Open') },
      })
      await settle()

      find('.open-link')!.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('dismiss')).toEqual([['action']])
    })
  })

  describe('close', () => {
    it('closes from its close control and says so', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', closable: true, closeLabel: 'Скрыть' } })
      await settle()

      find('.ui-snackbar__close')!.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('dismiss')).toEqual([['close']])
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })
  })

  describe('duration', () => {
    it('closes by itself once its time is up', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', duration: 60 } })

      await wait(120)

      expect(wrapper.emitted('dismiss')).toEqual([['timeout']])
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('waits while the pointer is over it', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', duration: 200 } })
      await wait(20)

      find('.ui-snackbar__surface')!.dispatchEvent(new MouseEvent('mouseenter'))
      await wait(300)
      expect(wrapper.emitted('dismiss')).toBeUndefined()

      find('.ui-snackbar__surface')!.dispatchEvent(new MouseEvent('mouseleave'))
      await wait(300)
      expect(wrapper.emitted('dismiss')).toEqual([['timeout']])
    })

    it('waits while focus is inside it', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', actionLabel: 'Undo', duration: 200 } })
      await wait(20)

      find('.ui-snackbar__action')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      await wait(300)

      expect(wrapper.emitted('dismiss')).toBeUndefined()
    })

    it('runs no timer while there is no message to show', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: '', duration: 60 } })

      await wait(120)

      expect(wrapper.emitted('dismiss')).toBeUndefined()
    })

    it('stays until closed when indefinite', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', closable: true, closeLabel: 'Скрыть', duration: 'indefinite' } })

      await wait(120)

      expect(wrapper.emitted('dismiss')).toBeUndefined()
    })
  })

  describe('focus', () => {
    // M3 does not move focus into a snackbar, and Tab is never trapped in it.
    it('leaves focus where it was and lets Tab pass', async () => {
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      outside.focus()

      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' } })
      await settle()

      expect(document.activeElement).toBe(outside)
      const action = find('.ui-snackbar__action')!
      action.focus()
      expect(keydown(action, 'Tab').defaultPrevented).toBe(false)
      outside.remove()
    })
  })

  describe('inside a modal', () => {
    // An open modal makes everything outside it inert, so a snackbar raised
    // from inside the dialog has to live in the dialog to stay clickable.
    it('renders inside the modal it is opened from', async () => {
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, { modelValue: true }, {
          default: () => h(MSnackbar, { modelValue: true, label: 'Saved', actionLabel: 'Undo' }),
        }),
      })
      await mountTracked(Harness)
      await settle()

      expect(document.querySelector('dialog.ui-overlay .ui-snackbar__action')).not.toBeNull()
    })
  })
})
