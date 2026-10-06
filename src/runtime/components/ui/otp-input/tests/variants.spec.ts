import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MOtpInput from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MOtpInput, { props, slots })

  return current as VueWrapper
}

const cells = (wrapper: VueWrapper) =>
  wrapper.findAll('.ui-otp-input__field')

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-otp-input · variants', () => {
  describe('shape', () => {
    it('draws one cell per character of the code', async () => {
      const wrapper = await mount({ length: 4 })

      expect(cells(wrapper)).toHaveLength(4)
    })

    it('coerces a nonsensical length to a field that still works', async () => {
      const wrapper = await mount({ length: 0 })

      expect(cells(wrapper)).toHaveLength(1)
    })

    it('splits the cells into groups', async () => {
      const wrapper = await mount({ length: 6, groups: [3, 3] })

      expect(wrapper.findAll('.ui-otp-input__group')).toHaveLength(2)
    })

    it('separates groups by rhythm, not by a glyph', async () => {
      const wrapper = await mount({ length: 6, groups: [3, 3] })

      expect(wrapper.find('.ui-otp-input__separator').exists()).toBe(false)
    })

    it('draws a separator only when one is asked for', async () => {
      const wrapper = await mount({ length: 6, groups: [3, 3], separator: '–' })

      expect(wrapper.findAll('.ui-otp-input__separator')).toHaveLength(1)
      expect(wrapper.find('.ui-otp-input__separator').text()).toBe('–')
    })

    it('falls back to one group when the sizes do not add up to the length', async () => {
      const wrapper = await mount({ length: 6, groups: [2, 2] })

      expect(wrapper.findAll('.ui-otp-input__group')).toHaveLength(1)
      expect(cells(wrapper)).toHaveLength(6)
    })

    it('ignores group sizes that are not positive integers', async () => {
      const wrapper = await mount({ length: 4, groups: [2, 0, 2] })

      expect(wrapper.findAll('.ui-otp-input__group')).toHaveLength(2)
    })

    it('renders no separator for a single group', async () => {
      const wrapper = await mount({ length: 4 })

      expect(wrapper.find('.ui-otp-input__separator').exists()).toBe(false)
    })
  })

  describe('cell state', () => {
    it('marks the cells that carry a character', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })

      expect(cells(wrapper).map(cell => cell.classes().includes('ui-otp-input__field--filled')))
        .toEqual([true, true, false, false])
    })

    it('marks every cell invalid with the field', async () => {
      const wrapper = await mount({ length: 3, error: true })

      for (const cell of cells(wrapper)) {
        expect(cell.classes()).toContain('ui-otp-input__field--error')
      }
    })

    it('marks every cell disabled with the field', async () => {
      const wrapper = await mount({ length: 3, disabled: true })

      for (const cell of cells(wrapper)) {
        expect(cell.classes()).toContain('ui-otp-input__field--disabled')
      }
    })

    it('highlights no position while the field is unfocused', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12' })

      expect(wrapper.find('.ui-otp-input__field--active').exists()).toBe(false)
    })

    it('highlights the caret position once the field is focused', async () => {
      const wrapper = await mount({ length: 4 })

      await wrapper.find('input').trigger('focus')

      expect(cells(wrapper)[0]!.classes()).toContain('ui-otp-input__field--active')
    })
  })

  describe('mask', () => {
    it('shows the value as typed by default', async () => {
      const wrapper = await mount({ length: 4, modelValue: '1234' })

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['1', '2', '3', '4'])
    })

    it('replaces filled cells with a bullet when masked', async () => {
      const wrapper = await mount({ length: 4, modelValue: '12', mask: true })

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['•', '•', '', ''])
    })

    it('takes the mask character from the prop', async () => {
      const wrapper = await mount({ length: 2, modelValue: '12', mask: '*' })

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['*', '*'])
    })

    it('never masks an empty cell — there is nothing to hide', async () => {
      const wrapper = await mount({ length: 3, modelValue: '1', mask: true })

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['•', '', ''])
    })
  })

  describe('slots', () => {
    it('lets a consumer replace a cell', async () => {
      const wrapper = await mount(
        { length: 2, modelValue: '12' },
        { field: (cell: { position: number }) => `#${cell.position}` },
      )

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['#1', '#2'])
    })

    it('lets a consumer replace the mask', async () => {
      const wrapper = await mount(
        { length: 2, modelValue: '12', mask: true },
        { mask: () => 'x' },
      )

      expect(cells(wrapper).map(cell => cell.text())).toEqual(['x', 'x'])
    })

    it('lets a consumer replace the separator', async () => {
      const wrapper = await mount(
        { length: 4, groups: [2, 2] },
        { separator: () => '·' },
      )

      expect(wrapper.find('.ui-otp-input__separator').text()).toBe('·')
    })

    it('hands the group slot its range and the completion state', async () => {
      const wrapper = await mount(
        { length: 4, groups: [2, 2], modelValue: '1234' },
        { group: (scope: { start: number, end: number, complete: boolean }) => `${scope.start}-${scope.end}:${scope.complete}` },
      )

      expect(wrapper.findAll('.ui-otp-input__group').map(group => group.text()))
        .toEqual(['0-2:true', '2-4:true'])
    })
  })

  describe('label', () => {
    it('renders the label text', async () => {
      const wrapper = await mount({ length: 4, label: 'Код из SMS' })

      expect(wrapper.find('.ui-otp-input__label').text()).toBe('Код из SMS')
    })

    it('lets a consumer fill the label, keeping the element that carries the association', async () => {
      const wrapper = await mount(
        { length: 4, label: 'Код' },
        { label: () => 'Код из SMS' },
      )
      const label = wrapper.find('label.ui-otp-input__label')

      expect(label.text()).toBe('Код из SMS')
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('defaults to the placement above the cells', async () => {
      const wrapper = await mount({ length: 4, label: 'Код' })

      expect(wrapper.classes()).toContain('ui-otp-input--label-top')
    })

    it('keeps a hidden label in the document', async () => {
      const wrapper = await mount({ length: 4, label: 'Код', labelPlacement: 'hidden' })

      expect(wrapper.classes()).toContain('ui-otp-input--label-hidden')
      expect(wrapper.find('label.ui-otp-input__label').text()).toBe('Код')
    })
  })

  describe('support', () => {
    it('renders whatever stands beside the field — a resend action, a countdown', async () => {
      const wrapper = await mount(
        { length: 4 },
        { support: () => 'Отправить снова' },
      )

      expect(wrapper.find('.ui-otp-input__support').text()).toBe('Отправить снова')
    })

    it('renders no support row when nothing was given', async () => {
      const wrapper = await mount({ length: 4 })

      expect(wrapper.find('.ui-otp-input__support').exists()).toBe(false)
    })

    it('is separate from the error message — both can show at once', async () => {
      const wrapper = await mount(
        { length: 4, errorMessage: 'Код неверный' },
        { support: () => 'Отправить снова' },
      )

      expect(wrapper.find('.ui-otp-input__message').text()).toBe('Код неверный')
      expect(wrapper.find('.ui-otp-input__support').text()).toBe('Отправить снова')
    })
  })

  describe('root state', () => {
    it('reflects focus, validity and completion on the root', async () => {
      const wrapper = await mount({ length: 2, modelValue: '12', error: true })

      expect(wrapper.classes()).toContain('ui-otp-input--error')
      expect(wrapper.classes()).toContain('ui-otp-input--complete')
      expect(wrapper.classes()).not.toContain('ui-otp-input--focused')

      await wrapper.find('input').trigger('focus')
      expect(wrapper.classes()).toContain('ui-otp-input--focused')
    })

    it('is not complete while a position is still empty', async () => {
      const wrapper = await mount({ length: 3, modelValue: '12' })

      expect(wrapper.classes()).not.toContain('ui-otp-input--complete')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ length: 2, error: true })

      expect(wrapper.attributes('data-error')).toBeUndefined()
      expect(wrapper.attributes('data-focused')).toBeUndefined()
    })
  })

  describe('support line', () => {
    it('shows the error message', async () => {
      const wrapper = await mount({ length: 4, errorMessage: 'Код неверный' })

      expect(wrapper.find('.ui-otp-input__message').text()).toBe('Код неверный')
    })

    // The line is reserved height (an appearing error must not push the page
    // down) and a live region (it has to exist before its text changes).
    it('keeps the line mounted and empty when there is nothing to say', async () => {
      const wrapper = await mount({ length: 4 })
      const line = wrapper.find('.ui-otp-input__message')

      expect(line.exists()).toBe(true)
      expect(line.text()).toBe('')
      expect(line.find('.ui-otp-input__message-icon').exists()).toBe(false)
    })

    it('carries an error glyph, so an error without a message is not colour alone', async () => {
      const wrapper = await mount({ length: 4, error: true })

      expect(wrapper.find('.ui-otp-input__message-icon').exists()).toBe(true)
    })
  })
})
