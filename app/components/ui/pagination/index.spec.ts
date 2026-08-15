import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MPagination from './index.vue'
import { createPaginationRange, normalizePage } from '~~/shared/utils/pagination'

describe('pagination range utility', () => {
  it('renders every page when the length fits', () => {
    expect(createPaginationRange(1, 5, 7).map(item => item.type === 'page' ? item.page : '…'))
      .toEqual([1, 2, 3, 4, 5])
  })

  it('keeps both ends and one ellipsis near the start', () => {
    expect(createPaginationRange(1, 10, 7).map(item => item.type === 'page' ? item.page : `…${item.key}`))
      .toEqual([1, 2, 3, 4, 5, '…end', 10])
  })

  it('centers the window with two ellipses in the middle', () => {
    expect(createPaginationRange(5, 10, 7).map(item => item.type === 'page' ? item.page : `…${item.key}`))
      .toEqual([1, '…start', 4, 5, 6, '…end', 10])
  })

  it('keeps both ends and one ellipsis near the end', () => {
    expect(createPaginationRange(10, 10, 7).map(item => item.type === 'page' ? item.page : `…${item.key}`))
      .toEqual([1, '…start', 6, 7, 8, 9, 10])
  })

  it('never emits an ellipsis that hides a single page', () => {
    const range = createPaginationRange(4, 10, 7)
    expect(range.every(item => item.type !== 'ellipsis' || item.key !== 'start')).toBe(true)
    expect(range.map(item => item.type === 'page' ? item.page : '…')).toEqual([1, 2, 3, 4, 5, '…', 10])
  })

  it('always produces exactly totalVisible slots for long lists', () => {
    for (const page of [1, 25, 50, 75, 100]) {
      expect(createPaginationRange(page, 100, 9)).toHaveLength(9)
    }
  })

  it('returns no items for zero length', () => {
    expect(createPaginationRange(1, 0, 7)).toEqual([])
  })

  it('clamps totalVisible up to the minimum slot count', () => {
    // Below the minimum still yields a valid centered window, never a crash.
    expect(createPaginationRange(3, 20, 2)).toHaveLength(5)
  })
})

describe('normalizePage', () => {
  it('clamps into [1, length]', () => {
    expect(normalizePage(0, 10)).toBe(1)
    expect(normalizePage(99, 10)).toBe(10)
    expect(normalizePage(4, 10)).toBe(4)
  })

  it('normalizes zero length and non-finite input to 1', () => {
    expect(normalizePage(5, 0)).toBe(1)
    expect(normalizePage(Number.NaN, 10)).toBe(1)
    expect(normalizePage(3.7, 10)).toBe(3)
  })
})

describe('MPagination', () => {
  it('renders a labelled nav with an ordered list of pages', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 1 } })
    expect(wrapper.find('nav.ui-pagination').attributes('aria-label')).toBe('Pagination')
    expect(wrapper.find('ol.ui-pagination__list').exists()).toBe(true)
    expect(wrapper.findAll('.ui-pagination__page').length).toBeGreaterThan(0)
  })

  it('marks the current page with aria-current', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 3 } })
    const current = wrapper.findAll('[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('3')
  })

  it('updates the model when a page is clicked', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 1 } })
    const page3 = wrapper.findAll('.ui-pagination__page').find(button => button.text() === '3')!
    await page3.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
  })

  it('shows the ellipsis as decorative and nonfocusable', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 20, modelValue: 10 } })
    const ellipsis = wrapper.find('.ui-pagination__ellipsis')
    expect(ellipsis.exists()).toBe(true)
    expect(ellipsis.attributes('aria-hidden')).toBe('true')
  })

  it('renders previous/next by default and disables them at the boundaries', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 1 } })
    const prev = wrapper.find('[aria-label="Previous page"]')
    const next = wrapper.find('[aria-label="Next page"]')
    expect(prev.attributes('disabled')).toBeDefined()
    expect(next.attributes('disabled')).toBeUndefined()

    await wrapper.setProps({ modelValue: 10 })
    expect(wrapper.find('[aria-label="Previous page"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('advances through the next control', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 4 } })
    await wrapper.find('[aria-label="Next page"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5])
  })

  it('renders first/last only when enabled', async () => {
    const bare = await mountSuspended(MPagination, { props: { length: 10, modelValue: 5 } })
    expect(bare.find('[aria-label="First page"]').exists()).toBe(false)

    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 5, showFirstLast: true } })
    await wrapper.find('[aria-label="Last page"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([10])
  })

  it('disables every control when disabled', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 3, disabled: true } })
    expect(wrapper.findAll('.ui-pagination__page').every(button => button.attributes('disabled') !== undefined)).toBe(true)
    await wrapper.findAll('.ui-pagination__page')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('normalizes the model down when length shrinks', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 10, modelValue: 8 } })
    await wrapper.setProps({ length: 5 })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5])
  })

  it('exposes safe bindings through the item slot', async () => {
    const wrapper = await mountSuspended(MPagination, {
      props: { length: 5, modelValue: 2 },
      slots: {
        item: ({ page, current, props: itemProps }: { page: number, current: boolean, props: Record<string, unknown> }) =>
          h('button', { ...itemProps, class: ['custom', { active: current }] }, String(page)),
      },
    })
    const buttons = wrapper.findAll('.custom')
    expect(buttons).toHaveLength(5)
    expect(wrapper.find('.custom.active').text()).toBe('2')
    await buttons[3]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([4])
  })

  it('renders no page buttons for zero length', async () => {
    const wrapper = await mountSuspended(MPagination, { props: { length: 0, modelValue: 1 } })
    expect(wrapper.findAll('.ui-pagination__page')).toHaveLength(0)
  })
})
