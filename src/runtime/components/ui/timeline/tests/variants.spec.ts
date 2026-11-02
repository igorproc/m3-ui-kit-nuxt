import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import type { Component } from 'vue'
import { single, timeline } from './helpers'

let current: { unmount: () => void } | null = null

async function mount(component: Component) {
  if (current) current.unmount()
  current = await mountSuspended(component)

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-timeline · variants', () => {
  describe('defaults', () => {
    it('renders end-sided, default density and a solid line', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }]))

      expect(wrapper.find('.ui-timeline').classes()).toEqual(['ui-timeline', 'ui-timeline--side-end', 'ui-timeline--line-solid', 'ui-timeline--density-default'])
    })
  })

  describe('side', () => {
    it.each(['start', 'end', 'alternate'] as const)('carries side %s on the root', async (side) => {
      const wrapper = await mount(timeline({ side }, [{ title: 'A' }]))

      expect(wrapper.find('.ui-timeline').classes()).toContain(`ui-timeline--side-${side}`)
    })

    it.each(['start', 'end'] as const)('resolves every item to %s', async (side) => {
      const wrapper = await mount(timeline({ side }, [{ title: 'A' }, { title: 'B' }]))

      expect(wrapper.findAll(`.ui-timeline-item--${side}`)).toHaveLength(2)
    })

    it('alternates sides by order, starting on the start side', async () => {
      const wrapper = await mount(timeline({ side: 'alternate' }, [{ title: 'A' }, { title: 'B' }, { title: 'C' }]))
      const sides = wrapper.findAll('.ui-timeline-item').map(item => (item.classes().includes('ui-timeline-item--start') ? 'start' : 'end'))

      expect(sides).toEqual(['start', 'end', 'start'])
    })

    it('lets an item override its resolved side', async () => {
      const wrapper = await mount(timeline({ side: 'alternate' }, [{ title: 'A' }, { title: 'B', side: 'start' }]))

      expect(wrapper.findAll('.ui-timeline-item')[1]!.classes()).toContain('ui-timeline-item--start')
    })

    it('lets an item override a one-sided timeline too', async () => {
      const wrapper = await mount(timeline({ side: 'end' }, [{ title: 'A', side: 'start' }]))

      expect(wrapper.find('.ui-timeline-item').classes()).toContain('ui-timeline-item--start')
    })

    it('marks items of an alternate timeline, and only those', async () => {
      const alternate = await mount(timeline({ side: 'alternate' }, [{ title: 'A' }]))
      expect(alternate.find('.ui-timeline-item').classes()).toContain('ui-timeline-item--alternate')

      const sided = await mount(timeline({ side: 'start' }, [{ title: 'A' }]))
      expect(sided.find('.ui-timeline-item').classes()).not.toContain('ui-timeline-item--alternate')
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('hands density %s to the root and every item', async (density) => {
      const wrapper = await mount(timeline({ density }, [{ title: 'A' }, { title: 'B' }]))

      expect(wrapper.find('.ui-timeline').classes()).toContain(`ui-timeline--density-${density}`)
      expect(wrapper.findAll(`.ui-timeline-item--density-${density}`)).toHaveLength(2)
    })
  })

  describe('line', () => {
    it.each(['solid', 'dashed', 'none'] as const)('hands line %s to the root and every item', async (line) => {
      const wrapper = await mount(timeline({ line }, [{ title: 'A' }, { title: 'B' }]))

      expect(wrapper.find('.ui-timeline').classes()).toContain(`ui-timeline--line-${line}`)
      expect(wrapper.findAll(`.ui-timeline-item--line-${line}`)).toHaveLength(2)
    })
  })

  describe('item content', () => {
    it('renders title and body', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'Order placed', body: 'Order 1248 created.' }]))

      expect(wrapper.find('.ui-timeline-item__title').text()).toBe('Order placed')
      expect(wrapper.find('.ui-timeline-item__body').text()).toBe('Order 1248 created.')
    })

    it('renders the text prop as the body without a default slot', async () => {
      const wrapper = await mount(single({ title: 'A', text: 'Plain body' }, {}))

      expect(wrapper.find('.ui-timeline-item__body').text()).toBe('Plain body')
    })

    it('renders no title or body wrapper without content', async () => {
      const wrapper = await mount(single({}, {}))

      expect(wrapper.find('.ui-timeline-item__title').exists()).toBe(false)
      expect(wrapper.find('.ui-timeline-item__body').exists()).toBe(false)
    })

    it('prefers slots over the title, text and time props', async () => {
      const wrapper = await mount(single({ title: 'prop', text: 'propbody', time: '09:00' }, {
        title: () => 'slot title',
        default: () => 'slot body',
        opposite: () => h('span', { class: 'op' }, 'custom time'),
      }))

      expect(wrapper.find('.ui-timeline-item__title').text()).toBe('slot title')
      expect(wrapper.find('.ui-timeline-item__body').text()).toBe('slot body')
      expect(wrapper.find('.op').text()).toBe('custom time')
      expect(wrapper.find('.ui-timeline-item__time').exists()).toBe(false)
    })

    it('marks an item without a title, whose first line is the body', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }, { text: 'Only a body' }]))
      const [titled, untitled] = wrapper.findAll('.ui-timeline-item')

      expect(titled!.classes()).not.toContain('ui-timeline-item--untitled')
      expect(untitled!.classes()).toContain('ui-timeline-item--untitled')
    })

    it.each(['div', 'article'] as const)('renders the content as a %s', async (contentTag) => {
      const wrapper = await mount(timeline({}, [{ title: 'A', contentTag }]))

      expect(wrapper.find('.ui-timeline-item__content').element.tagName).toBe(contentTag.toUpperCase())
    })

    it.each(['plain', 'filled', 'elevated', 'outlined'] as const)('draws the content on a %s surface', async (variant) => {
      const wrapper = await mount(timeline({}, [{ title: 'A', variant }]))

      expect(wrapper.find('.ui-timeline-item__content').classes()).toContain(`ui-surface--${variant}`)
    })

    it('defaults the content to a plain surface', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }]))

      expect(wrapper.find('.ui-timeline-item__content').classes()).toContain('ui-surface--plain')
    })

    // B9.3: a contained surface needs room around its text and a corner.
    it.each(['filled', 'elevated', 'outlined'] as const)('pads and rounds a %s content surface', async (variant) => {
      const wrapper = await mount(timeline({}, [{ title: 'A', variant }]))

      expect(wrapper.find('.ui-timeline-item').classes()).toContain('ui-timeline-item--contained')
      expect(wrapper.find('.ui-timeline-item__content').classes()).toContain('ui-surface--shape-medium')
    })

    it('leaves plain content flush with the rail and square', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }]))

      expect(wrapper.find('.ui-timeline-item').classes()).not.toContain('ui-timeline-item--contained')
      expect(wrapper.find('.ui-timeline-item__content').classes()).toContain('ui-surface--shape-none')
    })
  })

  describe('time column', () => {
    it('renders the time column only for an item that has a time', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00' }, { title: 'B' }]))
      const items = wrapper.findAll('.ui-timeline-item')

      expect(items[0]!.find('.ui-timeline-item__opposite').exists()).toBe(true)
      expect(items[1]!.find('.ui-timeline-item__opposite').exists()).toBe(false)
    })

    it('renders an opposite slot without a time', async () => {
      const wrapper = await mount(single({ title: 'A' }, { opposite: () => h('span', { class: 'op' }, 'Now') }))

      expect(wrapper.find('.ui-timeline-item__opposite .op').text()).toBe('Now')
    })

    it('renders no time for an item with hideOpposite', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', time: '09:00', hideOpposite: true }]))

      expect(wrapper.find('.ui-timeline-item__opposite').exists()).toBe(false)
    })
  })

  describe('marker', () => {
    it.each(['primary', 'secondary', 'tertiary', 'error', 'info', 'success', 'warning'] as const)('paints the dot in the %s role', async (color) => {
      const wrapper = await mount(timeline({}, [{ title: 'A', color }]))

      expect(wrapper.find('.ui-timeline-divider__dot').classes()).toContain(`ui-timeline-divider__dot--${color}`)
    })

    it('defaults the dot to primary', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }]))

      expect(wrapper.find('.ui-timeline-divider__dot').classes()).toContain('ui-timeline-divider__dot--primary')
    })

    it('draws the icon prop inside the dot', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', icon: 'round-check' }]))

      expect(wrapper.find('.ui-timeline-divider__dot .ui-timeline-divider__icon').exists()).toBe(true)
    })

    // Q-10 (M3-polish): `#dot` is the one slot for the marker's content.
    it('fills the dot through #dot only', async () => {
      const wrapper = await mount(single({ title: 'A', icon: 'round-check' }, { dot: () => h('b', { class: 'mark' }, '1') }))

      expect(wrapper.find('.ui-timeline-divider__dot .mark').exists()).toBe(true)
      expect(wrapper.find('.ui-timeline-divider__icon').exists()).toBe(false)
    })

    it('ignores the retired #icon slot', async () => {
      const wrapper = await mount(single({ title: 'B' }, { icon: () => h('b', { class: 'retired' }, '2') }))

      expect(wrapper.find('.retired').exists()).toBe(false)
    })

    it('drops the dot but keeps the rail cell when hideDot is set', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', hideDot: true }]))

      expect(wrapper.find('.ui-timeline-item').classes()).toContain('ui-timeline-item--no-dot')
      expect(wrapper.find('.ui-timeline-item__divider').exists()).toBe(true)
      expect(wrapper.find('.ui-timeline-divider__dot').exists()).toBe(false)
    })
  })

  describe('state modifiers', () => {
    it('expresses every axis as a class, never a data attribute', async () => {
      const wrapper = await mount(timeline({ side: 'alternate', density: 'compact', line: 'dashed' }, [{ title: 'A', hideDot: true }]))
      const attributes = [wrapper.find('.ui-timeline'), wrapper.find('.ui-timeline-item')].flatMap(node => Object.keys(node.attributes()))

      expect(attributes.filter(name => name.startsWith('data-'))).toEqual([])
    })
  })
})
