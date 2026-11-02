import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import type { PanelValue } from '#kit/components/ui/expansion-panel/props'
import MExpansionPanels from '../index.vue'

export type Model = PanelValue | PanelValue[] | undefined

export interface GroupState {
  multiple?: Ref<boolean>
  mandatory?: Ref<boolean>
  model?: Ref<Model>
  values?: Ref<string[]>
  disabled?: Ref<string[]>
}

/** A group of panels whose props and model live in refs the spec can drive. */
export function group(state: GroupState = {}) {
  const multiple = state.multiple ?? ref(false)
  const mandatory = state.mandatory ?? ref(false)
  const model = state.model ?? ref<Model>(undefined)
  const values = state.values ?? ref(['a', 'b', 'c'])
  const disabled = state.disabled ?? ref<string[]>([])

  return defineComponent({
    render: () => h(MExpansionPanels, {
      'multiple': multiple.value,
      'mandatory': mandatory.value,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: Model) => {
        model.value = value
      },
    }, () => values.value.map((value, index) =>
      h(MExpansionPanel, { key: index, value, title: value.toUpperCase(), disabled: disabled.value.includes(value) }, () => `${value} body`))),
  })
}

interface Findable {
  findAll: (selector: string) => { attributes: (name: string) => string | undefined }[]
}

/** Open state of every panel, read from the header buttons. */
export const expanded = (wrapper: Findable) =>
  wrapper.findAll('.ui-expansion-panel__header').map(header => header.attributes('aria-expanded') === 'true')
