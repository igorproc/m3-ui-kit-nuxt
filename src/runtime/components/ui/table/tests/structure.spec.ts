import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { columns, mountTable, rows } from './helpers'
import type { Row } from './helpers'

describe('MTable — structure', () => {
  it('renders a table with a row per data entry', async () => {
    const wrapper = await mountTable()

    expect(wrapper.find('table.ui-table').exists()).toBe(true)
    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
  })

  it('renders column headers with scope="col"', async () => {
    const wrapper = await mountTable()
    const headers = wrapper.findAll('th[scope="col"]')

    expect(headers).toHaveLength(2)
    expect(headers[0]!.text()).toContain('Name')
  })

  it('puts class and style on the frame and every other attribute on the table', async () => {
    const wrapper = await mountTable({}, { attrs: { 'class': 'mine', 'style': 'margin: 0', 'aria-label': 'Orders', 'aria-describedby': 'hint' } })
    const root = wrapper.find('.ui-table-container')
    const table = wrapper.find('table')

    expect(root.classes()).toContain('mine')
    expect(root.attributes('style')).toContain('margin')
    expect(root.attributes('aria-label')).toBeUndefined()
    expect(table.attributes('aria-label')).toBe('Orders')
    expect(table.attributes('aria-describedby')).toBe('hint')
  })

  it('names the table with a visible caption from the prop or the slot', async () => {
    const withProp = await mountTable({ caption: 'Orders' })
    expect(withProp.find('table > caption').text()).toBe('Orders')

    const withSlot = await mountTable({}, { slots: { caption: () => h('strong', 'Recent orders') } })
    expect(withSlot.find('caption strong').text()).toBe('Recent orders')
  })

  it('applies the density step to the frame', async () => {
    const wrapper = await mountTable({ density: 'compact' })
    expect(wrapper.find('.ui-table-container').classes()).toContain('ui-table-container--density-compact')
  })

  it('lines up numeric columns at the end with tabular digits and formats values', async () => {
    const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 })
    const formatted = [columns[0]!, { ...columns[1]!, format: (value: unknown) => money.format(value as number) }]
    const wrapper = await mountTable({ columns: formatted })
    const amount = wrapper.findAll('tbody .ui-table__row')[1]!.findAll('td')[1]!

    expect(amount.classes()).toEqual(expect.arrayContaining(['ui-table__cell--end', 'ui-table__cell--numeric']))
    expect(amount.text()).toBe('1,250.50')
    expect(wrapper.findAll('th')[1]!.classes()).toContain('ui-table__head-cell--end')
  })

  it('lets a column set its own alignment and minimum width', async () => {
    const wrapper = await mountTable({ columns: [{ key: 'name', label: 'Name', align: 'center', minWidth: '160rem' }] })

    expect(wrapper.find('tbody td').classes()).toContain('ui-table__cell--center')
    expect(wrapper.find('th').attributes('style')).toContain('min-width: 160rem')
  })

  it('passes row, column and value to a cell slot', async () => {
    const wrapper = await mountTable({}, {
      slots: { 'cell-name': ({ row, value }: { row: Row, value: string }) => h('b', `${row.id}:${value}`) },
    })

    expect(wrapper.find('tbody b').text()).toBe('1:Ann')
  })
})

describe('MTable — sorting', () => {
  it('renders a sort button only for sortable columns, as wide as the header cell', async () => {
    const wrapper = await mountTable({ columns: [columns[0]!, { key: 'amount', label: 'Amount' }] })
    const buttons = wrapper.findAll('.ui-table__sort')

    expect(buttons).toHaveLength(1)
    expect(buttons[0]!.element.tagName).toBe('BUTTON')
    expect(buttons[0]!.attributes('type')).toBe('button')
  })

  it('keeps the sort icon of an unsorted column in place, only hidden', async () => {
    const wrapper = await mountTable({ sort: { key: 'name', direction: 'asc' } })
    const icons = wrapper.findAll('.ui-table__sort-icon')

    expect(icons).toHaveLength(2)
    expect(icons[0]!.classes()).not.toContain('ui-table__sort-icon--idle')
    expect(icons[1]!.classes()).toContain('ui-table__sort-icon--idle')
  })

  it('cycles ascending → descending → none and keeps aria-sort in step', async () => {
    const wrapper = await mountTable({ 'sort': null, 'onUpdate:sort': (value: unknown) => wrapper.setProps({ sort: value }) })
    const header = () => wrapper.findAll('th')[0]!
    const press = () => header().find('button').trigger('click')

    expect(header().attributes('aria-sort')).toBe('none')

    await press()
    expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([{ key: 'name', direction: 'asc' }])
    expect(header().attributes('aria-sort')).toBe('ascending')

    await press()
    expect(header().attributes('aria-sort')).toBe('descending')

    await press()
    expect(wrapper.emitted('update:sort')!.at(-1)).toEqual([null])
    expect(header().attributes('aria-sort')).toBe('none')
  })
})
