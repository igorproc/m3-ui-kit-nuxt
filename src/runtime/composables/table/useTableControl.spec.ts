import { describe, expect, it } from 'vitest'
import { defineComponent, h, useTemplateRef } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useTableControl } from './useTableControl'

interface Row { id: number, name: string, [key: string]: unknown }

const data: Row[] = [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bob' }]

// The escape hatch: the bags alone, spread on anonymous markup, carry the
// table's wiring — and no presentation (no class, no data-*).
function mountBare(options: { busy?: boolean, selected?: number[], clicks?: Row[] } = {}) {
  return mountSuspended(defineComponent({
    setup() {
      const viewport = useTemplateRef<HTMLElement>('viewport')
      const table = useTemplateRef<HTMLElement>('table')
      const control = useTableControl<Row>({
        viewport,
        table,
        selectable: () => true,
        isSelected: row => options.selected?.includes(row.id) ?? false,
        busy: () => options.busy ?? false,
        hasCaption: () => true,
        label: () => undefined,
        onRowClick: row => options.clicks?.push(row),
      })

      return () => h('div', [
        h('div', { ref: 'viewport', ...control.viewportAttrs.value }, [
          h('table', { ref: 'table', ...control.tableAttrs.value }, [
            h('tbody', data.map((row, index) => h('tr', { key: row.id, ...control.getRowAttrs(row) }, [
              h('td', [h('input', { type: 'checkbox', ...control.getRowCheckboxAttrs(index) })]),
              h('td', { id: control.getRowNameId(index) }, row.name),
            ]))),
          ]),
        ]),
        h('i', control.statusAttrs, 'status'),
      ])
    },
  }))
}

const presentationKeys = (attributes: Record<string, string>) =>
  Object.keys(attributes).filter(key => key === 'class' || key.startsWith('data-'))

describe('useTableControl', () => {
  it('wires each row checkbox to its row name, without presentation', async () => {
    const wrapper = await mountBare({ selected: [2] })
    const [first, second] = wrapper.findAll('tr')

    expect(first!.find('input').attributes('aria-labelledby')).toBe(first!.findAll('td')[1]!.attributes('id'))
    expect(first!.attributes('aria-selected')).toBe('false')
    expect(second!.attributes('aria-selected')).toBe('true')

    for (const element of wrapper.findAll('div, table, tr, input, i')) {
      expect(presentationKeys(element.attributes())).toEqual([])
    }
  })

  it('marks the table busy and keeps the status region polite', async () => {
    const wrapper = await mountBare({ busy: true })

    expect(wrapper.find('table').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('i').attributes('role')).toBe('status')
  })

  it('leaves a viewport that does not scroll out of the tab order', async () => {
    const wrapper = await mountBare()
    const viewport = wrapper.find('table').element.parentElement!

    expect(viewport.getAttribute('tabindex')).toBeNull()
    expect(viewport.getAttribute('role')).toBeNull()
  })

  it('reports clicks on the row but not on its controls', async () => {
    const clicks: Row[] = []
    const wrapper = await mountBare({ clicks })

    await wrapper.findAll('tr')[1]!.findAll('td')[1]!.trigger('click')
    await wrapper.findAll('tr')[1]!.find('input').trigger('click')

    expect(clicks).toEqual([data[1]])
  })
})
