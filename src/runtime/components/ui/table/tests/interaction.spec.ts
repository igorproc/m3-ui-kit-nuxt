import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTablePagination from '#kit/components/fragments/table/pagination/index.vue'
import { mountTable, rows } from './helpers'
import type { Wrapper } from './helpers'

let current: Wrapper | null = null

async function mount(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountTable(props, options)

  return current
}

afterEach(() => {
  current?.unmount()
  current = null
})

const labels = { previousLabel: 'Previous page', nextLabel: 'Next page' }

describe('m-table · interaction', () => {
  describe('row selection', () => {
    it('toggles a row and emits the next selection', async () => {
      const wrapper = await mount({ selectable: true })

      await wrapper.findAll('tbody input')[1]!.setValue(true)

      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[rows[1]]])
    })

    it('takes a selected row out again', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[0], rows[1]] })

      await wrapper.findAll('tbody input')[0]!.setValue(false)

      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[rows[1]]])
    })

    it('keeps rows of other pages selected and renders only the current page', async () => {
      const offPage = { id: 9, name: 'Zed', amount: 1 }
      const wrapper = await mount({ selectable: true, selectedRows: [offPage, rows[0]] })

      expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
      expect(wrapper.text()).not.toContain('Zed')

      await wrapper.findAll('tbody input')[1]!.setValue(true)
      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage, rows[0], rows[1]]])
    })

    it('does not drop the selection when the page changes, and shows it again on return', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[0]] })

      await wrapper.setProps({ data: [{ id: 7, name: 'Page two', amount: 2 }] })
      expect(wrapper.emitted('update:selectedRows')).toBeUndefined()
      expect(wrapper.find('tbody .ui-table__row').classes()).not.toContain('ui-table__row--selected')

      await wrapper.setProps({ data: rows })
      expect(wrapper.find('tbody .ui-table__row').classes()).toContain('ui-table__row--selected')
    })

    it('keeps the selection without a bound v-model', async () => {
      const wrapper = await mount({ selectable: true })

      await wrapper.findAll('tbody input')[0]!.setValue(true)

      expect(wrapper.find('tbody .ui-table__row').classes()).toContain('ui-table__row--selected')
    })

    it('follows a selection replaced from outside', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[0]] })

      await wrapper.setProps({ selectedRows: [rows[2]] })

      const selected = wrapper.findAll('tbody .ui-table__row').map(row => row.classes().includes('ui-table__row--selected'))
      expect(selected).toEqual([false, false, true])
    })
  })

  describe('select all', () => {
    it('checks select-all only when every row of the page is selected', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [{ id: 9, name: 'Zed', amount: 1 }, rows[0]] })
      const selectAll = () => wrapper.find('thead input').element as HTMLInputElement

      expect(selectAll().checked).toBe(false)

      await wrapper.setProps({ selectedRows: [...rows] })
      expect(selectAll().checked).toBe(true)
    })

    it('selects the rest of the page, then clears the page, leaving other pages alone', async () => {
      const offPage = { id: 9, name: 'Zed', amount: 1 }
      const wrapper = await mount({
        'selectable': true,
        'selectedRows': [offPage, rows[0]],
        'onUpdate:selectedRows': (next: unknown) => wrapper.setProps({ selectedRows: next }),
      })
      const selectAll = () => wrapper.find('thead input')

      await selectAll().setValue(true)
      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage, ...rows]])

      await selectAll().setValue(false)
      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage]])
    })

    it('completes a mixed page on activation and leaves the mixed state', async () => {
      const wrapper = await mount({
        'selectable': true,
        'selectedRows': [rows[1]],
        'onUpdate:selectedRows': (next: unknown) => wrapper.setProps({ selectedRows: next }),
      }, { attachTo: document.body })
      const selectAll = () => wrapper.find('thead input')

      // A real activation: the browser checks the box and clears `indeterminate`.
      ;(selectAll().element as HTMLInputElement).click()
      await flushPromises()

      expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[rows[1], rows[0], rows[2]]])
      expect((selectAll().element as HTMLInputElement).indeterminate).toBe(false)
      expect((selectAll().element as HTMLInputElement).checked).toBe(true)
    })

    it('turns mixed again when one row of a full page is cleared', async () => {
      const wrapper = await mount({
        'selectable': true,
        'selectedRows': [...rows],
        'onUpdate:selectedRows': (next: unknown) => wrapper.setProps({ selectedRows: next }),
      })

      await wrapper.findAll('tbody input')[0]!.setValue(false)

      expect((wrapper.find('thead input').element as HTMLInputElement).indeterminate).toBe(true)
    })

    it('stays unchecked on an empty page', async () => {
      const wrapper = await mount({ selectable: true, data: [], selectedRows: [rows[0]] })

      expect((wrapper.find('thead input').element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('row click', () => {
    it('emits row-click for a click on the row, not on its checkbox', async () => {
      const wrapper = await mount({ selectable: true })
      const row = wrapper.findAll('tbody .ui-table__row')[2]!

      await row.findAll('td')[1]!.trigger('click')
      expect(wrapper.emitted('row-click')).toHaveLength(1)
      expect(wrapper.emitted('row-click')![0]![0]).toEqual(rows[2])

      await row.find('input').trigger('click')
      expect(wrapper.emitted('row-click')).toHaveLength(1)
    })

    it('leaves a click on a control inside a cell to that control', async () => {
      const wrapper = await mount({}, { slots: { 'cell-name': () => h('button', { type: 'button', class: 'open' }, 'Open') } })

      await wrapper.find('.open').trigger('click')

      expect(wrapper.emitted('row-click')).toBeUndefined()
    })
  })

  describe('sorting', () => {
    it('cycles ascending → descending → none', async () => {
      const wrapper = await mount({ 'sort': null, 'onUpdate:sort': (value: unknown) => wrapper.setProps({ sort: value }) })
      const press = () => wrapper.findAll('th')[0]!.find('button').trigger('click')

      await press()
      expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([{ key: 'name', direction: 'asc' }])

      await press()
      expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([{ key: 'name', direction: 'desc' }])

      await press()
      expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([null])
    })

    it('starts a fresh ascending sort on another column', async () => {
      const wrapper = await mount({ sort: { key: 'name', direction: 'desc' } })

      await wrapper.findAll('th')[1]!.find('button').trigger('click')

      expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([{ key: 'amount', direction: 'asc' }])
    })

    it('keeps the sort locally without a bound v-model', async () => {
      const wrapper = await mount()

      await wrapper.findAll('th')[0]!.find('button').trigger('click')

      expect(wrapper.findAll('.ui-table__sort-icon')[0]!.classes()).not.toContain('ui-table__sort-icon--idle')
    })
  })

  describe('footer', () => {
    it('forwards page and page size changes, a new size starting from the first page', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, currentPage: 2, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows', nextPageLabel: 'Next' })

      await wrapper.find('[aria-label="Next"]').trigger('click')
      expect(wrapper.emitted('update:currentPage')!.at(-1)).toEqual([3])

      await wrapper.find('select').setValue('25')
      expect(wrapper.emitted('update:pageSize')!.at(-1)).toEqual([25])
      expect(wrapper.emitted('update:currentPage')!.at(-1)).toEqual([1])
    })

    it('goes one page back from Previous', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, currentPage: 3, previousPageLabel: 'Prev' })

      await wrapper.find('[aria-label="Prev"]').trigger('click')

      expect(wrapper.emitted('update:currentPage')!.at(-1)).toEqual([2])
    })

    // B9.2a (Q24-А): Next sets `loading`; navigation waits for the page.
    it('swallows navigation while a page loads', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, currentPage: 2, loading: true, previousPageLabel: 'Prev', nextPageLabel: 'Next' })

      await wrapper.find('[aria-label="Next"]').trigger('click')
      await wrapper.find('[aria-label="Prev"]').trigger('click')

      expect(wrapper.emitted('update:currentPage')).toBeUndefined()
    })

    it('swallows a page size change while a page loads and keeps showing the current size', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, pageSize: 10, loading: true, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows' })
      const select = wrapper.find('select')

      await select.setValue('25')

      expect(wrapper.emitted('update:pageSize')).toBeUndefined()
      expect(wrapper.emitted('update:currentPage')).toBeUndefined()
      expect((select.element as HTMLSelectElement).value).toBe('10')
    })

    it('keeps the page size picker shut while a page loads', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, loading: true, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows' })
      const select = wrapper.find('select').element
      const press = new MouseEvent('mousedown', { cancelable: true })
      const key = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
      const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })

      select.dispatchEvent(press)
      select.dispatchEvent(key)
      select.dispatchEvent(tab)

      expect(press.defaultPrevented).toBe(true)
      expect(key.defaultPrevented).toBe(true)
      expect(tab.defaultPrevented).toBe(false)
    })

    it('swallows a press past either end', async () => {
      const first = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 1, totalItems: 30, ...labels } })
      await first.find('[aria-label="Previous page"]').trigger('click')
      expect(first.emitted('update:currentPage')).toBeUndefined()
      first.unmount()

      const last = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 3, totalItems: 30, ...labels } })
      await last.find('[aria-label="Next page"]').trigger('click')
      expect(last.emitted('update:currentPage')).toBeUndefined()
      last.unmount()
    })

    it('clamps a page beyond the last one', async () => {
      const wrapper = await mountSuspended(MTablePagination, {
        props: { pageSize: 10, currentPage: 99, totalItems: 42, ...labels },
        slots: { 'pagination-info': ({ page, pageCount }: { page: number, pageCount: number }) => h('span', `${page}/${pageCount}`) },
      })

      expect(wrapper.text()).toContain('5/5')
      wrapper.unmount()
    })
  })

  describe('data states', () => {
    it('hands the error and a retry to the #error slot', async () => {
      const wrapper = await mount({ data: [], error: true }, {
        slots: { error: ({ retry }: { retry: () => void }) => h('button', { class: 'retry', onClick: retry }, 'Retry') },
      })

      await wrapper.find('.retry').trigger('click')

      expect(wrapper.emitted('retry')).toHaveLength(1)
    })

    it('renders the rows again when the data arrives', async () => {
      const wrapper = await mount({ data: [], loading: true })

      await wrapper.setProps({ data: rows, loading: false })

      expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
      expect(wrapper.find('.ui-table__message-row').exists()).toBe(false)
    })

    it('swaps the empty message for rows and back', async () => {
      const wrapper = await mount({ data: [] }, { slots: { empty: () => 'No orders yet' } })

      await wrapper.setProps({ data: rows })
      expect(wrapper.find('.ui-table__message--empty').exists()).toBe(false)

      await wrapper.setProps({ data: [] })
      expect(wrapper.find('.ui-table__message--empty').text()).toBe('No orders yet')
    })
  })
})
