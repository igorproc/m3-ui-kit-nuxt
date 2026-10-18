import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountTable, rows } from './helpers'

describe('MTable — data states', () => {
  it('fills an empty body with the #empty slot across every column', async () => {
    const wrapper = await mountTable({ data: [], selectable: true }, { slots: { empty: () => h('p', 'No orders yet') } })
    const cell = wrapper.find('.ui-table__message-cell')

    expect(cell.attributes('colspan')).toBe('3')
    expect(cell.text()).toBe('No orders yet')
    expect(wrapper.find('.ui-table__message--empty').exists()).toBe(true)
  })

  it('stands a wordless indicator in for rows that are loading and marks the table busy', async () => {
    const wrapper = await mountTable({ data: [], loading: true })

    expect(wrapper.find('table').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.ui-table__message--loading .ui-loading').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ui-table-container__busy').exists()).toBe(false)
  })

  it('lets #loading replace the indicator', async () => {
    const wrapper = await mountTable({ data: [], loading: true }, { slots: { loading: () => h('i', { class: 'skeleton' }) } })

    expect(wrapper.find('.ui-table__message--loading .skeleton').exists()).toBe(true)
    expect(wrapper.find('.ui-loading').exists()).toBe(false)
  })

  it('keeps the rows while their replacement loads', async () => {
    const wrapper = await mountTable({ loading: true })

    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
    expect(wrapper.find('.ui-table__message-row').exists()).toBe(false)
    expect(wrapper.find('.ui-table-container__busy .ui-loading').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('table').attributes('aria-busy')).toBe('true')
  })

  it('drops aria-busy once loading ends', async () => {
    const wrapper = await mountTable({ loading: false })
    expect(wrapper.find('table').attributes('aria-busy')).toBeUndefined()
  })

  it('shows and announces an error message given as a string', async () => {
    const wrapper = await mountTable({ data: [], error: 'Could not load orders' })

    expect(wrapper.find('.ui-table__message--error').text()).toBe('Could not load orders')
    expect(wrapper.find('.ui-table-container__status').text()).toBe('Could not load orders')
  })

  it('reports a failure after the rows that did load', async () => {
    const wrapper = await mountTable({ error: 'Page 3 failed' })

    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
    expect(wrapper.find('tbody > tr:last-child').classes()).toContain('ui-table__message-row')
  })

  it('hands the error and a retry to the #error slot', async () => {
    const wrapper = await mountTable({ data: [], error: true }, {
      slots: { error: ({ retry }: { retry: () => void }) => h('button', { class: 'retry', onClick: retry }, 'Retry') },
    })

    await wrapper.find('.retry').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('shows progress, not the stale error, while a retry loads', async () => {
    const wrapper = await mountTable({ data: [], error: 'Could not load', loading: true })

    expect(wrapper.find('.ui-table__message--loading').exists()).toBe(true)
    expect(wrapper.find('.ui-table__message--error').exists()).toBe(false)
  })

  it('keeps one status region mounted and changes only its text', async () => {
    const wrapper = await mountTable({ statusText: '' })
    const region = wrapper.find('.ui-table-container__status')

    expect(region.attributes('role')).toBe('status')
    expect(region.text()).toBe('')

    await wrapper.setProps({ statusText: 'Sorted by amount, descending' })
    expect(wrapper.find('.ui-table-container__status').element).toBe(region.element)
    expect(region.text()).toBe('Sorted by amount, descending')
  })

  it('renders the rows again when the data arrives', async () => {
    const wrapper = await mountTable({ data: [], loading: true })
    await wrapper.setProps({ data: rows, loading: false })

    expect(wrapper.findAll('tbody .ui-table__row')).toHaveLength(3)
    expect(wrapper.find('.ui-table__message-row').exists()).toBe(false)
  })
})
