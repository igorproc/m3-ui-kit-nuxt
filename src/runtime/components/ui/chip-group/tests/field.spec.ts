import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import { MChip, MChipGroup, buttons, mountGroup, mountHost, pressed, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

function stubAdapter(value: unknown, error?: string) {
  const field = { value: ref(value), errorMessage: ref<string | undefined>(error) }
  const adapter: ValidationAdapter = {
    bindField: () => ({ ...field, meta: { required: false, touched: true, dirty: true, valid: !error, validated: true, pending: false } }) as never,
    createForm: () => { throw new Error('unused') },
  }
  return { adapter, value: field.value }
}

function withAdapter(adapter: ValidationAdapter, groupProps: Record<string, unknown>) {
  return defineComponent({
    setup() {
      provideValidationAdapter(adapter)
      return () => h(MChipGroup as never, { path: 'tags', label: 'Tags', ...groupProps }, {
        default: () => ['a', 'b'].map(value => h(MChip, { key: value, type: 'filter', value }, () => value)),
      })
    },
  })
}

describe('m-chip-group · field', () => {
  describe('name', () => {
    it('shows the label above the row and names the group by it', async () => {
      const { wrapper } = await mountGroup({ label: 'Categories' })
      const label = wrapper.find('.ui-chip-group__label')

      expect(label.text()).toBe('Categories')
      expect(wrapper.find('[role="group"]').attributes('aria-labelledby')).toBe(label.attributes('id'))
    })

    it('lets the label slot replace the text', async () => {
      const wrapper = await mountHost(defineComponent({
        setup: () => () => h(MChipGroup as never, {}, {
          label: () => 'Own label',
          default: () => [h(MChip, { type: 'filter', value: 'a' }, () => 'a')],
        }),
      }))

      expect(wrapper.find('.ui-chip-group__label').text()).toBe('Own label')
      expect(wrapper.find('[role="group"]').attributes('aria-labelledby')).toBeTruthy()
    })

    it('puts a consumer aria-label on the group row and class on the root', async () => {
      const { wrapper } = await mountGroup({ 'aria-label': 'Filters', 'class': 'own' })

      expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Filters')
      expect(wrapper.find('.ui-chip-group').classes()).toContain('own')
      expect(wrapper.find('.ui-chip-group__label').exists()).toBe(false)
    })

    it('marks a required group in the label, hidden from assistive tech', async () => {
      const { wrapper } = await mountGroup({ label: 'Tags', required: true })

      expect(wrapper.find('.ui-chip-group__required').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('support line', () => {
    it('renders no line when nothing can appear in it', async () => {
      const { wrapper } = await mountGroup({ label: 'Tags' })

      expect(wrapper.find('.ui-chip-group__support').exists()).toBe(false)
    })

    it('shows the helper text and describes the group by it', async () => {
      const { wrapper } = await mountGroup({ label: 'Tags', helperText: 'Up to two' })
      const line = wrapper.find('.ui-chip-group__support')

      expect(line.text()).toBe('Up to two')
      expect(wrapper.find('[role="group"]').attributes('aria-describedby')).toBe(line.attributes('id'))
    })

    it('swaps the helper for the error and marks the group invalid, without repainting the chips', async () => {
      const { wrapper } = await mountGroup({ label: 'Tags', helperText: 'Up to two', errorMessage: 'Pick one' })

      expect(wrapper.find('.ui-chip-group__support').text()).toBe('Pick one')
      expect(wrapper.find('[role="group"]').attributes('aria-invalid')).toBe('true')
      expect(buttons(wrapper).some(chip => chip.classes().includes('ui-chip--error'))).toBe(false)
    })

    it('reserves the line for a required group', async () => {
      const { wrapper } = await mountGroup({ label: 'Tags', required: true })

      expect(wrapper.find('.ui-chip-group__support').exists()).toBe(true)
    })
  })

  describe('validation adapter', () => {
    it('takes the selection from the bound field and writes presses back', async () => {
      const { adapter, value } = stubAdapter(['b'])
      const wrapper = await mountHost(withAdapter(adapter, { multiple: true }))
      await nextTick()

      expect(pressed(wrapper)).toEqual(['false', 'true'])

      await buttons(wrapper)[0]!.trigger('click')
      await nextTick()

      expect(value.value).toHaveLength(2)
      expect(value.value).toEqual(expect.arrayContaining(['a', 'b']))
    })

    it('shows the field error in the line', async () => {
      const { adapter } = stubAdapter(undefined, 'Pick a tag')
      const wrapper = await mountHost(withAdapter(adapter, {}))

      expect(wrapper.find('.ui-chip-group__support').text()).toBe('Pick a tag')
    })
  })
})
