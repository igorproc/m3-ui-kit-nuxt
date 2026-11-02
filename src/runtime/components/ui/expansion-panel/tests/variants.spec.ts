import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MExpansionPanel from '../index.vue'
import MExpansionPanels from '../../expansion-panels/index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MExpansionPanel, { props, slots, attrs })

  return current as VueWrapper
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-expansion-panel · variants', () => {
  describe('defaults', () => {
    it('renders a collapsed standalone panel carrying only its block class', async () => {
      const wrapper = await mount({ title: 'Details' })

      expect(wrapper.classes()).toEqual(['ui-expansion-panel'])
      expect(wrapper.find('.ui-expansion-panel__header').element.tagName).toBe('BUTTON')
    })

    it('always keeps the content in the DOM, for the height animation', async () => {
      const wrapper = await mount({ title: 'Details' }, { default: () => 'Body text' })

      expect(wrapper.find('.ui-expansion-panel__content').text()).toBe('Body text')
    })
  })

  describe('header', () => {
    it('renders the title, and the description only when given', async () => {
      const bare = await mount({ title: 'Details' })
      expect(bare.find('.ui-expansion-panel__title').text()).toBe('Details')
      expect(bare.find('.ui-expansion-panel__description').exists()).toBe(false)

      const described = await mount({ title: 'Details', description: 'Shipping and returns' })
      expect(described.find('.ui-expansion-panel__description').text()).toBe('Shipping and returns')
    })

    it('lets #header replace title and description', async () => {
      const wrapper = await mount({ title: 'Details', description: 'More' }, { header: () => h('strong', 'Custom') })
      const content = wrapper.find('.ui-expansion-panel__header-content')

      expect(content.find('strong').text()).toBe('Custom')
      expect(wrapper.find('.ui-expansion-panel__title').exists()).toBe(false)
      expect(wrapper.find('.ui-expansion-panel__description').exists()).toBe(false)
    })

    it('draws the chevron by default', async () => {
      const wrapper = await mount({ title: 'Details' })

      expect(wrapper.find('.ui-expansion-panel__trailing .ui-expansion-panel__chevron').exists()).toBe(true)
    })

    it.each([true, false])('hands expanded=%s to #trailing in place of the chevron', async (modelValue) => {
      const wrapper = await mount(
        { title: 'X', modelValue },
        { trailing: ({ expanded }: { expanded: boolean }) => h('b', expanded ? 'Hide' : 'Show') },
      )

      expect(wrapper.find('.ui-expansion-panel__trailing').text()).toBe(modelValue ? 'Hide' : 'Show')
      expect(wrapper.find('.ui-expansion-panel__chevron').exists()).toBe(false)
    })
  })

  describe('heading level', () => {
    it('leaves the header button bare without a level', async () => {
      const wrapper = await mount({ title: 'X' })

      expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)
      expect(wrapper.find('.ui-expansion-panel__header').element.parentElement).toBe(wrapper.element)
    })

    it.each([2, 3, 4, 5, 6] as const)('wraps the header button in h%i', async (level) => {
      const wrapper = await mount({ title: 'X', headingLevel: level })
      const heading = wrapper.find(`h${level}`)

      expect(heading.classes()).toContain('ui-expansion-panel__heading')
      expect(heading.find('.ui-expansion-panel__header').exists()).toBe(true)
    })
  })

  describe('state modifiers', () => {
    it('marks an open panel', async () => {
      const wrapper = await mount({ title: 'X', modelValue: true })

      expect(wrapper.classes()).toContain('ui-expansion-panel--expanded')
    })

    it('marks a disabled panel', async () => {
      const wrapper = await mount({ title: 'X', disabled: true })

      expect(wrapper.classes()).toContain('ui-expansion-panel--disabled')
    })

    it('marks a panel inside a group, and the locked header of a mandatory one', async () => {
      const wrapper = await mountSuspended(defineComponent({
        render: () => h(MExpansionPanels, { mandatory: true, modelValue: 'a' }, () => [
          h(MExpansionPanel, { value: 'a', title: 'A' }),
          h(MExpansionPanel, { value: 'b', title: 'B' }),
        ]),
      }))
      const panels = wrapper.findAll('.ui-expansion-panel')
      const headers = wrapper.findAll('.ui-expansion-panel__header')

      expect(panels.every(panel => panel.classes().includes('ui-expansion-panel--grouped'))).toBe(true)
      expect(headers[0]!.classes()).toContain('ui-expansion-panel__header--locked')
      expect(headers[1]!.classes()).not.toContain('ui-expansion-panel__header--locked')
      wrapper.unmount()
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ title: 'X', modelValue: true, disabled: true })

      expect(Object.keys(wrapper.attributes()).some(name => name.startsWith('data-'))).toBe(false)
    })
  })

  describe('attribute routing', () => {
    it('sends class and style to the root and every other attribute to the button', async () => {
      const wrapper = await mount({ title: 'X' }, undefined, {
        'class': 'faq',
        'style': 'margin-top: 8px;',
        'id': 'shipping',
        'aria-describedby': 'hint',
        'data-test': 'panel',
      })
      const header = wrapper.find('.ui-expansion-panel__header')

      expect(wrapper.classes()).toContain('faq')
      expect(wrapper.attributes('style')).toContain('margin-top')
      expect(wrapper.attributes('id')).toBeUndefined()
      expect(header.attributes('id')).toBe('shipping')
      expect(header.attributes('aria-describedby')).toBe('hint')
      expect(header.attributes('data-test')).toBe('panel')
    })
  })
})
