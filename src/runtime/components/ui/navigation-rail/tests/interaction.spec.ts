import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import { Probe, probeItems } from '#kit/components/ui/layout/tests/helpers'
import MNavigationRail from '../index.vue'
import type { MNavigationRailItem as RailItem } from '../props'

const items: RailItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'search', icon: 'outline-search', label: 'Search' },
  { id: 'profile', icon: 'outline-person', label: 'Profile' },
]

let current: { unmount: () => void } | null = null

// Attached: a detached element takes no focus.
async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MNavigationRail, { props: { items, ...props }, slots, attachTo: document.body })

  return current as VueWrapper
}

async function mountHost(render: () => unknown) {
  if (current) current.unmount()
  current = await mountSuspended(defineComponent({ render }))

  return current as VueWrapper
}

const itemsOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-navigation-rail .ui-navigation-item')
const activeLabel = (wrapper: VueWrapper) => wrapper.find('.ui-navigation-item--active').text()
const menu = { header: ({ toggleAttrs }: { toggleAttrs: Record<string, unknown> }) => h('button', { ...toggleAttrs, class: 'menu' }, 'Menu') }

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-navigation-rail · interaction', () => {
  describe('model', () => {
    it('writes the clicked destination to the model', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await itemsOf(wrapper)[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['search'])
      expect(activeLabel(wrapper)).toBe('Search')
    })

    it('follows a model changed by the parent', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await wrapper.setProps({ modelValue: 'profile' })

      expect(activeLabel(wrapper)).toBe('Profile')
    })

    it('clears the selection when the parent clears the model', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await wrapper.setProps({ modelValue: null })

      expect(wrapper.find('.ui-navigation-item--active').exists()).toBe(false)
    })

    it('selects the bound destination when its item arrives after mount', async () => {
      const wrapper = await mount({ items: [], modelValue: 'search' })

      await wrapper.setProps({ items })

      expect(activeLabel(wrapper)).toBe('Search')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('does not select a disabled destination', async () => {
      const wrapper = await mount({ items: [items[0]!, { ...items[1]!, disabled: true }], modelValue: 'home' })

      await itemsOf(wrapper)[1]!.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('select')).toBeUndefined()
    })
  })

  // B5.1b (Q56-А)
  describe('select event', () => {
    it('emits select with the id and the event on every activation, the active one included', async () => {
      const wrapper = await mount({ modelValue: 'home' })

      await itemsOf(wrapper)[0]!.trigger('click')
      await itemsOf(wrapper)[1]!.trigger('click')

      const events = wrapper.emitted('select')!
      expect(events.map(([id]) => id)).toEqual(['home', 'search'])
      expect(events[0]![1]).toBeInstanceOf(MouseEvent)
    })
  })

  // W60-Б
  describe('expanded', () => {
    it('toggles through the toggle bindings the header slot is handed', async () => {
      const wrapper = await mount({}, menu)

      await wrapper.find('.menu').trigger('click')
      expect(wrapper.emitted('update:expanded')!.at(-1)).toEqual([true])
      expect(wrapper.classes()).toContain('ui-navigation-rail--expanded')

      await wrapper.find('.menu').trigger('click')
      expect(wrapper.emitted('update:expanded')!.at(-1)).toEqual([false])
    })

    it('hands the header slot the expanded state', async () => {
      const seen: boolean[] = []
      await mount({ expanded: true }, {
        header: ({ expanded }: { expanded: boolean }) => {
          seen.push(expanded)
          return h('span')
        },
      })

      expect(seen.at(-1)).toBe(true)
    })

    it('follows an expanded prop changed by the parent', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ expanded: true })

      expect(itemsOf(wrapper).every(item => item.classes().includes('ui-navigation-item--start'))).toBe(true)
    })

    it('fades the labels in only once the rail has been toggled after it rendered', async () => {
      const wrapper = await mount()
      expect(wrapper.find('.ui-navigation-item--fade-label').exists()).toBe(false)

      await wrapper.setProps({ expanded: true })
      await nextTick()

      expect(itemsOf(wrapper).every(item => item.classes().includes('ui-navigation-item--fade-label'))).toBe(true)
    })
  })

  // The width the layout reserves: only a rail expanded in place pushes the content.
  describe('layout zone', () => {
    it.each([
      ['standard', false, 'var(--ui-navigation-rail-width)'],
      ['standard', true, 'var(--ui-navigation-rail-width-expanded)'],
      ['modal', true, 'var(--ui-navigation-rail-width)'],
      ['dismissible', false, '0rem'],
      ['dismissible', true, '0rem'],
    ] as const)('a %s rail with expanded=%s reserves %s', async (mode, expanded, size) => {
      const wrapper = await mountHost(() => h(MLayout, null, () => [
        h(MNavigationRail, { items, mode, expanded }),
        h(MLayoutMain, null, () => h(Probe)),
      ]))
      await nextTick()

      expect(probeItems(wrapper).find(item => item.kind === 'start')!.size).toBe(size)
    })
  })

  // W56-А: Tab moves between destinations, arrows do nothing.
  describe('keyboard', () => {
    it.each(['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'])('leaves %s to the browser', async (key) => {
      const wrapper = await mount({ modelValue: 'home' })
      const first = itemsOf(wrapper)[0]!.element as HTMLButtonElement
      first.focus()

      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      first.dispatchEvent(event)
      await nextTick()

      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(first)
    })
  })

  it('keeps a two-way expanded binding in step', async () => {
    const expanded = ref(false)
    const wrapper = await mountHost(() => h(MNavigationRail, {
      items,
      'expanded': expanded.value,
      'onUpdate:expanded': (value: boolean) => {
        expanded.value = value
      },
    }, menu))

    await wrapper.find('.menu').trigger('click')

    expect(expanded.value).toBe(true)
  })
})
