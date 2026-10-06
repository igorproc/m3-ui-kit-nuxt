import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MRadio from '#kit/components/ui/radio/index.vue'
import MRadioGroup from './index.vue'

// Regression coverage for the grouped "initial v-model" bug: a preset value on
// the group must select/open the matching child at mount (the child registers
// after the group's setup, so the model->selection apply must re-run reactively).

describe('grouped initial v-model', () => {
  it('MRadioGroup selects the radio matching a preset model at mount', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MRadioGroup, { modelValue: 'b' }, () => [
        h(MRadio, { value: 'a', label: 'A' }),
        h(MRadio, { value: 'b', label: 'B' }),
      ]),
    }))

    const inputs = wrapper.findAll('input.ui-radio__input')
    expect(inputs).toHaveLength(2)
    expect((inputs[0]!.element as HTMLInputElement).checked).toBe(false)
    expect((inputs[1]!.element as HTMLInputElement).checked).toBe(true)
  })
})
