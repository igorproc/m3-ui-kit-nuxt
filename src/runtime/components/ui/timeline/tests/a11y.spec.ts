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

describe('m-timeline · a11y', () => {
  describe('list semantics', () => {
    it('renders a native ordered list of list items', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A' }, { title: 'B' }, { title: 'C' }]))

      expect(wrapper.find('ol.ui-timeline').attributes('role')).toBeUndefined()
      expect(wrapper.findAll('ol.ui-timeline > li.ui-timeline-item')).toHaveLength(3)
    })

    it('keeps the DOM order whatever side an item is drawn on', async () => {
      const wrapper = await mount(timeline({ side: 'alternate' }, [{ title: 'First' }, { title: 'Second' }]))

      expect(wrapper.findAll('.ui-timeline-item__title').map(title => title.text())).toEqual(['First', 'Second'])
    })
  })

  describe('decoration', () => {
    it('hides the rail and its dot from assistive tech', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'Order placed', icon: 'round-check' }]))

      expect(wrapper.find('.ui-timeline-divider').attributes('aria-hidden')).toBe('true')
    })

    it('hides a custom #dot along with the rail', async () => {
      const wrapper = await mount(single({ title: 'A' }, { dot: () => h('b', { class: 'mark' }, '1') }))

      expect(wrapper.find('.mark').element.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    it('keeps the content readable', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'Order placed', body: 'Order 1248 created.' }]))

      expect(wrapper.find('.ui-timeline-item__content').element.closest('[aria-hidden="true"]')).toBeNull()
    })
  })

  describe('status', () => {
    it('states the outcome in a visually hidden word read before the title', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'Delivery', status: 'Failed', color: 'error', icon: 'ic:outline-close' }]))
      const content = wrapper.find('.ui-timeline-item__content')
      const status = content.find('.ui-timeline-item__status')

      expect(status.text()).toBe('Failed')
      expect(status.attributes('aria-hidden')).toBeUndefined()
      expect(content.element.firstElementChild).toBe(status.element)
    })

    it('renders no status word without a status — the kit ships no wording', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', color: 'error' }]))

      expect(wrapper.find('.ui-timeline-item__status').exists()).toBe(false)
    })
  })

  describe('time', () => {
    it('renders the machine-readable time through a time element', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00:00+04:00' }]))
      const time = wrapper.find('.ui-timeline-item__time')

      expect(time.element.tagName).toBe('TIME')
      expect(time.attributes('datetime')).toBe('2026-07-12T09:00:00+04:00')
      expect(time.text()).toBe('09:00')
    })

    it('keeps the time in reading order before the content', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', time: '09:00', datetime: '2026-07-12T09:00' }]))
      const item = wrapper.find('.ui-timeline-item')
      const opposite = item.find('.ui-timeline-item__opposite').element
      const content = item.find('.ui-timeline-item__content').element

      expect(opposite.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('content element', () => {
    it('lets an event be a self-contained article', async () => {
      const wrapper = await mount(timeline({}, [{ title: 'A', contentTag: 'article' }]))

      expect(wrapper.find('article.ui-timeline-item__content').attributes('role')).toBeUndefined()
    })
  })
})
