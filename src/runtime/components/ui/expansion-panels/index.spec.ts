import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import MExpansionPanels from './index.vue'

// Regression coverage for the grouped "initial v-model" bug: a preset value on
// the group must select/open the matching child at mount (the child registers
// after the group's setup, so the model->selection apply must re-run reactively).

describe('grouped initial v-model', () => {
  it('MExpansionPanels opens the panel matching a preset model at mount', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MExpansionPanels, { modelValue: 'b' }, () => [
        h(MExpansionPanel, { value: 'a', title: 'A' }, () => 'A body'),
        h(MExpansionPanel, { value: 'b', title: 'B' }, () => 'B body'),
      ]),
    }))

    const headers = wrapper.findAll('[aria-expanded]')
    expect(headers.length).toBeGreaterThanOrEqual(2)
    expect(headers[0]!.attributes('aria-expanded')).toBe('false')
    expect(headers[1]!.attributes('aria-expanded')).toBe('true')
  })
})
