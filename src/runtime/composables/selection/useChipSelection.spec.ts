import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useChipSelection } from './useChipSelection'

interface Entry { value: number, item: string, disabled?: boolean }

const data: Entry[] = [
  { value: 1, item: 'Alpha' },
  { value: 2, item: 'Beta', disabled: true },
  { value: 3, item: 'Gamma' },
]

type Flags = { multiple: boolean, mandatory: boolean, disabled: boolean, readonly: boolean }

async function setup(overrides: Partial<Flags> = {}) {
  const flags: Flags = { multiple: true, mandatory: false, disabled: false, readonly: false, ...overrides }
  const model = ref<number | number[] | undefined>(flags.multiple ? [] : undefined)
  const draft = ref('')
  const entries = ref<Entry[]>(data)
  const onSelect = vi.fn()
  const onRemove = vi.fn()

  let api!: ReturnType<typeof useChipSelection<number, Entry>>
  await mountSuspended(defineComponent({
    setup() {
      api = useChipSelection<number, Entry>({
        model,
        entries,
        draft,
        namespace: 'test',
        multiple: () => flags.multiple,
        mandatory: () => flags.mandatory,
        disabled: () => flags.disabled,
        readonly: () => flags.readonly,
        createFallbackEntry: value => ({ value, item: `#${value}` }),
        onSelect,
        onRemove,
      })
      return () => h('div')
    },
  }))

  const press = (key: string) => api.handleChipKeydown({ key, preventDefault: () => {} } as KeyboardEvent)
  return { api, model, draft, entries, onSelect, onRemove, press }
}

describe('useChipSelection · model', () => {
  it('derives selected values per mode', async () => {
    const multiple = await setup()
    multiple.model.value = [1, 3]
    await nextTick()
    expect(multiple.api.selectedValues.value).toEqual([1, 3])

    const single = await setup({ multiple: false })
    single.model.value = 2
    await nextTick()
    expect(single.api.selectedValues.value).toEqual([2])
  })

  it('reports membership through isSelected', async () => {
    const { api, model } = await setup()
    model.value = [1]
    await nextTick()
    expect(api.isSelected(1)).toBe(true)
    expect(api.isSelected(3)).toBe(false)
  })

  it('resolves selected entries and falls back for unknown values', async () => {
    const { api, model } = await setup()
    model.value = [1, 99]
    await nextTick()
    const entries = api.selectedEntries.value
    expect(entries[0]!.item).toBe('Alpha')
    expect(entries[1]!.item).toBe('#99')
  })

  it('toggles values with select and reports through callbacks', async () => {
    const { api, model, onSelect, onRemove } = await setup()

    api.select(data[0])
    expect(model.value).toEqual([1])
    expect(onSelect).toHaveBeenCalledTimes(1)

    api.select(data[0])
    expect(model.value).toEqual([])
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('ignores disabled entries and respects the mandatory floor', async () => {
    const disabledEntry = await setup()
    disabledEntry.api.select(data[1])
    expect(disabledEntry.model.value).toEqual([])

    const mandatory = await setup({ mandatory: true })
    mandatory.model.value = [1]
    await nextTick()
    mandatory.api.remove(data[0])
    expect(mandatory.model.value).toEqual([1])
  })

  it('does nothing when disabled or readonly', async () => {
    const disabled = await setup({ disabled: true })
    disabled.api.select(data[0])
    expect(disabled.model.value).toEqual([])

    const readonly = await setup({ readonly: true })
    readonly.model.value = [1]
    await nextTick()
    readonly.api.remove(data[0])
    expect(readonly.model.value).toEqual([1])
  })
})

describe('useChipSelection · chip navigation', () => {
  it('enters and walks the chips with arrows', async () => {
    const { api, model, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    expect(press('ArrowLeft')).toBe(true)
    expect(api.chipFocus.value).toBe(1)

    press('ArrowLeft')
    expect(api.chipFocus.value).toBe(0)

    press('ArrowRight')
    expect(api.chipFocus.value).toBe(1)

    // ArrowRight past the last chip returns to the input.
    press('ArrowRight')
    expect(api.chipFocus.value).toBeNull()
  })

  it('deletes the focused chip and keeps focus on a neighbour', async () => {
    const { api, model, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    press('ArrowLeft') // focus last (index 1)
    press('ArrowLeft') // focus first (index 0)
    expect(press('Backspace')).toBe(true)
    expect(model.value).toEqual([3])
    expect(api.chipFocus.value).toBe(0)
  })

  it('deletes the last chip on plain Backspace without trapping focus', async () => {
    const { api, model, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    press('Backspace')
    expect(model.value).toEqual([1])
    expect(api.chipFocus.value).toBeNull()
  })

  it('returns the caret to the input on a non-navigation key', async () => {
    const { api, model, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    press('ArrowLeft')
    expect(api.chipFocus.value).toBe(1)
    expect(press('a')).toBe(false)
    expect(api.chipFocus.value).toBeNull()
  })

  it('is inert while the draft is non-empty or not multiple', async () => {
    const typing = await setup()
    typing.model.value = [1, 3]
    typing.draft.value = 'x'
    await nextTick()
    expect(typing.press('ArrowLeft')).toBe(false)
    expect(typing.api.chipFocus.value).toBeNull()

    const single = await setup({ multiple: false })
    single.model.value = 1
    await nextTick()
    expect(single.press('ArrowLeft')).toBe(false)
  })

  it('clamps focus when the selection shrinks from outside (e.g. chip click)', async () => {
    const { api, model, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    press('ArrowLeft') // focus last (index 1)
    expect(api.chipFocus.value).toBe(1)

    // A chip removed elsewhere (click) shrinks the model; focus must not dangle.
    model.value = [1]
    await nextTick()
    expect(api.chipFocus.value).toBe(0)

    model.value = []
    await nextTick()
    expect(api.chipFocus.value).toBeNull()
  })

  it('drops chip focus once the user starts typing', async () => {
    const { api, model, draft, press } = await setup()
    model.value = [1, 3]
    await nextTick()

    press('ArrowLeft')
    expect(api.chipFocus.value).toBe(1)

    draft.value = 'a'
    await nextTick()
    expect(api.chipFocus.value).toBeNull()
  })
})
