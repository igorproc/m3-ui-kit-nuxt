import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mountTracked, overlayHost, useOverlayHost } from '#kit/components/ui/overlay/tests/helpers'
import MNavigationRail from '../index.vue'
import type { MNavigationRailItem as RailItem } from '../props'

useOverlayHost()

const items: RailItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
]

/** A rail in an off-grid mode, behind two-way `v-model`s, its menu button in the header. */
async function mount(mode: 'modal' | 'dismissible', props: Record<string, unknown> = {}) {
  const expanded = ref(false)
  const selected = ref<string | null>('home')
  const Harness = defineComponent({
    setup: () => () => h(MNavigationRail, {
      items,
      mode,
      'ariaLabel': 'Sections',
      ...props,
      'expanded': expanded.value,
      'onUpdate:expanded': (value: boolean) => {
        expanded.value = value
      },
      'modelValue': selected.value,
      'onUpdate:modelValue': (value: string | null) => {
        selected.value = value
      },
    }, {
      header: ({ toggleAttrs }: { toggleAttrs: Record<string, unknown> }) => h('button', { ...toggleAttrs, class: 'menu' }, 'Menu'),
    }),
  })
  const wrapper = await mountTracked(Harness, { attachTo: document.body })

  return { expanded, selected, wrapper }
}

const dialog = () => overlayHost().querySelector<HTMLDialogElement>('dialog.ui-overlay')
const modalRail = () => overlayHost().querySelector<HTMLElement>('.ui-navigation-rail__modal')

describe('m-navigation-rail · modal', () => {
  it.each(['modal', 'dismissible'] as const)('opens the expanded rail over the content in %s mode', async (mode) => {
    const { expanded } = await mount(mode)
    expect(dialog()).toBeNull()

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))

    const destinations = modalRail()!.querySelectorAll('.ui-navigation-item')
    expect(destinations).toHaveLength(2)
    expect(Array.from(destinations).every(item => item.classList.contains('ui-navigation-item--start'))).toBe(true)
  })

  it('names the modal rail after the rail', async () => {
    const { expanded } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))

    expect(dialog()!.getAttribute('aria-label')).toBe('Sections')
    expect(modalRail()!.tagName).toBe('NAV')
  })

  it('keeps the collapsed rail in the grid of a modal rail while it is open', async () => {
    const { expanded, wrapper } = await mount('modal')

    expanded.value = true
    await nextTick()

    expect(wrapper.find('.ui-navigation-rail').classes()).not.toContain('ui-navigation-rail--expanded')
    expect(wrapper.find('.ui-navigation-rail').classes()).not.toContain('ui-navigation-rail--concealed')
  })

  it('conceals the grid rail of a dismissible rail', async () => {
    const { wrapper } = await mount('dismissible')

    expect(wrapper.find('.ui-navigation-rail').classes()).toContain('ui-navigation-rail--concealed')
  })

  it('collapses back on Escape', async () => {
    const { expanded } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))
    dialog()!.dispatchEvent(new Event('cancel', { cancelable: true }))
    await nextTick()

    expect(expanded.value).toBe(false)
  })

  it('collapses back on a scrim click', async () => {
    const { expanded } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))
    overlayHost().querySelector<HTMLElement>('.ui-overlay__scrim')!.click()
    await nextTick()

    expect(expanded.value).toBe(false)
  })

  it('selects from the modal rail and reports it', async () => {
    const { expanded, selected, wrapper } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))
    modalRail()!.querySelectorAll<HTMLButtonElement>('.ui-navigation-item')[1]!.click()
    await nextTick()

    expect(selected.value).toBe('search')
    expect(wrapper.findComponent(MNavigationRail).emitted('select')!.at(-1)![0]).toBe('search')
  })

  it('points the menu button at the dialog in an off-grid mode', async () => {
    const { expanded, wrapper } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))

    expect(wrapper.find('.menu').attributes('aria-controls')).toBe(dialog()!.id)
  })

  it('opens the modal rail with the header the grid rail shows', async () => {
    const { expanded } = await mount('modal')

    expanded.value = true
    await vi.waitFor(() => expect(dialog()?.open).toBe(true))

    expect(modalRail()!.querySelector('.ui-navigation-rail__header .menu')).not.toBeNull()
  })
})
