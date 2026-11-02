import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import MPagination from '../index.vue'

const labels = {
  ariaLabel: 'Pagination',
  firstLabel: 'First page',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  lastLabel: 'Last page',
}

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MPagination, { props: { ...labels, length: 10, modelValue: 1, ...props }, slots })

  return current as VueWrapper
}

const pagesOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-pagination__number').map(number => Number(number.text()))
const controlsOf = (wrapper: VueWrapper) => wrapper.findAll('.ui-icon-button').map(button => button.attributes('aria-label'))

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-pagination · variants', () => {
  describe('structure', () => {
    it('renders a nav around an ordered list of items', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.find('ol.ui-pagination__list').exists()).toBe(true)
      expect(wrapper.findAll('.ui-pagination__list > .ui-pagination__item').length).toBeGreaterThan(0)
    })

    it('renders no page buttons for zero length', async () => {
      const wrapper = await mount({ length: 0 })

      expect(wrapper.findAll('.ui-pagination__page')).toHaveLength(0)
    })
  })

  describe('length and totalVisible', () => {
    it.each([
      [1, 1, 7, [1]],
      [1, 5, 7, [1, 2, 3, 4, 5]],
      [1, 10, 7, [1, 2, 3, 4, 5, 10]],
      [5, 10, 7, [1, 4, 5, 6, 10]],
      [10, 10, 7, [1, 6, 7, 8, 9, 10]],
      [50, 100, 9, [1, 48, 49, 50, 51, 52, 100]],
    ])('page %i of %i with %i slots shows pages %j', async (page, length, totalVisible, expected) => {
      const wrapper = await mount({ modelValue: page, length, totalVisible })

      expect(pagesOf(wrapper)).toEqual(expected)
    })

    it.each([
      [1, 10, 1],
      [5, 10, 2],
      [10, 10, 1],
      [1, 5, 0],
    ])('page %i of %i renders %i ellipses', async (page, length, count) => {
      const wrapper = await mount({ modelValue: page, length })

      expect(wrapper.findAll('.ui-pagination__ellipsis')).toHaveLength(count)
    })

    it('defaults to seven slots', async () => {
      const wrapper = await mount({ modelValue: 50, length: 100 })

      expect(wrapper.findAll('.ui-pagination__page').length + wrapper.findAll('.ui-pagination__ellipsis').length).toBe(7)
    })
  })

  describe('current page', () => {
    // MO-04: the current page is set heavier; a hidden copy of the number in that
    // weight holds every button at its widest, so the row never moves with it.
    it('stacks each number on a hidden copy that reserves the heavier weight', async () => {
      const wrapper = await mount({ modelValue: 3, length: 5 })
      const digits = wrapper.findAll('.ui-pagination__page').map(page => page.find('.ui-pagination__digits'))

      expect(digits).toHaveLength(5)
      for (const [index, stack] of digits.entries()) {
        expect(stack.find('.ui-pagination__number').text()).toBe(String(index + 1))
        expect(stack.find('.ui-pagination__reserve').text()).toBe(String(index + 1))
      }
    })

    it('marks only the number of the current page with its modifier', async () => {
      const wrapper = await mount({ modelValue: 3, length: 5 })

      expect(wrapper.findAll('.ui-pagination__number').map(number => number.classes().includes('ui-pagination__number--current')))
        .toEqual([false, false, true, false, false])
    })

    it('draws the current page tonal and the rest as text buttons', async () => {
      const wrapper = await mount({ modelValue: 3, length: 5 })
      const pages = wrapper.findAll('.ui-pagination__page')

      expect(pages.map(page => page.classes().includes('ui-button--tonal'))).toEqual([false, false, true, false, false])
      expect(pages.filter(page => page.classes().includes('ui-button--text'))).toHaveLength(4)
    })
  })

  describe('controls', () => {
    it.each([
      [{}, ['Previous page', 'Next page']],
      [{ showFirstLast: true }, ['First page', 'Previous page', 'Next page', 'Last page']],
      [{ showPrevNext: false }, []],
      [{ showPrevNext: false, showFirstLast: true }, ['First page', 'Last page']],
    ])('with %j renders the controls %j', async (flags, expected) => {
      const wrapper = await mount(flags)

      expect(controlsOf(wrapper)).toEqual(expected)
    })

    // Q27-А: every control glyph points along the reading direction.
    it('mirrors every control glyph in RTL', async () => {
      const wrapper = await mount({ showFirstLast: true })
      const glyphs = wrapper.findAll('.ui-icon-button .ui-icon')

      expect(glyphs).toHaveLength(4)
      expect(glyphs.every(glyph => glyph.classes().includes('ui-icon--mirror'))).toBe(true)
    })

    it('places first and previous before the pages, next and last after them', async () => {
      const wrapper = await mount({ showFirstLast: true, length: 3 })
      const order = wrapper.findAll('.ui-pagination__item').map(item => item.find('button').attributes('aria-label') ?? item.find('.ui-pagination__number').text())

      expect(order).toEqual(['First page', 'Previous page', '1', '2', '3', 'Next page', 'Last page'])
    })
  })

  describe('slots', () => {
    it('replaces every page button through the item slot', async () => {
      const wrapper = await mount({ length: 5, modelValue: 2 }, {
        item: ({ page, current: isCurrent }: { page: number, current: boolean }) =>
          h('span', { class: ['custom', { active: isCurrent }] }, String(page)),
      })

      expect(wrapper.findAll('.custom')).toHaveLength(5)
      expect(wrapper.find('.custom.active').text()).toBe('2')
      expect(wrapper.find('.ui-pagination__page').exists()).toBe(false)
    })

    it.each(['first', 'previous', 'next', 'last'])('replaces the %s control through its slot', async (name) => {
      const wrapper = await mount({ showFirstLast: true }, {
        [name]: ({ page }: { page: number }) => h('span', { class: `custom-${name}` }, String(page)),
      })

      expect(wrapper.find(`.custom-${name}`).exists()).toBe(true)
      expect(controlsOf(wrapper)).toHaveLength(3)
    })

    it.each([
      ['first', 1],
      ['previous', 3],
      ['next', 5],
      ['last', 10],
    ])('hands the %s slot the page it leads to', async (name, page) => {
      const wrapper = await mount({ showFirstLast: true, modelValue: 4 }, {
        [name]: (scope: { page: number }) => h('span', { class: 'target' }, String(scope.page)),
      })

      expect(wrapper.find('.target').text()).toBe(String(page))
    })

    it('replaces the ellipsis glyph through its slot', async () => {
      const wrapper = await mount({ modelValue: 5 }, { ellipsis: () => '⋯' })

      expect(wrapper.findAll('.ui-pagination__ellipsis').map(ellipsis => ellipsis.text())).toEqual(['⋯', '⋯'])
    })

    it('renders the default ellipsis glyph', async () => {
      const wrapper = await mount({ modelValue: 5 })

      expect(wrapper.find('.ui-pagination__ellipsis').text()).toBe('…')
    })
  })
})
