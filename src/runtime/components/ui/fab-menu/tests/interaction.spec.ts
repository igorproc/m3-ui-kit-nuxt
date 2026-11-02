import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import MFabMenu from '../index.vue'
import type { MFabMenuItem } from '../props'

type Slots = Record<string, (...args: never[]) => unknown>

const items: MFabMenuItem[] = [
  { label: 'Share', icon: 'ic:baseline-share', value: 'share' },
  { label: 'Edit', icon: 'ic:baseline-edit', value: 'edit' },
]

let current: { unmount: () => void } | null = null

// Attached: focus moves and outside presses need the component in the document.
async function mount(props: Record<string, unknown> = {}, slots?: Slots) {
  if (current) current.unmount()
  current = await mountSuspended(MFabMenu, { props: { items, ariaLabel: 'Create', ...props }, slots, attachTo: document.body })

  return current as VueWrapper
}

const activator = (wrapper: VueWrapper) => wrapper.find('.ui-fab-menu__activator')
const isOpen = (wrapper: VueWrapper) => activator(wrapper).attributes('aria-expanded') === 'true'

async function settle() {
  await nextTick()
  await nextTick()
}

function pressOutside() {
  const outside = document.createElement('button')
  document.body.append(outside)
  for (const type of ['pointerdown', 'pointerup']) {
    outside.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true }))
  }
  outside.remove()
}

/** The document listeners of `type` added and not yet removed, counted from now. */
function trackDocumentListeners(type: string) {
  const active = new Set<unknown>()
  const add = document.addEventListener.bind(document)
  const remove = document.removeEventListener.bind(document)
  vi.spyOn(document, 'addEventListener').mockImplementation((event, listener, options) => {
    if (event === type) active.add(listener)
    add(event, listener, options)
  })
  vi.spyOn(document, 'removeEventListener').mockImplementation((event, listener, options) => {
    if (event === type) active.delete(listener)
    remove(event, listener, options)
  })
  return active
}

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

