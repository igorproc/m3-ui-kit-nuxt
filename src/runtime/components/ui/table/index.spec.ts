import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTable from './index.vue'
import MTableHeader from '#kit/components/fragments/table/header/index.vue'
import MTablePagination from '#kit/components/fragments/table/pagination/index.vue'

interface Row { id: number, name: string, age: number }

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age' },
] as const

const data: Row[] = [
  { id: 1, name: 'Ann', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
]

describe('m-table', () => {
  it('renders a table with a row per data entry', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })

    expect(wrapper.find('table.ui-table').exists()).toBe(true)
    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(2)
  })

  it('renders column headers with scope="col"', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })

    const headers = wrapper.findAll('th[scope="col"]')
    expect(headers).toHaveLength(2)
    expect(headers[0]!.text()).toContain('Name')
  })

  it('renders a sort <button> for sortable columns only', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })

    const sortButtons = wrapper.findAll('.ui-table__header-sort')
    expect(sortButtons).toHaveLength(1)
    expect(sortButtons[0]!.element.tagName).toBe('BUTTON')
  })

  it('exposes aria-sort="none" on a sortable column initially', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })

    const sortableTh = wrapper.find('th.ui-table__cell--sortable')
    expect(sortableTh.attributes('aria-sort')).toBe('none')
  })

  it('emits update:sort ascending on first sort click', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })

    await wrapper.find('.ui-table__header-sort').trigger('click')

    const events = wrapper.findComponent(MTableHeader).emitted('update:sort')
    expect(events).toBeTruthy()
    expect(events!.at(-1)).toEqual([{ key: 'name', direction: 'asc' }])
  })

  it('renders pagination only when enabled', async () => {
    const without = await mountSuspended(MTable, {
      props: { columns: columns as never, data },
    })
    expect(without.find('.ui-table__pagination').exists()).toBe(false)

    const withPager = await mountSuspended(MTable, {
      props: { columns: columns as never, data, pagination: true, totalItems: 20 },
    })
    expect(withPager.find('.ui-table__pagination').exists()).toBe(true)
  })

  it('renders a selection checkbox column when selectable', async () => {
    const wrapper = await mountSuspended(MTable, {
      props: { columns: columns as never, data, selectable: true },
    })

    expect(wrapper.find('.ui-table__cell--checkbox').exists()).toBe(true)
  })
})

describe('m-table-pagination', () => {
  it('labels the prev/next buttons accessibly', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 10, currentPage: 2, totalItems: 100 },
    })

    expect(wrapper.find('[aria-label="Previous page"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Next page"]').exists()).toBe(true)
  })

  it('disables the previous button on the first page', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 10, currentPage: 1, totalItems: 100 },
    })

    const prev = wrapper.find('[aria-label="Previous page"]')
    expect(prev.attributes('disabled')).toBeDefined()
  })

  it('disables the next button on the last page', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 10, currentPage: 10, totalItems: 100 },
    })

    const next = wrapper.find('[aria-label="Next page"]')
    expect(next.attributes('disabled')).toBeDefined()
  })

  it('emits update:currentPage when next is clicked', async () => {
    const wrapper = await mountSuspended(MTablePagination, {
      props: { pageSize: 10, currentPage: 2, totalItems: 100 },
    })

    await wrapper.find('[aria-label="Next page"]').trigger('click')

    expect(wrapper.emitted('update:currentPage')?.at(-1)).toEqual([3])
  })
})
