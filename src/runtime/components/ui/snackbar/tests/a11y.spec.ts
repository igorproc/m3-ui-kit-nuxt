import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import MSnackbar from '../index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

/** Past the region's clear-then-write delay. */
const announced = () => new Promise(resolve => setTimeout(resolve, 150))
const politeRegions = (root: ParentNode = document) => Array.from(root.querySelectorAll('.ui-live-region__polite'))

describe('m-snackbar · a11y', () => {
  describe('live region', () => {
    // A region mounted together with its text is not reliably announced.
    it('has a status region in its layer before any message', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: false, label: 'Saved' } })
      await settle()

      const [region] = politeRegions(overlayHost())
      expect(region!.getAttribute('role')).toBe('status')
      expect(region!.textContent).toBe('')
    })

    it('writes the message into the region when it opens and withdraws it on close', async () => {
      const wrapper = await mountTracked(MSnackbar, { props: { modelValue: false, label: 'Saved' } })
      await settle()

      await wrapper.setProps({ modelValue: true })
      await announced()
      expect(politeRegions(overlayHost())[0]!.textContent).toBe('Saved')

      await wrapper.setProps({ modelValue: false })
      await settle()
      expect(politeRegions(overlayHost())[0]!.textContent).toBe('')
    })

    it('announces slot text as it reads', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true }, slots: { default: () => h('span', ['Photo ', h('b', 'archived')]) } })
      await announced()

      expect(politeRegions(overlayHost())[0]!.textContent).toBe('Photo archived')
    })

    it('uses the region its layer already has instead of adding one', async () => {
      const host = overlayHost()
      host.innerHTML = '<div class="ui-live-region"><div class="ui-live-region__polite" role="status"></div></div>'
      const before = politeRegions(host).length

      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved' } })
      await announced()

      expect(politeRegions(host)).toHaveLength(before)
      expect(politeRegions(host)[0]!.textContent).toBe('Saved')
    })

    // The page under an open modal is inert; an update there is not announced.
    it('announces through the region of the modal it is opened in', async () => {
      const open = ref(false)
      const Harness = defineComponent({
        setup: () => () => h(MOverlay, { modelValue: true }, {
          default: () => h(MSnackbar, { modelValue: open.value, label: 'Copied' }),
        }),
      })
      await mountTracked(Harness)
      await settle()

      open.value = true
      await nextTick()
      await announced()

      const dialog = document.querySelector('dialog.ui-overlay')!
      expect(politeRegions(dialog)[0]!.textContent).toBe('Copied')
    })

    it('is not a live region itself, so the message is not read twice', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved' } })
      await settle()

      const snackbar = document.querySelector('.ui-snackbar')!
      expect(snackbar.hasAttribute('role')).toBe(false)
      expect(snackbar.hasAttribute('aria-live')).toBe(false)
    })
  })

  describe('close control', () => {
    it('is named by close-label', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', closable: true, closeLabel: 'Скрыть' } })
      await settle()

      expect(document.querySelector('.ui-snackbar__close')!.getAttribute('aria-label')).toBe('Скрыть')
    })

    // The kit ships no English copy.
    it('invents no name of its own', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', closable: true } })
      await settle()

      expect(document.querySelector('.ui-snackbar__close')!.hasAttribute('aria-label')).toBe(false)
    })

    it('hides the close glyph from assistive tech', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', closable: true, closeLabel: 'Скрыть' } })
      await settle()

      expect(document.querySelector('.ui-snackbar__close .ui-icon')?.getAttribute('aria-hidden')).toBe('true')
    })

    // The missing-name warnings are guarded by `import.meta.dev`, which Vitest
    // resolves to `false`; they cannot be asserted here.
  })

  describe('action', () => {
    it('renders the action as a native button named by its label', async () => {
      await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' } })
      await settle()

      const action = document.querySelector<HTMLButtonElement>('.ui-snackbar__action')!
      expect(action.hasAttribute('role')).toBe(false)
      expect(action.textContent?.trim()).toBe('Undo')
    })
  })
})
