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
    }, { default: () => h('p', { class: 'body' }, 'Sheet body') }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()
  return { model, wrapper }
}

const find = (selector: string) => overlayHost().querySelector<HTMLElement>(selector)

describe('m-sheet · variants', () => {
  describe('anatomy', () => {
    it('renders the container with the drag handle above the content', async () => {
      await mount()

      const handle = find('.ui-sheet .ui-sheet__container .ui-sheet__drag-handle')!
      expect(handle.nextElementSibling?.classList).toContain('ui-sheet__content')
    })

    it('renders the default slot inside the content region', async () => {
      await mount()

      expect(find('.ui-sheet__content .body')!.textContent).toBe('Sheet body')
    })
  })

  // The handle promises a swipe: it is there only when the swipe is (W36).
  describe('drag handle', () => {
    it.each([
      [{}, true],
      [{ closeOnSwipe: 'none' }, false],
      [{ persistent: true }, false],
    ] as const)('%o draws the handle: %s', async (props, drawn) => {
      await mount(props)

      expect(Boolean(find('.ui-sheet__drag-handle'))).toBe(drawn)
    })
  })

  describe('modal layer', () => {
    it('renders as a modal overlay with a scrim', async () => {
      await mount()

      expect(find('dialog.ui-overlay.ui-overlay--modal')).not.toBeNull()
      expect(find('.ui-overlay__scrim')).not.toBeNull()
    })

    it('passes the modal-layer props through to the overlay', async () => {
      await mount({ hideOverlay: true, contentClass: 'tall' })

      expect(find('.ui-overlay__scrim')).toBeNull()
      expect(find('.ui-overlay__panel')!.classList).toContain('tall')
    })

    it('keeps the sheet mounted after closing with display-directive="show"', async () => {
      const { model } = await mount({ displayDirective: 'show' })

      model.value = false
      await settle()

      expect(find('.ui-sheet')).not.toBeNull()
    })
  })
})
