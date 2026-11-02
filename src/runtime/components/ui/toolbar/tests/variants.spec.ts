import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MToolbar from '../index.vue'
import type { MToolbarItem, MToolbarOrientation, MToolbarScheme, MToolbarType } from '../props'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MToolbar, { props, slots })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

const TYPES: MToolbarType[] = ['floating', 'docked']
const SCHEMES: MToolbarScheme[] = ['standard', 'vibrant']
const ORIENTATIONS: MToolbarOrientation[] = ['horizontal', 'vertical']
const ABCD: MToolbarItem[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: id.toUpperCase() }))

describe('m-toolbar · variants', () => {
  describe('type', () => {
    it.each(TYPES)('renders the %s type as its own modifier', async (type) => {
      const wrapper = await mount({ type })

      expect(wrapper.classes()).toContain(`ui-toolbar--type-${type}`)
    })

    it('defaults to floating', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-toolbar--type-floating')
    })
  })

  // W66-Б: vibrant swaps the colour role, so it is a scheme, not a variant.
  describe('scheme', () => {
    it.each(SCHEMES)('renders the %s scheme as its own modifier', async (scheme) => {
      const wrapper = await mount({ scheme })

      expect(wrapper.classes()).toContain(`ui-toolbar--scheme-${scheme}`)
    })

    it('defaults to standard', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-toolbar--scheme-standard')
    })

    it.each(TYPES.flatMap(type => SCHEMES.map(scheme => [type, scheme] as const)))(
      'keeps type %s and scheme %s independent',
      async (type, scheme) => {
        const wrapper = await mount({ type, scheme })

        expect(wrapper.classes()).toEqual(expect.arrayContaining([`ui-toolbar--type-${type}`, `ui-toolbar--scheme-${scheme}`]))
      },
    )
  })

  describe('orientation', () => {
    it('defaults to horizontal', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-toolbar--orientation-horizontal')
    })

    it.each(TYPES.flatMap(type => ORIENTATIONS.map(orientation => [type, orientation] as const)))(
      'keeps type %s and orientation %s independent',
      async (type, orientation) => {
        const wrapper = await mount({ type, orientation })

        expect(wrapper.classes()).toEqual(expect.arrayContaining([`ui-toolbar--type-${type}`, `ui-toolbar--orientation-${orientation}`]))
      },
    )
  })

  describe('items', () => {
    it('renders the bar container and no control without items', async () => {
      const wrapper = await mount()
      const container = wrapper.find('.ui-toolbar__container')

      expect(container.exists()).toBe(true)
      expect(container.element.children).toHaveLength(0)
    })

    it('puts every control inside the bar container', async () => {
      const wrapper = await mount({ items: ABCD })

      expect(wrapper.find('.ui-toolbar__container').findAll('.ui-toolbar__item')).toHaveLength(4)
    })

    it('renders a labelled item as a text button', async () => {
      const wrapper = await mount({ items: [{ id: 'save', label: 'Save' }] })
      const item = wrapper.find('.ui-button')

      expect(item.text()).toBe('Save')
      expect(item.classes()).toContain('ui-button--text')
      expect(item.classes()).not.toContain('ui-icon-button')
    })

    it('renders an icon-only item as an icon button', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', ariaLabel: 'Bold' }] })
      const item = wrapper.find('.ui-icon-button')

      expect(item.exists()).toBe(true)
      expect(item.find('.ui-icon').exists()).toBe(true)
    })

    it('renders both the icon and the label of an item that has both', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', label: 'Bold' }] })
      const item = wrapper.find('.ui-button')

      expect(item.find('.ui-button__icon--prepend .ui-icon').exists()).toBe(true)
      expect(item.find('.ui-button__label').text()).toBe('Bold')
    })

    it('renders one control per item, in order', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }] })

      expect(wrapper.findAll('.ui-button').map(item => item.text())).toEqual(['A', 'B', 'C'])
    })

    // The selected look is the secondary role (M3 secondary-container), not the primary one.
    it('fills a selected item tonal in the secondary role and keeps the others text', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A', selected: true }, { id: 'b', label: 'B' }] })
      const [selected, idle] = wrapper.findAll('.ui-button')

      expect(selected!.classes()).toEqual(expect.arrayContaining(['ui-button--tonal', 'ui-button--secondary', 'ui-toolbar__item--selected']))
      expect(idle!.classes()).toContain('ui-button--text')
      expect(idle!.classes()).not.toContain('ui-toolbar__item--selected')
    })

    it('fills a selected icon-only item the same way', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', ariaLabel: 'Bold', selected: true }] })

      expect(wrapper.find('.ui-icon-button').classes()).toEqual(expect.arrayContaining(['ui-button--tonal', 'ui-button--secondary']))
    })

    it('leaves a resting icon-only item without a role: it takes the bar colour', async () => {
      const wrapper = await mount({ items: [{ id: 'bold', icon: 'format-bold', ariaLabel: 'Bold' }] })

      expect(wrapper.find('.ui-icon-button').classes()).toContain('ui-button--current')
    })

    // EN-01: a strict item type; anything else goes through the #item slot.
    it('passes only the item contract to its control', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A', icon: 'archive', title: 'Archive' } as unknown as MToolbarItem] })
      const item = wrapper.find('.ui-button')

      expect(item.attributes('title')).toBeUndefined()
      expect(item.attributes('label')).toBeUndefined()
      expect(item.attributes('icon')).toBeUndefined()
    })
  })

  // W67-А: an explicit count, no measuring, so the server frame is the final one.
  describe('maxVisible', () => {
    it('shows every item and no "more" button without maxVisible', async () => {
      const wrapper = await mount({ items: ABCD })

      expect(wrapper.findAll('.ui-toolbar__item')).toHaveLength(4)
      expect(wrapper.find('.ui-toolbar__overflow').exists()).toBe(false)
    })

    it.each([
      [0, 0],
      [2, 2],
      [3, 3],
    ])('with maxVisible=%i shows %i items and moves the rest into the menu', async (maxVisible, shown) => {
      const wrapper = await mount({ items: ABCD, maxVisible, moreLabel: 'More' })

      expect(wrapper.findAll('.ui-toolbar__item').map(item => item.text())).toEqual(['A', 'B', 'C', 'D'].slice(0, shown))
      expect(wrapper.find('.ui-toolbar__overflow').exists()).toBe(true)
    })

    it.each([4, 9])('with maxVisible=%i every item fits and no menu is drawn', async (maxVisible) => {
      const wrapper = await mount({ items: ABCD, maxVisible })

      expect(wrapper.findAll('.ui-toolbar__item')).toHaveLength(4)
      expect(wrapper.find('.ui-toolbar__overflow').exists()).toBe(false)
    })

    it('puts the "more" button last in the bar', async () => {
      const wrapper = await mount({ items: ABCD, maxVisible: 2, moreLabel: 'More' })
      const children = Array.from(wrapper.find('.ui-toolbar__container').element.children)

      expect(children.at(-1)!.classList.contains('ui-toolbar__overflow')).toBe(true)
    })
  })

  describe('fab', () => {
    const fab = () => h('button', { type: 'button', class: 'own-fab' }, 'Compose')

    it('sets a FAB beside a floating bar, outside its container', async () => {
      const wrapper = await mount({ items: ABCD }, { fab })

      expect(wrapper.classes()).toContain('ui-toolbar--with-fab')
      expect(wrapper.find('.ui-toolbar__fab .own-fab').exists()).toBe(true)
      expect(wrapper.find('.ui-toolbar__container .own-fab').exists()).toBe(false)
    })

    it('puts the FAB after the bar', async () => {
      const wrapper = await mount({ items: ABCD }, { fab })
      const children = Array.from((wrapper.element as HTMLElement).children)

      expect(children.map(child => child.className)).toEqual(['ui-toolbar__container', 'ui-toolbar__fab'])
    })

    it('renders no FAB beside a docked bar', async () => {
      const wrapper = await mount({ type: 'docked', items: ABCD }, { fab })

      expect(wrapper.find('.own-fab').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('ui-toolbar--with-fab')
    })

    it('has no FAB region without the slot', async () => {
      const wrapper = await mount({ items: ABCD })

      expect(wrapper.find('.ui-toolbar__fab').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('lets the default slot replace the items', async () => {
      const wrapper = await mount({ items: [{ id: 'a', label: 'A' }] }, { default: () => h('span', { class: 'own' }, 'content') })

      expect(wrapper.find('.own').text()).toBe('content')
      expect(wrapper.find('.ui-button').exists()).toBe(false)
    })

    it('hands each item, its index and its state to the #item slot', async () => {
      const wrapper = await mount(
        { items: [{ id: 'a', label: 'A', selected: true }, { id: 'b', label: 'B' }] },
        {
          item: ({ item, index, selected }: { item: MToolbarItem, index: number, selected: boolean }) =>
            h('span', { 'class': 'own-item', 'data-selected': String(selected) }, `${index}:${item.label}`),
        },
      )
      const items = wrapper.findAll('.own-item')

      expect(items.map(item => item.text())).toEqual(['0:A', '1:B'])
      expect(items.map(item => item.attributes('data-selected'))).toEqual(['true', 'false'])
    })
  })
})
