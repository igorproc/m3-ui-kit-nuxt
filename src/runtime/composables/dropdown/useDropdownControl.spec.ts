/**
 * The escape-hatch contract: delete the component tag, keep the composable and
 * `v-bind`, and the behaviour survives. That is only true if the bags carry no
 * presentation — so this spec mounts them onto anonymous markup with no kit
 * class anywhere and asserts nothing decorative comes out.
 */
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref } from 'vue'
import { useDropdownControl } from './useDropdownControl'
import type { DropdownControlConfig } from './types'
import { compareByIdentity } from './useDropdownSelection'

interface Row { id: number, label: string, disabled?: boolean }

const rows: Row[] = [
  { id: 1, label: 'One' },
  { id: 2, label: 'Two', disabled: true },
  { id: 3, label: 'Three' },
]

function config(overrides: Partial<DropdownControlConfig> = {}): DropdownControlConfig {
  return {
    items: rows,
    itemTitle: 'label',
    itemValue: 'id',
    itemDisabled: 'disabled',
    valueComparator: undefined,
    multiple: false,
    mandatory: false,
    max: undefined,
    clearable: false,
    disabled: false,
    readonly: false,
    loading: false,
    maxHeight: undefined,
    ...overrides,
  }
}

/** Anonymous markup: an unnamed input and unnamed rows, no kit classes. */
function harness(props: DropdownControlConfig, model: unknown = undefined) {
  const modelRef = ref(model)
  const openRef = ref(false)
  let control!: ReturnType<typeof useDropdownControl<Row, number>>

  const Host = defineComponent({
    setup() {
      control = useDropdownControl<Row, number>({ props, model: modelRef as never, open: openRef })
      return () => h('div', [
        h('input', control.inputAttrs.value),
        h('ul', control.listboxAttrs.value, control.entries.value.map(entry =>
          h('li', control.getOptionAttrs(entry), entry.title))),
      ])
    },
  })

  return {
    Host,
    modelRef,
    openRef,
    get control() {
      return control
    },
  }
}

describe('useDropdownControl · escape hatch', () => {
  it('emits no class and no data-* attribute on any bag', async () => {
    const { Host, openRef } = harness(config())
    const wrapper = await mountSuspended(Host)
    openRef.value = true
    await wrapper.vm.$nextTick()

    for (const element of wrapper.findAll('input, ul, li')) {
      expect(element.attributes('class')).toBeUndefined()
      for (const name of element.element.getAttributeNames()) {
        expect(name.startsWith('data-')).toBe(false)
      }
    }
  })

  it('wires the combobox to its listbox and rows without any markup of its own', async () => {
    const { Host, openRef } = harness(config())
    const wrapper = await mountSuspended(Host)
    openRef.value = true
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    const listbox = wrapper.find('ul')
    expect(input.attributes('aria-controls')).toBe(listbox.attributes('id'))
    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.findAll('li')[1]!.attributes('aria-disabled')).toBe('true')
  })

  it('drives selection from the plain markup', async () => {
    const { Host, modelRef, openRef } = harness(config())
    const wrapper = await mountSuspended(Host)
    openRef.value = true
    await wrapper.vm.$nextTick()

    await wrapper.findAll('li')[2]!.trigger('click')
    expect(modelRef.value).toBe(3)
    expect(openRef.value).toBe(false)
  })

  it('refuses a disabled row from the same markup', async () => {
    const { Host, modelRef, openRef } = harness(config())
    const wrapper = await mountSuspended(Host)
    openRef.value = true
    await wrapper.vm.$nextTick()

    await wrapper.findAll('li')[1]!.trigger('click')
    expect(modelRef.value).toBeUndefined()
  })
})

describe('compareByIdentity', () => {
  it('compares two objects by their declared id', () => {
    expect(compareByIdentity({ id: 1, label: 'a' }, { id: 1, label: 'b' })).toBe(true)
    expect(compareByIdentity({ id: 1 }, { id: 2 })).toBe(false)
  })

  it('falls back to value equality for anything without an id', () => {
    expect(compareByIdentity(3, 3)).toBe(true)
    expect(compareByIdentity('a', 'b')).toBe(false)
    expect(compareByIdentity({ name: 'x' }, { name: 'x' })).toBe(false)
  })
})