describe('m-fab-menu · interaction', () => {
  describe('open and close', () => {
    it('toggles from the FAB', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      expect(isOpen(wrapper)).toBe(true)

      await activator(wrapper).trigger('click')
      expect(isOpen(wrapper)).toBe(false)
    })

    it('follows v-model:open and reports its own toggles', async () => {
      const wrapper = await mount({ open: true })
      expect(isOpen(wrapper)).toBe(true)

      await wrapper.setProps({ open: false })
      expect(isOpen(wrapper)).toBe(false)

      await activator(wrapper).trigger('click')
      expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
    })

    it.each([
      ['disabled', { disabled: true }],
      ['empty', { items: [] }],
    ])('does not open while %s', async (_, props) => {
      const wrapper = await mount(props)

      await activator(wrapper).trigger('click')

      expect(isOpen(wrapper)).toBe(false)
      expect(wrapper.find('.ui-fab-menu__drawer').exists()).toBe(false)
    })

    it('opens with no items when the default slot supplies the content', async () => {
      const wrapper = await mount({ items: [] }, { default: () => h('p', 'Custom') })

      await activator(wrapper).trigger('click')

      expect(isOpen(wrapper)).toBe(true)
    })

    it('closes on a press outside the menu', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      pressOutside()
      await nextTick()

      expect(isOpen(wrapper)).toBe(false)
    })

    // B13.3d: a closed menu has nothing to dismiss, so it keeps no document listeners.
    it('listens for outside presses only while open', async () => {
      const listening = trackDocumentListeners('pointerdown')
      const wrapper = await mount()
      expect(listening.size).toBe(0)

      await activator(wrapper).trigger('click')
      expect(listening.size).toBe(1)

      await activator(wrapper).trigger('click')
      expect(listening.size).toBe(0)
    })

    it('stays open on a press inside the menu', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      const fab = activator(wrapper).element
      for (const type of ['pointerdown', 'pointerup']) fab.dispatchEvent(new PointerEvent(type, { bubbles: true }))
      await nextTick()

      expect(isOpen(wrapper)).toBe(true)
    })
  })

  describe('actions', () => {
    it('runs the item\'s action, emits select and closes', async () => {
      const action = vi.fn()
      const wrapper = await mount({ items: [items[0], { ...items[1], action }] })

      await activator(wrapper).trigger('click')
      await wrapper.findAll('.ui-fab-menu__item')[1]!.trigger('click')

      expect(action).toHaveBeenCalledOnce()
      expect(wrapper.emitted('select')?.at(-1)).toEqual([expect.objectContaining({ value: 'edit' })])
      expect(isOpen(wrapper)).toBe(false)
    })

    it('returns focus to the FAB after a pick', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      await wrapper.findAll('.ui-fab-menu__item')[0]!.trigger('click')
      await settle()

      expect(document.activeElement).toBe(activator(wrapper).element)
    })

    it('hands close and select to the default slot', async () => {
      const wrapper = await mount({}, {
        default: ({ select }: { select: (item: MFabMenuItem) => void }) => h('button', { class: 'own', onClick: () => select(items[0]!) }, 'Pick'),
      })

      await activator(wrapper).trigger('click')
      await wrapper.find('.own').trigger('click')

      expect(wrapper.emitted('select')?.at(-1)).toEqual([items[0]])
      expect(isOpen(wrapper)).toBe(false)
    })

    it('keeps the actions mounted through a close and reopen, moving them by class', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      await nextTick()
      const first = wrapper.find('.ui-fab-menu__entry').element

      await activator(wrapper).trigger('click')
      expect(wrapper.find('.ui-fab-menu__drawer').classes()).not.toContain('ui-fab-menu__drawer--open')

      await activator(wrapper).trigger('click')
      await nextTick()
      expect(wrapper.find('.ui-fab-menu__entry').element).toBe(first)
    })
  })

  describe('keyboard', () => {
    it('closes on Escape from the actions and returns focus to the FAB', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      await wrapper.find('.ui-fab-menu__drawer').trigger('keydown', { key: 'Escape' })
      await settle()

      expect(isOpen(wrapper)).toBe(false)
      expect(document.activeElement).toBe(activator(wrapper).element)
    })

    it('closes on Escape from the FAB', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('click')
      await activator(wrapper).trigger('keydown', { key: 'Escape' })

      expect(isOpen(wrapper)).toBe(false)
    })

    it('opens on ArrowDown', async () => {
      const wrapper = await mount()

      await activator(wrapper).trigger('keydown', { key: 'ArrowDown' })

      expect(isOpen(wrapper)).toBe(true)
    })

    it('moves focus to the top enabled action on ArrowDown while open', async () => {
      const wrapper = await mount({ items: [{ label: 'Delete', value: 'delete', disabled: true }, ...items] })

      await activator(wrapper).trigger('click')
      await settle()
      await activator(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await settle()

      expect(document.activeElement).toBe(wrapper.findAll('.ui-fab-menu__item')[1]!.element)
    })

    // The focus call used to land while the entering drawer was still `inert`, so focus
    // stayed on the FAB (confirmed in Chromium, not only in the test DOM).
    it('opens on ArrowDown from a closed menu and focuses the top enabled action', async () => {
      const wrapper = await mount({ items: [{ label: 'Delete', value: 'delete', disabled: true }, ...items] })

      await activator(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await settle()

      expect(isOpen(wrapper)).toBe(true)
      expect(document.activeElement).toBe(wrapper.findAll('.ui-fab-menu__item')[1]!.element)
    })

    it('does not open on ArrowDown while disabled', async () => {
      const wrapper = await mount({ disabled: true })

      await activator(wrapper).trigger('keydown', { key: 'ArrowDown' })

      expect(isOpen(wrapper)).toBe(false)
    })
  })

  describe('custom activator', () => {
    it('toggles through the slot\'s toggle and wears the disclosure state', async () => {
      const wrapper = await mount({}, {
        activator: ({ toggle, activatorAttrs }: { toggle: () => void, activatorAttrs: Record<string, unknown> }) =>
          h('button', { class: 'own', ...activatorAttrs, onClick: toggle }, 'Menu'),
      })

      await wrapper.find('.own').trigger('click')

      expect(wrapper.find('.own').attributes('aria-expanded')).toBe('true')
    })
  })

  // The "more than 6 actions" warning is guarded by `import.meta.dev`, which
  // Vitest resolves to `false`.
})
