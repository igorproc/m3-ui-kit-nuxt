import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MLayout from '../src/runtime/components/ui/layout/index.vue'
import MLayoutMain from '../src/runtime/components/ui/layout/main.vue'
import { useLayoutZone } from '../src/runtime/composables/useLayout'

const Probe = defineComponent({
  setup() {
    const zone = useLayoutZone()

    return () => h('div', {
      'data-testid': 'probe',
      'data-zone': zone ? 'yes' : 'no',
      'data-inset-top': zone?.insets.top ?? '',
      'data-sticky-top': zone?.sticky.top ?? '',
      'data-window-y': String(zone?.windowY.value ?? ''),
      'data-layout-id': zone?.layoutId ?? '',
    })
  },
})

describe('layout context zone', () => {
  it('provides the rich context to any descendant of m-layout', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => h(MLayoutMain, () => h(Probe))),
    }))

    const probe = wrapper.find('[data-testid="probe"]')
    expect(probe.attributes('data-zone')).toBe('yes')
    expect(probe.attributes('data-inset-top')).toBe('var(--m3-layout-inset-top, 0px)')
    expect(probe.attributes('data-sticky-top')).toBe('var(--m3-layout-inset-top, 0px)')
    expect(probe.attributes('data-window-y')).toBe('0')
    expect(probe.attributes('data-layout-id')).toMatch(/^m-layout-/)
  })

  it('degrades to null outside a layout', async () => {
    const wrapper = await mountSuspended(Probe)

    expect(wrapper.attributes('data-zone')).toBe('no')
  })
})
