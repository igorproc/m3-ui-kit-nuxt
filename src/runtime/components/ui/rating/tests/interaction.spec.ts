import { afterEach, describe, expect, it } from 'vitest'
import { fills, mount, press, previews, stubItems, unmountCurrent, slider } from './helpers'

afterEach(unmountCurrent)

describe('m-rating · interaction', () => {
  describe('keyboard', () => {
    it.each([
      ['ArrowRight', 3],
      ['ArrowUp', 3],
      ['ArrowLeft', 1],
      ['ArrowDown', 1],
      ['Home', 0],
      ['End', 5],
    ])('%s moves 2 to %s, and reports the change', async (key, expected) => {
      const wrapper = await mount({ modelValue: 2 })

      await slider(wrapper).trigger('keydown', { key })

      expect(wrapper.emitted('update:modelValue')).toEqual([[expected]])
      expect(wrapper.emitted('change')).toEqual([[expected]])
    })

    it('steps by halves with step 0.5', async () => {
      const wrapper = await mount({ modelValue: 2.5, step: 0.5 })

      await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('update:modelValue')).toEqual([[3]])
    })

    it('stops at the bounds without a no-op change', async () => {
      const wrapper = await mount({ modelValue: 5 })

      await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })

      expect(wrapper.emitted('change')).toBeUndefined()
    })
  })

  describe('pointer', () => {
    it('commits the item under the pointer on release', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await press(wrapper, 150)

      expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
      expect(wrapper.emitted('change')).toEqual([[4]])
    })

    it('fills the pointed item from its first edge, not from its middle', async () => {
      const wrapper = await mount({ modelValue: 0 })
      stubItems(wrapper)

      await press(wrapper, 2)

      expect(wrapper.emitted('update:modelValue')).toEqual([[1]])
    })

    it('measures a half step over the glyph: its near half gives .5, its far half the whole item', async () => {
      const wrapper = await mount({ modelValue: 0, step: 0.5 })
      stubItems(wrapper)

      await press(wrapper, 90)
      await press(wrapper, 110)

      expect(wrapper.emitted('update:modelValue')).toEqual([[2.5], [3]])
    })

    it('commits only a primary press that started on the rating', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointerup', { clientX: 150, pointerType: 'mouse', button: 0 })
      await slider(wrapper).trigger('pointerdown', { clientX: 150, pointerType: 'mouse', button: 2 })
      await slider(wrapper).trigger('pointerup', { clientX: 150, pointerType: 'mouse', button: 2 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('drops a press that left the rating or was taken by a scroll', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointerdown', { clientX: 150, pointerType: 'mouse', button: 0 })
      await slider(wrapper).trigger('pointerleave')
      await slider(wrapper).trigger('pointerup', { clientX: 150, pointerType: 'mouse', button: 0 })
      await slider(wrapper).trigger('pointerdown', { clientX: 150, pointerType: 'touch', button: 0 })
      await slider(wrapper).trigger('pointercancel')
      await slider(wrapper).trigger('pointerup', { clientX: 150, pointerType: 'touch', button: 0 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('previews the value under a hovering mouse without committing it', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 110, pointerType: 'mouse' })

      expect(wrapper.emitted('preview')).toEqual([[3]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('keeps committed items solid and fades only what the preview adds', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 110, pointerType: 'mouse' })

      expect(fills(wrapper)[0]).toContain('width: 100%')
      expect(fills(wrapper)[2]).toContain('width: 0%')
      expect(previews(wrapper)[2]).toContain('width: 100%')
      expect(previews(wrapper)[3]).toContain('width: 0%')
    })

    it('shows a preview below the value as the lower value', async () => {
      const wrapper = await mount({ modelValue: 4 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 30, pointerType: 'mouse' })

      expect(fills(wrapper)[0]).toContain('width: 100%')
      expect(fills(wrapper)[1]).toContain('width: 0%')
    })

    it('clears the preview when the pointer leaves', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 110, pointerType: 'mouse' })
      await slider(wrapper).trigger('pointerleave')

      expect(wrapper.emitted('preview')).toEqual([[3], [null]])
      expect(previews(wrapper)).toEqual([])
    })

    it('shows no preview for touch, which has no hover', async () => {
      const wrapper = await mount({ modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 110, pointerType: 'touch' })

      expect(wrapper.emitted('preview')).toBeUndefined()
    })

    it('clears to zero when the current value is pressed again with clearable', async () => {
      const wrapper = await mount({ modelValue: 4, clearable: true })
      stubItems(wrapper)

      await press(wrapper, 150)

      expect(wrapper.emitted('update:modelValue')).toEqual([[0]])
    })

    it('keeps the value when it is pressed again without clearable', async () => {
      const wrapper = await mount({ modelValue: 4 })
      stubItems(wrapper)

      await press(wrapper, 150)

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('disabled and readonly', () => {
    it.each(['disabled', 'readonly'] as const)('ignores keys, hover and presses while %s', async (state) => {
      const wrapper = await mount({ modelValue: 2, [state]: true })
      stubItems(wrapper)

      await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })
      await slider(wrapper).trigger('pointermove', { clientX: 150, pointerType: 'mouse' })
      await press(wrapper, 150)

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('preview')).toBeUndefined()
      expect(previews(wrapper)).toEqual([])
    })
  })

  describe('model normalisation', () => {
    it('writes a value past the scale back clamped to it', async () => {
      const wrapper = await mount({ modelValue: 7 })

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5])
    })

    it('writes an off-step value back snapped to the step', async () => {
      const wrapper = await mount({ modelValue: 2.3, step: 0.5 })

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([2.5])
    })
  })

  describe('focus', () => {
    it('reports focus through v-model:focused', async () => {
      const wrapper = await mount({}, undefined, true)

      await slider(wrapper).trigger('focus')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])

      await slider(wrapper).trigger('blur')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([false])
    })
  })
})
