import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import MExtendedFab from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Compose', prepend: () => 'I' }, attrs?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MExtendedFab, { props, slots, attrs })

  return current as VueWrapper
}

function endTransition(wrapper: VueWrapper, propertyName: string) {
  const label = wrapper.find('.ui-extended-fab__label').element
  label.dispatchEvent(Object.assign(new Event('transitionend'), { propertyName }))
  return nextTick()
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-button-extended-fab · interaction', () => {
  it('reaches the consumer\'s click handler', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({}, undefined, { onClick })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('swallows the click of a loading button before any handler', async () => {
    const onClick = vi.fn()
    const wrapper = await mount({ loading: true }, undefined, { onClick })

    await wrapper.trigger('click')

    expect(onClick).not.toHaveBeenCalled()
  })

  describe('fold', () => {
    it('closes the one-line window when the label\'s fade ends', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ expanded: false })
      await endTransition(wrapper, 'opacity')

      expect(wrapper.find('.ui-extended-fab__label').classes()).not.toContain('ui-extended-fab__label--folding')
    })

    it('keeps the window open through the end of the width transition', async () => {
      const wrapper = await mount()

      await wrapper.setProps({ expanded: false })
      await endTransition(wrapper, 'inline-size')

      expect(wrapper.find('.ui-extended-fab__label').classes()).toContain('ui-extended-fab__label--folding')
    })

    it('opens the window again when it unfolds', async () => {
      const wrapper = await mount({ expanded: false })

      await wrapper.setProps({ expanded: true })

      expect(wrapper.find('.ui-extended-fab__label').classes()).toContain('ui-extended-fab__label--folding')
      expect(wrapper.classes()).not.toContain('ui-extended-fab--collapsed')
    })
  })

  // The "fold needs a #prepend icon" warning is guarded by `import.meta.dev`,
  // which Vitest resolves to `false`.
})
