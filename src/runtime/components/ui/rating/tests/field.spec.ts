import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import { ICONS } from '#kit/shared/constants/icons'
import MRating from '../index.vue'
import { mRatingProps } from '../props'
import { mount, previews, slider, stubItems, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

function stubAdapter(value: unknown, error?: string) {
  const field = { value: ref(value), errorMessage: ref<string | undefined>(error) }
  const adapter: ValidationAdapter = {
    bindField: () => ({ ...field, meta: { required: false, touched: true, dirty: true, valid: !error, validated: true, pending: false } }) as never,
    createForm: () => { throw new Error('unused') },
  }
  return { adapter, value: field.value }
}

describe('m-rating · field', () => {
  describe('read-only (W24-А)', () => {
    it('stays a Tab stop, so its value is read by focus', async () => {
      const wrapper = await mount({ readonly: true, modelValue: 4, ariaLabel: 'Score' })

      expect(slider(wrapper).attributes('tabindex')).toBe('0')
      expect(slider(wrapper).attributes('aria-readonly')).toBe('true')
    })

    it('shows no hover preview — only a live rating does', async () => {
      const wrapper = await mount({ readonly: true, modelValue: 1 })
      stubItems(wrapper)

      await slider(wrapper).trigger('pointermove', { clientX: 150, pointerType: 'mouse' })

      expect(previews(wrapper)).toEqual([])
    })
  })

  describe('label', () => {
    it('shows the label above the items and names the slider by it', async () => {
      const wrapper = await mount({ label: 'Delivery' })
      const label = wrapper.find('.ui-rating__label')

      expect(label.text()).toBe('Delivery')
      expect(slider(wrapper).attributes('aria-labelledby')).toBe(label.attributes('id'))
    })

    it('marks a required rating with aria-required and a hidden asterisk', async () => {
      const wrapper = await mount({ label: 'Delivery', required: true })

      expect(slider(wrapper).attributes('aria-required')).toBe('true')
      expect(wrapper.find('.ui-rating__required').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('support line', () => {
    it('renders no line when nothing can appear in it', async () => {
      const wrapper = await mount({ ariaLabel: 'Score' })

      expect(wrapper.find('.ui-rating__support').exists()).toBe(false)
    })

    it('shows helper text and describes the slider by it', async () => {
      const wrapper = await mount({ label: 'Delivery', helperText: 'Rate the courier' })
      const line = wrapper.find('.ui-rating__support')

      expect(line.text()).toBe('Rate the courier')
      expect(slider(wrapper).attributes('aria-describedby')).toBe(line.attributes('id'))
    })

    it('shows the error, marks the slider invalid and paints the empty items', async () => {
      const wrapper = await mount({ label: 'Delivery', errorMessage: 'Rate before sending' })

      expect(wrapper.find('.ui-rating__support').text()).toBe('Rate before sending')
      expect(slider(wrapper).attributes('aria-invalid')).toBe('true')
      expect(wrapper.classes()).toContain('ui-rating--invalid')
    })
  })

  describe('validation adapter', () => {
    it('takes its value from the field and writes a press back', async () => {
      const { adapter, value } = stubAdapter(2)
      const wrapper = await mountSuspended(defineComponent({
        setup() {
          provideValidationAdapter(adapter)
          return () => h(MRating, { path: 'score', label: 'Score' })
        },
      }))

      expect(slider(wrapper).attributes('aria-valuenow')).toBe('2')

      await slider(wrapper).trigger('keydown', { key: 'ArrowRight' })
      await nextTick()

      expect(value.value).toBe(3)
      wrapper.unmount()
    })

    it('posts under the path when there is no name', async () => {
      const wrapper = await mount({ path: 'score', modelValue: 3, ariaLabel: 'Score' })

      expect(wrapper.find('input[type="hidden"]').attributes('name')).toBe('score')
    })
  })

  describe('props', () => {
    it('has no loading state', () => {
      expect(Object.keys(mRatingProps)).not.toContain('loading')
    })

    it('draws the kit glyphs by default', async () => {
      const wrapper = await mount({ length: 1 })

      expect(wrapper.find('.ui-rating__icon--full').html()).toContain(ICONS.ratingStar)
      expect(wrapper.find('.ui-rating__icon--empty').html()).toContain(ICONS.ratingStarEmpty)
    })
  })
})
