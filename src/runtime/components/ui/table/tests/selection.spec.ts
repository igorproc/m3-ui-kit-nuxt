import { describe, expect, it } from 'vitest'
import { mountTable, rows } from './helpers'

describe('MTable — selection', () => {
  it('renders a checkbox column only when selectable', async () => {
    expect((await mountTable()).find('.ui-table__cell--checkbox').exists()).toBe(false)
    expect((await mountTable({ selectable: true })).find('.ui-table__cell--checkbox').exists()).toBe(true)
  })

  it('names each row checkbox by its row and the select-all checkbox by its label', async () => {
    const wrapper = await mountTable({ selectable: true, selectAllLabel: 'Select all orders' })
    const firstRow = wrapper.findAll('tbody .ui-table__row')[0]!
    const nameCell = firstRow.findAll('td')[1]!

    expect(firstRow.find('input').attributes('aria-labelledby')).toBe(nameCell.attributes('id'))
    expect(nameCell.text()).toBe('Ann')
    expect(wrapper.find('thead input').attributes('aria-label')).toBe('Select all orders')
  })

  it('toggles a row and emits the next selection', async () => {
    const wrapper = await mountTable({ selectable: true })
    await wrapper.findAll('tbody input')[1]!.setValue(true)

    expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[rows[1]]])
  })

  it('marks selected rows for assistive technology and paints them', async () => {
    const wrapper = await mountTable({ selectable: true, selectedRows: [rows[0]] })
    const [first, second] = wrapper.findAll('tbody .ui-table__row')

    expect(first!.attributes('aria-selected')).toBe('true')
    expect(first!.classes()).toContain('ui-table__row--selected')
    expect(second!.attributes('aria-selected')).toBe('false')
  })

  it('leaves aria-selected off a table without selection', async () => {
    const wrapper = await mountTable()
    expect(wrapper.find('tbody .ui-table__row').attributes('aria-selected')).toBeUndefined()
  })

  it('keeps rows of other pages selected and renders only the current page', async () => {
    const offPage = { id: 9, name: 'Zed', amount: 1 }
    const wrapper = await mountTable({ selectable: true, selectedRows: [offPage, rows[0]] })

    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('Zed')

    await wrapper.findAll('tbody input')[1]!.setValue(true)
    expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage, rows[0], rows[1]]])
  })

  it('does not drop the selection when the page changes, and shows it again on return', async () => {
    const wrapper = await mountTable({ selectable: true, selectedRows: [rows[0]] })

    await wrapper.setProps({ data: [{ id: 7, name: 'Page two', amount: 2 }] })
    expect(wrapper.emitted('update:selectedRows')).toBeUndefined()
    expect(wrapper.find('tbody .ui-table__row').attributes('aria-selected')).toBe('false')

    await wrapper.setProps({ data: rows })
    expect(wrapper.find('tbody .ui-table__row').attributes('aria-selected')).toBe('true')
  })

  it('checks select-all only when every row of the page is selected', async () => {
    const wrapper = await mountTable({ selectable: true, selectedRows: [{ id: 9, name: 'Zed', amount: 1 }, rows[0]] })
    const selectAll = () => wrapper.find('thead input').element as HTMLInputElement

    expect(selectAll().checked).toBe(false)

    await wrapper.setProps({ selectedRows: [...rows] })
    expect(selectAll().checked).toBe(true)
  })

  it('selects the rest of the page, then clears the page, leaving other pages alone', async () => {
    const offPage = { id: 9, name: 'Zed', amount: 1 }
    const wrapper = await mountTable({ 'selectable': true, 'selectedRows': [offPage, rows[0]], 'onUpdate:selectedRows': (next: unknown) => wrapper.setProps({ selectedRows: next }) })
    const selectAll = () => wrapper.find('thead input')

    await selectAll().setValue(true)
    expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage, ...rows]])

    await selectAll().setValue(false)
    expect(wrapper.emitted('update:selectedRows')!.at(-1)).toEqual([[offPage]])
  })

  it('keeps the selection without a bound v-model', async () => {
    const wrapper = await mountTable({ selectable: true })
    await wrapper.findAll('tbody input')[0]!.setValue(true)

    expect(wrapper.find('tbody .ui-table__row').attributes('aria-selected')).toBe('true')
  })

  it('emits row-click for a click on the row, not on its checkbox', async () => {
    const wrapper = await mountTable({ selectable: true })
    const row = wrapper.findAll('tbody .ui-table__row')[2]!

    await row.findAll('td')[1]!.trigger('click')
    expect(wrapper.emitted('row-click')).toHaveLength(1)
    expect(wrapper.emitted('row-click')![0]![0]).toEqual(rows[2])

    await row.find('input').trigger('click')
    expect(wrapper.emitted('row-click')).toHaveLength(1)
  })
})
