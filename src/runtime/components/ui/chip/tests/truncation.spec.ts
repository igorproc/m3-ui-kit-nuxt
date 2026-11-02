import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MChip from '../index.vue'
import { mount, unmountCurrent } from './helpers'

afterEach(() => {
  unmountCurrent()
  document.querySelectorAll('.ui-tooltip__content').forEach(node => node.remove())
})

/** happy-dom lays nothing out: give the label the widths a cut-off text has. */
function cutLabel(wrapper: Awaited<ReturnType<typeof mount>>, truncated: boolean) {
  const label = wrapper.find('.ui-chip__label').element as HTMLElement
  Object.defineProperty(label, 'clientWidth', { configurable: true, get: () => 100 })
  Object.defineProperty(label, 'scrollWidth', { configurable: true, get: () => (truncated ? 180 : 100) })
}

const settle = async () => {
  for (let index = 0; index < 4; index++) await nextTick()
}

const surface = () => document.querySelector<HTMLElement>('.ui-tooltip__content')
const isShown = () => Boolean(surface()) && surface()!.style.display !== 'none'

describe('m-chip · truncated label (W19-А)', () => {
  it('renders no tooltip in the server frame — the look never depends on a measure', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(MChip, null, () => 'Electronics and gadgets') }))

    expect(html).not.toContain('ui-tooltip')
  })

  it('shows the full label in a tooltip when a pointer finds it cut off', async () => {
    const wrapper = await mount({}, { default: () => 'Electronics and gadgets' }, true)
    cutLabel(wrapper, true)

    await wrapper.trigger('pointerenter')
    await settle()

    expect(isShown()).toBe(true)
    expect(surface()!.textContent?.trim()).toBe('Electronics and gadgets')
  })

  it('keeps the chip markup and stays silent while the label fits', async () => {
    const wrapper = await mount({}, { default: () => 'Home' }, true)
    cutLabel(wrapper, false)

    await wrapper.trigger('pointerenter')
    await settle()

    expect(wrapper.find('.ui-tooltip').exists()).toBe(false)
    expect(isShown()).toBe(false)
  })

  it('hides the tooltip when the pointer leaves', async () => {
    const wrapper = await mount({}, { default: () => 'Electronics and gadgets' }, true)
    cutLabel(wrapper, true)

    await wrapper.trigger('pointerenter')
    await settle()
    await wrapper.trigger('pointerleave')
    await settle()

    expect(isShown()).toBe(false)
  })

  it('does not describe the chip by the tooltip — its name already holds the full text', async () => {
    const wrapper = await mount({}, { default: () => 'Electronics and gadgets' }, true)
    cutLabel(wrapper, true)

    await wrapper.trigger('pointerenter')
    await settle()

    expect(wrapper.attributes('aria-describedby')).toBeUndefined()
  })

  it('shows nothing for a disabled chip', async () => {
    const wrapper = await mount({ disabled: true }, { default: () => 'Electronics and gadgets' }, true)
    cutLabel(wrapper, true)

    await wrapper.trigger('pointerenter')
    await settle()

    expect(isShown()).toBe(false)
  })
})
