import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTablePagination from '#kit/components/fragments/table/pagination/index.vue'
import { mountTable } from './helpers'

const labels = { previousLabel: 'Previous page', nextLabel: 'Next page' }

describe('MTable — footer', () => {
  it('renders the footer only when pagination is on', async () => {
    expect((await mountTable()).find('.ui-table__pagination').exists()).toBe(false)
    expect((await mountTable({ pagination: true, totalItems: 20 })).find('.ui-table__pagination').exists()).toBe(true)
  })

  it('hands the page numbers to #pagination-info', async () => {
    const wrapper = await mountTable({ pagination: true, totalItems: 42, pageSize: 10, currentPage: 2 }, {
      slots: { 'pagination-info': ({ start, end, total }: { start: number, end: number, total: number }) => h('span', `${start}–${end} of ${total}`) },
    })

    expect(wrapper.find('.ui-table__pagination-info').text()).toBe('11–20 of 42')
  })

  // T-2 (M3-polish): the chevrons carry the class that turns them in RTL.
  it('marks both chevrons as direction-dependent icons', async () => {
    const wrapper = await mountTable({ pagination: true, totalItems: 20, previousPageLabel: 'Previous page', nextPageLabel: 'Next page' })

    expect(wrapper.findAll('.ui-table__pagination-actions .ui-table__page-icon')).toHaveLength(2)
  })

  it('names the navigation buttons from the table props', async () => {
    const wrapper = await mountTable({ pagination: true, totalItems: 42, previousPageLabel: 'Назад', nextPageLabel: 'Вперёд' })

    expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Вперёд"]').exists()).toBe(true)
  })

  it('blocks navigation while a page loads', async () => {
    const wrapper = await mountTable({ pagination: true, totalItems: 42, currentPage: 2, loading: true, previousPageLabel: 'Prev', nextPageLabel: 'Next' })

    expect(wrapper.find('[aria-label="Prev"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Next"]').attributes('disabled')).toBeDefined()
  })

  it('forwards page and page size changes', async () => {
    const wrapper = await mountTable({ pagination: true, totalItems: 42, currentPage: 2, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows', nextPageLabel: 'Next' })

    await wrapper.find('[aria-label="Next"]').trigger('click')
    expect(wrapper.emitted('update:currentPage')!.at(-1)).toEqual([3])

    await wrapper.find('select').setValue('25')
    expect(wrapper.emitted('update:pageSize')!.at(-1)).toEqual([25])
    expect(wrapper.emitted('update:currentPage')!.at(-1)).toEqual([1])
  })
})

describe('table footer fragment', () => {
  it('disables previous on the first page and next on the last', async () => {
    const first = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 1, totalItems: 100, ...labels } })
    expect(first.find('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(first.find('[aria-label="Next page"]').attributes('disabled')).toBeUndefined()

    const last = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 10, totalItems: 100, ...labels } })
    expect(last.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('clamps a page beyond the last one', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 10, currentPage: 99, totalItems: 42, ...labels },
      slots: { 'pagination-info': ({ page, pageCount }: { page: number, pageCount: number }) => h('span', `${page}/${pageCount}`) },
    })

    expect(wrapper.text()).toContain('5/5')
    expect(wrapper.find('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
  })

  it('labels the page size selector and lists the sizes', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 25, currentPage: 1, totalItems: 100, pageSizeOptions: [10, 25, 50], pageSizeLabel: 'Rows per page', ...labels },
    })
    const select = wrapper.find('select')

    expect(select.element.closest('label')!.textContent).toContain('Rows per page')
    expect(select.findAll('option').map(option => option.text())).toEqual(['10', '25', '50'])
    expect((select.element as HTMLSelectElement).value).toBe('25')
  })

  it('has no page size selector without options', async () => {
    const wrapper = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 1, totalItems: 100, ...labels } })
    expect(wrapper.find('select').exists()).toBe(false)
  })
})
