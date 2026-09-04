import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { useSliderControl } from './useSliderControl'
import type { UseSliderControlOptions } from './useSliderControl'
import type { Ref } from 'vue'

type Control = ReturnType<typeof useSliderControl>

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names. Anything asserted here is behavior the bags carry on their own.
 */
function createHarness(model: Ref<number | number[]>, options: UseSliderControlOptions = {}) {
  let control: Control | null = null

  const component = defineComponent({
    setup() {
      control = useSliderControl(model, options)

      return () => h('div', control!.rootAttrs.value, [
        h('div', { ...control!.trackAttrs.value, class: 'harness-track' }, [
          h('i', { ...control!.rangeAttrs.value, class: 'harness-range' }),
          ...control!.values.value.map((_, index) =>
            h('span', { ...control!.getThumbAttrs(index), key: index })),
        ]),
      ])
    },
  })

  return { component, getControl: () => control! }
}

/** happy-dom reports a zero-sized box; pointer math needs a real one. */
function stubRect(element: Element, rect: Partial<DOMRect>) {
  const full = { x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40, ...rect }

  element.getBoundingClientRect = () => ({ ...full, toJSON: () => full }) as DOMRect
}

describe('useSliderControl', () => {
  it('exposes a complete slider role on markup it knows nothing about', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { min: 0, max: 100 })
    const wrapper = await mountSuspended(component)

    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('tabindex')).toBe('0')
    expect(thumb.attributes('aria-valuenow')).toBe('40')
    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
    expect(thumb.attributes('aria-valuetext')).toBe('40')
    expect(thumb.attributes('aria-orientation')).toBe('horizontal')
  })

  it('resolves the track element through a ref inside the attr bag', async () => {
    const model = ref(40)
    const { component, getControl } = createHarness(model)
    const wrapper = await mountSuspended(component)

    expect(getControl().trackElement.value).toBe(wrapper.find('.harness-track').element)
  })

  it('positions the thumb by percentage and publishes it as a custom property', async () => {
    const model = ref(25)
    const { component } = createHarness(model, { min: 0, max: 100 })
    const wrapper = await mountSuspended(component)

    const style = wrapper.find('[role="slider"]').attributes('style')

    expect(style).toContain('left: 25%')
    expect(style).toContain('--m-slider-percent: 25%')
    expect(style).toContain('--m-slider-progress: 25')
    expect(style).toContain('--m-slider-value: 25')
  })

  it('steps the value with the arrow keys', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { step: 5 })
    const wrapper = await mountSuspended(component)
    const thumb = wrapper.find('[role="slider"]')

    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(model.value).toBe(45)

    await thumb.trigger('keydown', { key: 'ArrowLeft' })
    expect(model.value).toBe(40)
  })

  it('multiplies the step by ten while shift is held', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { step: 2 })
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight', shiftKey: true })

    expect(model.value).toBe(60)
  })

  it('jumps to the bounds on Home and End', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { min: 10, max: 90 })
    const wrapper = await mountSuspended(component)
    const thumb = wrapper.find('[role="slider"]')

    await thumb.trigger('keydown', { key: 'Home' })
    expect(model.value).toBe(10)

    await thumb.trigger('keydown', { key: 'End' })
    expect(model.value).toBe(90)
  })

  it('reports every change through onUpdate', async () => {
    const model = ref(40)
    const seen: (number | number[])[] = []
    const { component } = createHarness(model, { step: 5, onUpdate: value => seen.push(value) })
    const wrapper = await mountSuspended(component)

    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })

    expect(seen).toEqual([45])
  })

  it('goes inert when disabled', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { disabled: true })
    const wrapper = await mountSuspended(component)
    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.attributes('tabindex')).toBe('-1')
    expect(thumb.attributes('aria-disabled')).toBe('true')

    await thumb.trigger('keydown', { key: 'ArrowRight' })

    expect(model.value).toBe(40)
  })

  it('stays focusable but frozen when readonly', async () => {
    const model = ref(40)
    const { component } = createHarness(model, { readonly: true })
    const wrapper = await mountSuspended(component)
    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.attributes('tabindex')).toBe('0')
    expect(thumb.attributes('aria-readonly')).toBe('true')

    await thumb.trigger('keydown', { key: 'ArrowRight' })

    expect(model.value).toBe(40)
  })

  it('clamps range thumbs by their neighbours', async () => {
    const model = ref<number | number[]>([20, 80])
    const { component } = createHarness(model, { min: 0, max: 100, step: 5 })
    const wrapper = await mountSuspended(component)
    const thumbs = wrapper.findAll('[role="slider"]')

    expect(thumbs).toHaveLength(2)
    expect(thumbs[0]!.attributes('aria-valuemax')).toBe('80')
    expect(thumbs[1]!.attributes('aria-valuemin')).toBe('20')

    await thumbs[0]!.trigger('keydown', { key: 'End' })

    // The start thumb may not cross the end thumb.
    expect(model.value).toEqual([80, 80])
  })

  it('flips the positioning axis and drag geometry when vertical', async () => {
    const model = ref(30)
    const { component } = createHarness(model, { orientation: 'vertical' })
    const wrapper = await mountSuspended(component)

    const thumb = wrapper.find('[role="slider"]')

    expect(thumb.attributes('aria-orientation')).toBe('vertical')
    expect(thumb.attributes('style')).toContain('bottom: 30%')
  })

  it('jumps the nearest thumb to a press on the track', async () => {
    const model = ref<number | number[]>([20, 80])
    const { component } = createHarness(model, { min: 0, max: 100, step: 1 })
    const wrapper = await mountSuspended(component)
    const track = wrapper.find('.harness-track')

    stubRect(track.element, { left: 0, width: 200 })

    await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0 })

    expect(model.value).toEqual([20, 75])
  })

  it('leaves a press that landed on a thumb to the thumb itself', async () => {
    const model = ref(20)
    const { component, getControl } = createHarness(model, { min: 0, max: 100 })
    const wrapper = await mountSuspended(component)

    stubRect(wrapper.find('.harness-track').element, { left: 0, width: 200 })

    await wrapper.find('[role="slider"]').trigger('pointerdown', { clientX: 150, clientY: 20, button: 0 })

    // No click-jump: the value is untouched and the thumb is armed for dragging.
    expect(model.value).toBe(20)
    expect(getControl().draggingIndex.value).toBe(0)
    expect(getControl().isDragging.value).toBe(true)
  })

  it('ignores a track press while disabled', async () => {
    const model = ref(20)
    const { component } = createHarness(model, { disabled: true })
    const wrapper = await mountSuspended(component)
    const track = wrapper.find('.harness-track')

    stubRect(track.element, { left: 0, width: 200 })

    await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0 })

    expect(model.value).toBe(20)
  })

  it('ships the whole semantic surface in the server-rendered HTML', async () => {
    const model = ref(25)
    const { component } = createHarness(model, { min: 0, max: 100, ariaLabel: () => 'Volume' })

    const html = await renderToString(createSSRApp(component))

    // Nothing here is added after hydration: assistive tech and no-JS readers
    // get the same slider the client does.
    expect(html).toContain('role="slider"')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-valuenow="25"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="100"')
    expect(html).toContain('aria-orientation="horizontal"')
    expect(html).toContain('aria-label="Volume"')
    expect(html).toContain('left:25%')
    expect(html).not.toContain('ref=')
  })

  it('describes the active range for the fill element', async () => {
    const model = ref<number | number[]>([20, 60])
    const { component } = createHarness(model, { min: 0, max: 100 })
    const wrapper = await mountSuspended(component)

    const style = wrapper.find('.harness-range').attributes('style')

    expect(style).toContain('left: 20%')
    expect(style).toContain('width: 40%')
  })
})
