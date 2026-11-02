import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { useSliderControl } from './useSliderControl'
import type { UseSliderControlOptions } from './types'
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

    // Logical: the same 25% stands from the right edge in RTL.
    expect(style).toContain('inset-inline-start: 25%')
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
    expect(html).toContain('inset-inline-start:25%')
    expect(html).not.toContain('ref=')
  })

  describe('touch-action', () => {
    it.each([
      ['horizontal', 'pan-y'],
      ['vertical', 'pan-x'],
    ] as const)('leaves the cross axis to the page on a %s track (%s)', async (orientation, expected) => {
      const { component } = createHarness(ref(40), { orientation })
      const wrapper = await mountSuspended(component)

      expect(wrapper.find('.harness-track').attributes('style')).toContain(`touch-action: ${expected}`)
    })

    it('keeps the thumb itself from scrolling the page', async () => {
      const { component } = createHarness(ref(40))
      const wrapper = await mountSuspended(component)

      expect(wrapper.find('[role="slider"]').attributes('style')).toContain('touch-action: none')
    })
  })

  describe('touch press on the track', () => {
    async function touchHarness(model: Ref<number | number[]>) {
      const { component, getControl } = createHarness(model, { min: 0, max: 100, step: 1 })
      const wrapper = await mountSuspended(component)
      const track = wrapper.find('.harness-track')
      stubRect(track.element, { left: 0, width: 200 })
      return { wrapper, track, getControl }
    }

    const release = (type: 'pointerup' | 'pointercancel', clientX: number) =>
      window.dispatchEvent(new PointerEvent(type, { clientX, clientY: 20, pointerType: 'touch' }))

    it('waits for the finger to lift before jumping, so a scroll over the track changes nothing', async () => {
      const model = ref(20)
      const { track } = await touchHarness(model)

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0, pointerType: 'touch' })
      expect(model.value).toBe(20)

      release('pointerup', 150)
      expect(model.value).toBe(75)
    })

    it('drops the jump when the browser takes the gesture for a scroll', async () => {
      const model = ref(20)
      const { track, getControl } = await touchHarness(model)

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0, pointerType: 'touch' })
      release('pointercancel', 150)

      expect(model.value).toBe(20)
      expect(getControl().isDragging.value).toBe(false)
    })

    it('jumps at once for a mouse', async () => {
      const model = ref(20)
      const { track } = await touchHarness(model)

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0, pointerType: 'mouse' })

      expect(model.value).toBe(75)
    })

    it('ends the press on release even when the pointer never moved', async () => {
      const model = ref(20)
      const { wrapper, getControl } = await touchHarness(model)

      await wrapper.find('[role="slider"]').trigger('pointerdown', { clientX: 40, clientY: 20, button: 0, pointerType: 'mouse' })
      expect(getControl().isDragging.value).toBe(true)

      release('pointerup', 40)
      expect(getControl().isDragging.value).toBe(false)
    })
  })

  describe('right to left', () => {
    async function rtlHarness(model: Ref<number | number[]>) {
      const { component } = createHarness(model, { min: 0, max: 100, step: 1 })
      const host = document.createElement('div')
      host.setAttribute('dir', 'rtl')
      host.style.direction = 'rtl'
      document.body.append(host)
      const wrapper = await mountSuspended(component, { attachTo: host })
      return { wrapper, host }
    }

    it('measures a press from the right edge', async () => {
      const model = ref(20)
      const { wrapper, host } = await rtlHarness(model)
      const track = wrapper.find('.harness-track')
      stubRect(track.element, { left: 0, right: 200, width: 200 })

      await track.trigger('pointerdown', { clientX: 150, clientY: 20, button: 0, pointerType: 'mouse' })

      expect(model.value).toBe(25)
      wrapper.unmount()
      host.remove()
    })

    it('swaps the meaning of the left and right arrows', async () => {
      const model = ref(40)
      const { wrapper, host } = await rtlHarness(model)
      const thumb = wrapper.find('[role="slider"]')

      await thumb.trigger('keydown', { key: 'ArrowLeft' })
      expect(model.value).toBe(41)

      await thumb.trigger('keydown', { key: 'ArrowRight' })
      expect(model.value).toBe(40)

      await thumb.trigger('keydown', { key: 'ArrowUp' })
      expect(model.value).toBe(41)
      wrapper.unmount()
      host.remove()
    })
  })

  describe('bags carry no state attributes (W5-А)', () => {
    it('spreads no data-* onto the root, the track or the thumbs', async () => {
      const { component } = createHarness(ref<number | number[]>([20, 60]))
      const wrapper = await mountSuspended(component)
      const names = [wrapper.element, ...wrapper.element.querySelectorAll('*')]
        .flatMap(el => [...el.attributes].map(attribute => attribute.name))

      expect(names.filter(name => name.startsWith('data-') && name !== 'data-v-app')).toEqual([])
    })

    it('makes a range a group and leaves a single slider without a wrapper role', async () => {
      const range = createHarness(ref<number | number[]>([20, 60]))
      await mountSuspended(range.component)
      expect(range.getControl().rootAttrs.value.role).toBe('group')

      const single = createHarness(ref(20))
      await mountSuspended(single.component)
      expect(single.getControl().rootAttrs.value.role).toBeUndefined()
    })
  })

  describe('value indicator', () => {
    it('shows for a keyboard step and goes on Escape and blur', async () => {
      const { component, getControl } = createHarness(ref(40))
      const wrapper = await mountSuspended(component)
      const thumb = wrapper.find('[role="slider"]')

      await thumb.trigger('keydown', { key: 'ArrowRight' })
      expect(getControl().valueIndex.value).toBe(0)

      await thumb.trigger('keydown', { key: 'Escape' })
      expect(getControl().valueIndex.value).toBeNull()

      await thumb.trigger('keydown', { key: 'ArrowRight' })
      await thumb.trigger('blur')
      expect(getControl().valueIndex.value).toBeNull()
    })

    it('shows while a thumb is pressed and goes on release', async () => {
      const { component, getControl } = createHarness(ref(40))
      const wrapper = await mountSuspended(component)

      await wrapper.find('[role="slider"]').trigger('pointerdown', { clientX: 40, clientY: 20, button: 0 })
      expect(getControl().valueIndex.value).toBe(0)

      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 40, clientY: 20 }))
      expect(getControl().valueIndex.value).toBeNull()
    })

    it('never shows for a key it does not handle', async () => {
      const { component, getControl } = createHarness(ref(40))
      const wrapper = await mountSuspended(component)

      await wrapper.find('[role="slider"]').trigger('keydown', { key: 'a' })

      expect(getControl().valueIndex.value).toBeNull()
    })
  })

  describe('origin', () => {
    it.each([
      [70, { start: 50, end: 70 }],
      [20, { start: 20, end: 50 }],
    ])('runs a centered active range from the middle to %s', async (value, expected) => {
      const { component, getControl } = createHarness(ref(value), { min: 0, max: 100, origin: 'center' })
      await mountSuspended(component)

      expect(getControl().activeRange.value).toEqual(expected)
    })

    it('runs from the minimum by default', async () => {
      const { component, getControl } = createHarness(ref(70))
      await mountSuspended(component)

      expect(getControl().activeRange.value).toEqual({ start: 0, end: 70 })
    })
  })

  it('describes the active range for the fill element', async () => {
    const model = ref<number | number[]>([20, 60])
    const { component } = createHarness(model, { min: 0, max: 100 })
    const wrapper = await mountSuspended(component)

    const style = wrapper.find('.harness-range').attributes('style')

    expect(style).toContain('inset-inline-start: 20%')
    expect(style).toContain('width: 40%')
  })
})
