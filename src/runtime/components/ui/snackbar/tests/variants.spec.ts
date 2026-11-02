import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import MSnackbar from '../index.vue'
import { mountTracked, overlayHost, settle, useOverlayHost } from '../../overlay/tests/helpers'

useOverlayHost()

async function mount(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  const wrapper = await mountTracked(MSnackbar, { props: { modelValue: true, label: 'Saved', ...props }, slots })
  await settle()
  return wrapper
}

const find = (selector: string) => document.querySelector<HTMLElement>(selector)

describe('m-snackbar · variants', () => {
  describe('open state', () => {
    it('renders nothing while the v-model is closed', async () => {
      await mount({ modelValue: false })

      expect(find('.ui-snackbar')).toBeNull()
    })

    it('teleports into the overlay host when open', async () => {
      await mount()

      expect(overlayHost().querySelector('.ui-snackbar .ui-snackbar__surface')).not.toBeNull()
    })
  })

  describe('label', () => {
    it('renders the label prop', async () => {
      await mount()

      expect(find('.ui-snackbar__label')!.textContent?.trim()).toBe('Saved')
    })

    it('prefers the default slot over the label prop', async () => {
      await mount({}, { default: () => 'Custom message' })

      expect(find('.ui-snackbar__label')!.textContent?.trim()).toBe('Custom message')
    })

    it('renders nothing for an empty label without a slot, even with an action', async () => {
      await mount({ label: '', actionLabel: 'Undo', closable: true, closeLabel: 'Скрыть' })

      expect(find('.ui-snackbar')).toBeNull()
    })

    it('shows a slot message without a label', async () => {
      await mount({ label: '' }, { default: () => 'From the slot' })

      expect(find('.ui-snackbar__label')!.textContent?.trim()).toBe('From the slot')
    })

    it('appears once the empty label is filled in', async () => {
      const wrapper = await mount({ label: '' })
      expect(find('.ui-snackbar')).toBeNull()

      await wrapper.setProps({ label: 'Saved' })
      await settle()

      expect(find('.ui-snackbar__label')!.textContent?.trim()).toBe('Saved')
    })
  })

  describe('action', () => {
    it('omits the action button without an action label', async () => {
      await mount()

      expect(find('.ui-snackbar__action')).toBeNull()
    })

    it('renders the action label in a button after the label', async () => {
      await mount({ actionLabel: 'Undo' })

      const action = find('.ui-snackbar__action')!
      expect(action.tagName).toBe('BUTTON')
      expect(action.getAttribute('type')).toBe('button')
      expect(action.textContent?.trim()).toBe('Undo')
      expect(action.closest('.ui-snackbar__controls')!.previousElementSibling?.classList.contains('ui-snackbar__label')).toBe(true)
    })
  })

  describe('close', () => {
    it.each([
      [true, true],
      [false, false],
    ] as const)('closable=%s renders the close control: %s', async (closable, rendered) => {
      await mount({ closable, closeLabel: 'Скрыть' })

      expect(Boolean(find('.ui-snackbar__close'))).toBe(rendered)
    })
  })

  describe('layout', () => {
    it.each([
      ['inline', false],
      ['below', true],
    ] as const)('action-placement=%s stacks the action under the message: %s', async (actionPlacement, stacked) => {
      await mount({ actionLabel: 'Undo', actionPlacement })

      expect(find('.ui-snackbar__surface')!.classList.contains('ui-snackbar__surface--stacked')).toBe(stacked)
    })

    it.each([
      [{}, false],
      [{ actionLabel: 'Undo' }, true],
      [{ closable: true, closeLabel: 'Скрыть' }, true],
    ] as const)('%o draws the trailing controls: %s', async (props, trailing) => {
      await mount(props)

      expect(find('.ui-snackbar__surface')!.classList.contains('ui-snackbar__surface--trailing')).toBe(trailing)
      expect(Boolean(find('.ui-snackbar__controls'))).toBe(trailing)
    })
  })

  describe('slots', () => {
    // A block slot inside a <p> would split the paragraph and break hydration.
    it('renders block slot content inside a block label', async () => {
      await mount({}, { default: () => h('div', { class: 'rich' }, 'Block') })

      expect(find('.ui-snackbar__label')!.tagName).toBe('DIV')
      expect(find('.ui-snackbar__label .rich')).not.toBeNull()
    })

    it('replaces the action button through the action slot', async () => {
      await mount({ actionLabel: 'Undo' }, { action: () => h('a', { class: 'custom', href: '#' }, 'Open') })

      expect(find('.ui-snackbar__action')).toBeNull()
      expect(find('.ui-snackbar__controls .custom')).not.toBeNull()
    })
  })
})
