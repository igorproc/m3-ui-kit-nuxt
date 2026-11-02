import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { VNode } from 'vue'
import MDialog from '../index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

type Slots = Record<string, (...args: never[]) => VNode | VNode[] | string>

async function mount(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const Harness = defineComponent({
    setup: () => () => h(MDialog, {
      ...props,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => { model.value = value },
    }, { default: () => 'Body', ...slots }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()
  return { model, wrapper }
}

const find = (selector: string) => overlayHost().querySelector<HTMLElement>(selector)

describe('m-dialog · variants', () => {
  describe('anatomy', () => {
    it('renders the content region around the default slot', async () => {
      await mount()

      expect(find('.ui-dialog .ui-dialog__content')!.textContent).toContain('Body')
    })

    it('renders the title slot as the headline', async () => {
      await mount({}, { title: () => h('span', { class: 'rich-title' }, 'Delete') })

      expect(find('.ui-dialog__headline .rich-title')).not.toBeNull()
    })

    it('renders the headline only with a title', async () => {
      await mount()
      expect(find('.ui-dialog__headline')).toBeNull()
    })

    it('renders the title as a level-2 headline', async () => {
      await mount({ title: 'Discard draft?' })

      const headline = find('.ui-dialog__headline')!
      expect(headline.tagName).toBe('H2')
      expect(headline.textContent?.trim()).toBe('Discard draft?')
    })
  })

  describe('slots', () => {
    it('renders the icon slot above the headline', async () => {
      await mount({ title: 'Reset' }, { icon: () => h('span', { class: 'glyph' }) })

      const icon = find('.ui-dialog__icon')!
      expect(icon.querySelector('.glyph')).not.toBeNull()
      expect(icon.nextElementSibling?.classList).toContain('ui-dialog__headline')
    })

    it.each([
      [true, true],
      [false, false],
    ] as const)('centres the headline only under an icon (icon: %s)', async (withIcon, centered) => {
      await mount({ title: 'Reset' }, withIcon ? { icon: () => h('span', { class: 'glyph' }) } : {})

      expect(find('.ui-dialog__headline')!.classList.contains('ui-dialog__headline--centered')).toBe(centered)
    })

    it('renders no icon region without the slot', async () => {
      await mount({ title: 'Reset' })

      expect(find('.ui-dialog__icon')).toBeNull()
    })

    it('renders the actions slot after the content', async () => {
      await mount({}, { actions: () => h('button', { class: 'act' }, 'OK') })

      const actions = find('.ui-dialog__actions')!
      expect(actions.querySelector('.act')).not.toBeNull()
      expect(actions.previousElementSibling?.classList).toContain('ui-dialog__content')
    })

    it('renders no actions region without the slot', async () => {
      await mount()

      expect(find('.ui-dialog__actions')).toBeNull()
    })
  })

  describe('modal layer', () => {
    it('renders as a modal overlay with a scrim', async () => {
      await mount()

      expect(find('dialog.ui-overlay.ui-overlay--modal')).not.toBeNull()
      expect(find('.ui-overlay__scrim')).not.toBeNull()
    })

    it('passes the modal-layer props through to the overlay', async () => {
      await mount({ hideOverlay: true, contentClass: 'wide' })

      expect(find('.ui-overlay__scrim')).toBeNull()
      expect(find('.ui-overlay__panel')!.classList).toContain('wide')
    })

    it('keeps the dialog mounted after closing with display-directive="show"', async () => {
      const { model } = await mount({ displayDirective: 'show' })

      model.value = false
      await settle()

      expect(find('.ui-dialog')).not.toBeNull()
    })
  })
})
