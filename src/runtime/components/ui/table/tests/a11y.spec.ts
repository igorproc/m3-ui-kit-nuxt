import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTablePagination from '#kit/components/fragments/table/pagination/index.vue'
import { columns, mountTable, rows } from './helpers'
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

describe('m-table · a11y', () => {
  describe('table semantics', () => {
    it('relies on the native table, head and body rather than ARIA grid roles', async () => {
      const wrapper = await mount()

      expect(wrapper.find('table').attributes('role')).toBeUndefined()
      expect(wrapper.find('thead').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('scopes every column header to its column', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('th[scope="col"]')).toHaveLength(columns.length)
    })

    it('gives the checkbox header cell no column scope — it heads no data', async () => {
      const wrapper = await mount({ selectable: true })

      expect(wrapper.find('.ui-table__head-cell--checkbox').attributes('scope')).toBeUndefined()
    })
  })

  describe('naming', () => {
    it('names the table by its visible caption', async () => {
      const wrapper = await mount({ caption: 'Orders' })

      expect(wrapper.find('table > caption').text()).toBe('Orders')
    })

    it('puts class and style on the frame and every other attribute on the table', async () => {
      const wrapper = await mount({}, { attrs: { 'class': 'mine', 'style': 'margin: 0', 'aria-label': 'Orders', 'aria-describedby': 'hint' } })
      const root = wrapper.find('.ui-table-container')
      const table = wrapper.find('table')

      expect(root.classes()).toContain('mine')
      expect(root.attributes('style')).toContain('margin')
      expect(root.attributes('aria-label')).toBeUndefined()
      expect(table.attributes('aria-label')).toBe('Orders')
      expect(table.attributes('aria-describedby')).toBe('hint')
    })

    it('names each row checkbox by its row and the select-all checkbox by its label', async () => {
      const wrapper = await mount({ selectable: true, selectAllLabel: 'Select all orders' })
      const firstRow = wrapper.findAll('tbody .ui-table__row')[0]!
      const nameCell = firstRow.findAll('td')[1]!

      expect(firstRow.find('input').attributes('aria-labelledby')).toBe(nameCell.attributes('id'))
      expect(nameCell.text()).toBe('Ann')
      expect(wrapper.find('thead input').attributes('aria-label')).toBe('Select all orders')
    })

    it('gives every row its own name id', async () => {
      const wrapper = await mount({ selectable: true })
      const ids = wrapper.findAll('tbody input').map(input => input.attributes('aria-labelledby'))

      expect(new Set(ids).size).toBe(rows.length)
    })
  })

  describe('selection state', () => {
    it('marks selected rows for assistive technology', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[0]] })
      const [first, second] = wrapper.findAll('tbody .ui-table__row')

      expect(first!.attributes('aria-selected')).toBe('true')
      expect(second!.attributes('aria-selected')).toBe('false')
    })

    it('leaves aria-selected off a table without selection', async () => {
      const wrapper = await mount()

      expect(wrapper.find('tbody .ui-table__row').attributes('aria-selected')).toBeUndefined()
    })

    // B9.2b: a partly selected page is neither all nor none.
    it('reports a partly selected page as mixed on select-all', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[1]] })
      const selectAll = wrapper.find('thead input').element as HTMLInputElement

      expect(selectAll.indeterminate).toBe(true)
      expect(selectAll.checked).toBe(false)
      expect(wrapper.find('thead .ui-checkbox').classes()).toContain('ui-checkbox--indeterminate')
    })

    it.each([
      ['none', []],
      ['every', rows],
    ] as const)('reports select-all as not mixed when %s row of the page is selected', async (_, selected) => {
      const wrapper = await mount({ selectable: true, selectedRows: [...selected] })

      expect((wrapper.find('thead input').element as HTMLInputElement).indeterminate).toBe(false)
      expect(wrapper.find('thead .ui-checkbox').classes()).not.toContain('ui-checkbox--indeterminate')
    })

    it('counts only the page: rows of other pages do not make it mixed', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [{ id: 9, name: 'Zed', amount: 1 }] })

      expect((wrapper.find('thead input').element as HTMLInputElement).indeterminate).toBe(false)
    })

    it('reports the checkbox state through native checkboxes', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[1]] })
      const checked = wrapper.findAll('tbody input').map(input => (input.element as HTMLInputElement).checked)

      expect(checked).toEqual([false, true, false])
      expect(wrapper.find('tbody input').attributes('type')).toBe('checkbox')
    })
  })

  describe('sorting', () => {
    it('keeps aria-sort in step with the sort', async () => {
      const wrapper = await mount({ 'sort': null, 'onUpdate:sort': (value: unknown) => wrapper.setProps({ sort: value }) })
      const header = () => wrapper.findAll('th')[0]!
      const press = () => header().find('button').trigger('click')

      expect(header().attributes('aria-sort')).toBe('none')

      await press()
      expect(header().attributes('aria-sort')).toBe('ascending')

      await press()
      expect(header().attributes('aria-sort')).toBe('descending')

      await press()
      expect(header().attributes('aria-sort')).toBe('none')
    })

    it('puts aria-sort only on sortable columns', async () => {
      const wrapper = await mount({ columns: [columns[0]!, { key: 'amount', label: 'Amount' }] })

      expect(wrapper.findAll('th').map(cell => cell.attributes('aria-sort'))).toEqual(['none', undefined])
    })

    it('sorts with a native button that never submits, named by the column label', async () => {
      const wrapper = await mount()
      const button = wrapper.find('.ui-table__sort')

      expect(button.element.tagName).toBe('BUTTON')
      expect(button.attributes('type')).toBe('button')
      expect(button.find('.ui-table__head-label').text()).toBe('Name')
    })

    it('hides the sort arrow — aria-sort already says it', async () => {
      const wrapper = await mount({ sort: { key: 'name', direction: 'asc' } })

      expect(wrapper.find('.ui-table__sort-icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('busy and status', () => {
    it('marks the table busy while loading, and drops it once loaded', async () => {
      const loading = await mount({ data: [], loading: true })
      expect(loading.find('table').attributes('aria-busy')).toBe('true')

      const loaded = await mount()
      expect(loaded.find('table').attributes('aria-busy')).toBeUndefined()
    })

    it('keeps every loading indicator out of the accessibility tree — aria-busy speaks for it', async () => {
      const first = await mount({ data: [], loading: true })
      expect(first.find('.ui-table__message--loading .ui-loading').attributes('aria-hidden')).toBe('true')

      const refresh = await mount({ loading: true })
      expect(refresh.find('.ui-table-container__busy .ui-loading').attributes('aria-hidden')).toBe('true')
    })

    it('keeps one polite status region mounted and changes only its text', async () => {
      const wrapper = await mount({ statusText: '' })
      const region = wrapper.find('.ui-table-container__status')

      expect(region.attributes('role')).toBe('status')
      expect(region.attributes('aria-atomic')).toBe('true')
      expect(region.text()).toBe('')

      await wrapper.setProps({ statusText: 'Sorted by amount, descending' })
      expect(wrapper.find('.ui-table-container__status').element).toBe(region.element)
      expect(region.text()).toBe('Sorted by amount, descending')
    })

    it('announces an error message given as a string', async () => {
      const wrapper = await mount({ data: [], error: 'Could not load orders' })

      expect(wrapper.find('.ui-table-container__status').text()).toBe('Could not load orders')
    })

    // Q-7 (M3-polish): the error is announced over statusText while it lasts.
    it('announces the error instead of statusText while there is one', async () => {
      const wrapper = await mount({ statusText: 'Page 2', error: 'Page 2 failed' })
      const region = wrapper.find('.ui-table-container__status')

      expect(region.text()).toBe('Page 2 failed')

      await wrapper.setProps({ error: false })
      expect(region.text()).toBe('Page 2')
    })

    it('hides the error icon — the message says it', async () => {
      const wrapper = await mount({ data: [], error: 'Failed' })

      expect(wrapper.find('.ui-table__message-icon').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('footer', () => {
    it('names the navigation buttons from the table props', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, previousPageLabel: 'Назад', nextPageLabel: 'Вперёд' })

      expect(wrapper.find('[aria-label="Назад"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Вперёд"]').exists()).toBe(true)
    })

    // B9.2a (Q24-А): a native `disabled` on the focused button dropped focus on every page request.
    it('soft-disables navigation while a page loads, keeping the buttons focusable', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, currentPage: 2, loading: true, previousPageLabel: 'Prev', nextPageLabel: 'Next' })

      for (const name of ['Prev', 'Next']) {
        expect(wrapper.find(`[aria-label="${name}"]`).attributes('aria-disabled')).toBe('true')
        expect(wrapper.find(`[aria-label="${name}"]`).attributes('disabled')).toBeUndefined()
      }
    })

    // B9.2a: the page size selector is usually the focused control when a new
    // size starts loading; natively disabled, it dropped focus on body.
    it('soft-disables the page size selector while a page loads, keeping it focusable', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, loading: true, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows' })
      const select = wrapper.find('select')

      expect(select.attributes('disabled')).toBeUndefined()
      expect(select.attributes('aria-disabled')).toBe('true')
    })

    it('leaves an idle page size selector unmarked', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows' })

      expect(wrapper.find('select').attributes('aria-disabled')).toBeUndefined()
    })

    it('soft-disables previous on the first page and next on the last', async () => {
      const first = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 1, totalItems: 100, ...labels } })
      expect(first.find('[aria-label="Previous page"]').attributes('aria-disabled')).toBe('true')
      expect(first.find('[aria-label="Previous page"]').attributes('disabled')).toBeUndefined()
      expect(first.find('[aria-label="Next page"]').attributes('aria-disabled')).toBeUndefined()
      first.unmount()

      const last = await mountSuspended(MTablePagination, { props: { pageSize: 10, currentPage: 10, totalItems: 100, ...labels } })
      expect(last.find('[aria-label="Next page"]').attributes('aria-disabled')).toBe('true')
      last.unmount()
    })

    it('labels the page size selector with a real label and lists the sizes', async () => {
      const wrapper = await mountSuspended(MTablePagination, {
        props: { pageSize: 25, currentPage: 1, totalItems: 100, pageSizeOptions: [10, 25, 50], pageSizeLabel: 'Rows per page', ...labels },
      })
      const select = wrapper.find('select')

      expect(select.element.closest('label')!.textContent).toContain('Rows per page')
      expect(select.findAll('option').map(option => option.text())).toEqual(['10', '25', '50'])
      expect((select.element as HTMLSelectElement).value).toBe('25')
      wrapper.unmount()
    })

    it('hides the selector arrow — the native select states it is a list', async () => {
      const wrapper = await mountSuspended(MTablePagination, {
        props: { pageSize: 10, currentPage: 1, totalItems: 100, pageSizeOptions: [10, 25], pageSizeLabel: 'Rows', ...labels },
      })

      expect(wrapper.find('.ui-table__page-size-icon').attributes('aria-hidden')).toBe('true')
      wrapper.unmount()
    })
  })
})
