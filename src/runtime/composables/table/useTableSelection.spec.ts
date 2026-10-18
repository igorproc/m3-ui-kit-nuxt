import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import { useTableSelection } from './useTableSelection'

interface Row { id: number, [key: string]: unknown }

const page1: Row[] = [{ id: 1 }, { id: 2 }, { id: 3 }]
const page2: Row[] = [{ id: 4 }, { id: 5 }]

function setup(selected: Row[] = []) {
  const data = shallowRef(page1)
  const model = shallowRef(selected)
  const emitted: Row[][] = []
  const scope = effectScope()
  const selection = scope.run(() => useTableSelection<Row>({
    data,
    selectedRows: model,
    onChange: (rows) => {
      emitted.push(rows)
      model.value = rows
    },
  }))!

  return { data, model, emitted, selection }
}

describe('useTableSelection', () => {
  it('reports the page as mixed only for a partial selection of that page', async () => {
    const { data, selection } = setup([{ id: 2 }, { id: 4 }])

    expect(selection.isMixed.value).toBe(true)
    expect(selection.isAllSelected.value).toBe(false)

    data.value = [{ id: 4 }]
    await nextTick()
    expect(selection.isMixed.value).toBe(false)
    expect(selection.isAllSelected.value).toBe(true)
  })

  it('an empty page is neither all selected nor mixed', () => {
    const { data, selection } = setup([{ id: 1 }])
    data.value = []

    expect(selection.isAllSelected.value).toBe(false)
    expect(selection.isMixed.value).toBe(false)
  })

  it('keeps off-page rows through a page change and through select-all', async () => {
    const { data, model, emitted, selection } = setup([page1[0]!])

    data.value = page2
    await nextTick()
    expect(emitted).toEqual([])

    selection.toggleAll()
    expect(model.value.map(row => row.id)).toEqual([1, 4, 5])

    selection.toggleAll()
    expect(model.value.map(row => row.id)).toEqual([1])
  })

  it('toggles one row in and out by id', () => {
    const { model, selection } = setup([{ id: 9 }])

    selection.toggleRow(page1[1]!)
    expect(model.value.map(row => row.id)).toEqual([9, 2])
    expect(selection.isSelected({ id: 2 })).toBe(true)

    selection.toggleRow({ id: 2 })
    expect(model.value.map(row => row.id)).toEqual([9])
  })

  it('follows a model replaced from outside', async () => {
    const { model, selection } = setup()

    model.value = [{ id: 3 }]
    await nextTick()
    expect(selection.isSelected(page1[2]!)).toBe(true)
  })
})
