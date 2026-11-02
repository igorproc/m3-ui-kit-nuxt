import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { columns, mountTable, rows } from './helpers'
import type { Row, Wrapper } from './helpers'

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

describe('m-table · variants', () => {
  describe('structure', () => {
    it('renders a table with a row per data entry inside its frame', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-table-container .ui-table-container__viewport table.ui-table').exists()).toBe(true)
      expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
    })

    it('renders a header cell per column, with its label', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('thead th').map(cell => cell.text())).toEqual(['Name', 'Amount'])
    })

    it('carries the default density and nothing else on a bare frame', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-table-container').classes()).toEqual(['ui-table-container', 'ui-table-container--density-default'])
      expect(wrapper.find('table').classes()).toEqual(['ui-table'])
    })

    it('draws the focus ring of the scroll region on its own element beside the viewport', async () => {
      const wrapper = await mount()
      const ring = wrapper.find('.ui-table-container__ring')

      expect(ring.exists()).toBe(true)
      expect(ring.element.parentElement).toBe(wrapper.find('.ui-table-container').element)
      expect(ring.element.previousElementSibling).toBe(wrapper.find('.ui-table-container__viewport').element)
    })
  })

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)('applies the %s step to the frame', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.find('.ui-table-container').classes()).toContain(`ui-table-container--density-${density}`)
    })
  })

  describe('caption', () => {
    it('renders a visible caption from the prop or the slot', async () => {
      const withProp = await mount({ caption: 'Orders' })
      expect(withProp.find('table > caption.ui-table__caption').text()).toBe('Orders')

      const withSlot = await mount({}, { slots: { caption: () => h('strong', 'Recent orders') } })
      expect(withSlot.find('caption strong').text()).toBe('Recent orders')
    })

    it('renders no caption without one', async () => {
      const wrapper = await mount()

      expect(wrapper.find('caption').exists()).toBe(false)
    })

    // T-1 (M3-polish): the refresh indicator steps below a caption.
    it('marks a captioned frame, so the refresh indicator clears the caption', async () => {
      const captioned = await mount({ caption: 'Orders' })
      expect(captioned.find('.ui-table-container').classes()).toContain('ui-table-container--captioned')

      const bare = await mount()
      expect(bare.find('.ui-table-container').classes()).not.toContain('ui-table-container--captioned')
    })
  })

  describe('interactive rows', () => {
    // Q-6 (M3-polish): a hover layer only where a row does something.
    it('makes rows interactive only when they are selectable or have a row-click listener', async () => {
      expect((await mount()).find('table').classes()).not.toContain('ui-table--interactive')
      expect((await mount({ selectable: true })).find('table').classes()).toContain('ui-table--interactive')
      expect((await mount({ onRowClick: () => {} })).find('table').classes()).toContain('ui-table--interactive')
    })
  })

  describe('columns', () => {
    it.each(['start', 'center', 'end'] as const)('aligns a column to its %s, cells and header alike', async (align) => {
      const wrapper = await mount({ columns: [{ key: 'name', label: 'Name', align }] })

      expect(wrapper.find('tbody td').classes()).toContain(`ui-table__cell--${align}`)
      expect(wrapper.find('th').classes()).toContain(`ui-table__head-cell--${align}`)
    })

    it('starts a plain column at the start and a numeric one at the end', async () => {
      const wrapper = await mount()
      const [name, amount] = wrapper.findAll('tbody .ui-table__row')[0]!.findAll('td')

      expect(name!.classes()).toContain('ui-table__cell--start')
      expect(amount!.classes()).toEqual(expect.arrayContaining(['ui-table__cell--end', 'ui-table__cell--numeric']))
    })

    it('lets an explicit align win over numeric', async () => {
      const wrapper = await mount({ columns: [{ key: 'amount', label: 'Amount', numeric: true, align: 'center' }] })

      expect(wrapper.find('tbody td').classes()).toEqual(expect.arrayContaining(['ui-table__cell--center', 'ui-table__cell--numeric']))
    })

    it('formats values through the column formatter', async () => {
      const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 })
      const formatted = [columns[0]!, { ...columns[1]!, format: (value: unknown) => money.format(value as number) }]
      const wrapper = await mount({ columns: formatted })

      expect(wrapper.findAll('tbody .ui-table__row')[1]!.findAll('td')[1]!.text()).toBe('1,250.50')
    })

    it('puts the column width and minimum width on its header cell', async () => {
      const wrapper = await mount({ columns: [{ key: 'name', label: 'Name', width: '240rem', minWidth: '160rem' }] })
      const style = wrapper.find('th').attributes('style')

      expect(style).toContain('width: 240rem')
      expect(style).toContain('min-width: 160rem')
    })

    it('marks only sortable header cells', async () => {
      const wrapper = await mount({ columns: [columns[0]!, { key: 'amount', label: 'Amount' }] })
      const [sortable, plain] = wrapper.findAll('th')

      expect(sortable!.classes()).toContain('ui-table__head-cell--sortable')
      expect(plain!.classes()).not.toContain('ui-table__head-cell--sortable')
      expect(plain!.find('.ui-table__sort').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('passes row, column and value to a cell slot', async () => {
      const wrapper = await mount({}, {
        slots: { 'cell-name': ({ row, value }: { row: Row, value: string }) => h('b', `${row.id}:${value}`) },
      })

      expect(wrapper.findAll('tbody b').map(cell => cell.text())).toEqual(['1:Ann', '2:Bob', '3:Cid'])
    })

    it('passes the column to a header slot, inside the sort button of a sortable column', async () => {
      const wrapper = await mount({}, {
        slots: { 'header-name': ({ column }: { column: { label: string } }) => h('i', column.label.toUpperCase()) },
      })

      expect(wrapper.find('th .ui-table__sort i').text()).toBe('NAME')
    })
  })

  describe('sort icon', () => {
    it('keeps the icon of an unsorted column in place, only hidden', async () => {
      const wrapper = await mount({ sort: { key: 'name', direction: 'asc' } })
      const icons = wrapper.findAll('.ui-table__sort-icon')

      expect(icons).toHaveLength(2)
      expect(icons[0]!.classes()).not.toContain('ui-table__sort-icon--idle')
      expect(icons[1]!.classes()).toContain('ui-table__sort-icon--idle')
    })

    it('hides every icon while nothing is sorted', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-table__sort-icon').every(icon => icon.classes().includes('ui-table__sort-icon--idle'))).toBe(true)
    })
  })

  describe('selection', () => {
    it('renders a checkbox column only when selectable', async () => {
      expect((await mount()).find('.ui-table__cell--checkbox').exists()).toBe(false)

      const selectable = await mount({ selectable: true })
      expect(selectable.findAll('.ui-table__cell--checkbox')).toHaveLength(3)
      expect(selectable.find('.ui-table__head-cell--checkbox').exists()).toBe(true)
    })

    it('stands each row checkbox in its own box inside the cell', async () => {
      const wrapper = await mount({ selectable: true })

      for (const cell of wrapper.findAll('.ui-table__cell--checkbox')) {
        expect(cell.find('.ui-table__checkbox .ui-checkbox').exists()).toBe(true)
      }
    })

    it('paints the selected rows', async () => {
      const wrapper = await mount({ selectable: true, selectedRows: [rows[0]] })
      const [first, second] = wrapper.findAll('tbody .ui-table__row')

      expect(first!.classes()).toContain('ui-table__row--selected')
      expect(second!.classes()).not.toContain('ui-table__row--selected')
    })

    it('paints nothing without selectable, whatever selectedRows holds', async () => {
      const wrapper = await mount({ selectedRows: [rows[0]] })

      expect(wrapper.find('.ui-table__row--selected').exists()).toBe(false)
    })
  })

  describe('body messages', () => {
    it.each([
      ['loading', { data: [], loading: true }],
      ['empty', { data: [] }],
      ['error', { data: [], error: 'Failed' }],
    ] as const)('stands a %s message in for the rows', async (kind, props) => {
      const wrapper = await mount({ ...props })

      expect(wrapper.find(`.ui-table__message--${kind}`).exists()).toBe(true)
      expect(wrapper.find('tbody .ui-table__row').exists()).toBe(false)
    })

    it('spans every column with the message, the checkbox column included', async () => {
      const wrapper = await mount({ data: [], selectable: true }, { slots: { empty: () => h('p', 'No orders yet') } })
      const cell = wrapper.find('.ui-table__message-cell')

      expect(cell.attributes('colspan')).toBe('3')
      expect(cell.text()).toBe('No orders yet')
    })

    it('lets #loading replace the indicator', async () => {
      const wrapper = await mount({ data: [], loading: true }, { slots: { loading: () => h('i', { class: 'skeleton' }) } })

      expect(wrapper.find('.ui-table__message--loading .skeleton').exists()).toBe(true)
      expect(wrapper.find('.ui-loading').exists()).toBe(false)
    })

    it('draws an error string with its icon, and nothing for a bare error flag', async () => {
      const worded = await mount({ data: [], error: 'Could not load orders' })
      expect(worded.find('.ui-table__message--error').text()).toBe('Could not load orders')
      expect(worded.find('.ui-table__message-icon').exists()).toBe(true)

      const bare = await mount({ data: [], error: true })
      expect(bare.find('.ui-table__message--error').text()).toBe('')
      expect(bare.find('.ui-table__message-icon').exists()).toBe(false)
    })

    it('reports a failure after the rows that did load', async () => {
      const wrapper = await mount({ error: 'Page 3 failed' })

      expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
      expect(wrapper.findAll('tbody tr').at(-1)!.classes()).toContain('ui-table__message-row')
    })

    it('shows progress, not the stale error, while a retry loads', async () => {
      const wrapper = await mount({ data: [], error: 'Could not load', loading: true })

      expect(wrapper.find('.ui-table__message--loading').exists()).toBe(true)
      expect(wrapper.find('.ui-table__message--error').exists()).toBe(false)
    })

    it('keeps the rows while their replacement loads, under an overlay indicator', async () => {
      const wrapper = await mount({ loading: true })

      expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
      expect(wrapper.find('.ui-table__message-row').exists()).toBe(false)
      expect(wrapper.find('.ui-table-container__busy .ui-loading').exists()).toBe(true)
    })

    it('shows no overlay indicator while the rows themselves are loading', async () => {
      const wrapper = await mount({ data: [], loading: true })

      expect(wrapper.find('.ui-table-container__busy').exists()).toBe(false)
    })
  })

  describe('footer', () => {
    it('renders the footer only when pagination is on', async () => {
      expect((await mount()).find('.ui-table__pagination').exists()).toBe(false)
      expect((await mount({ pagination: true, totalItems: 20 })).find('.ui-table__pagination').exists()).toBe(true)
    })

    it('hands the page numbers to #pagination-info', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 42, pageSize: 10, currentPage: 2 }, {
        slots: { 'pagination-info': ({ start, end, total }: { start: number, end: number, total: number }) => h('span', `${start}–${end} of ${total}`) },
      })

      expect(wrapper.find('.ui-table__pagination-info').text()).toBe('11–20 of 42')
    })

    // T-2 (M3-polish): the chevrons carry the class that turns them in RTL.
    it('marks both chevrons as direction-dependent icons', async () => {
      const wrapper = await mount({ pagination: true, totalItems: 20, previousPageLabel: 'Previous page', nextPageLabel: 'Next page' })

      expect(wrapper.findAll('.ui-table__pagination-actions .ui-table__page-icon')).toHaveLength(2)
    })

    it('offers the page size selector only with options', async () => {
      expect((await mount({ pagination: true, totalItems: 42 })).find('select').exists()).toBe(false)
      expect((await mount({ pagination: true, totalItems: 42, pageSizeOptions: [10, 25] })).find('select').exists()).toBe(true)
    })
  })
})
