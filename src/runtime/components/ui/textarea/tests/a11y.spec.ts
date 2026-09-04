import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MTextarea from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTextarea, { props, slots })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-textarea · a11y', () => {
  describe('naming', () => {
    it('names the control with a real label association', async () => {
      const wrapper = await mount({ label: 'Release notes' })

      expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('textarea').attributes('id'))
    })

    it('keeps the association when the label is only visually hidden', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })

      expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('textarea').attributes('id'))
    })

    it('hides the decorative required marker from assistive tech', async () => {
      const wrapper = await mount({ label: 'Notes', required: true })

      expect(wrapper.find('.ui-textarea__required').attributes('aria-hidden')).toBe('true')
    })

    it('relies on the native textarea role rather than an invented one', async () => {
      const wrapper = await mount({ label: 'Notes' })

      expect(wrapper.find('textarea').attributes('role')).toBeUndefined()
    })
  })

  describe('descriptions', () => {
    it('points aria-describedby at the support line and the counter', async () => {
      const wrapper = await mount({ helperText: 'Hint', maxlength: 20, counter: true, modelValue: 'abc' })
      const describedBy = wrapper.find('textarea').attributes('aria-describedby')!

      expect(describedBy).toContain(wrapper.find('.ui-textarea__message').attributes('id'))
      expect(describedBy).toContain(wrapper.find('.ui-textarea__counter').attributes('id'))
    })

    it('describes nothing when there is nothing to describe', async () => {
      const wrapper = await mount()

      expect(wrapper.find('textarea').attributes('aria-describedby')).toBeUndefined()
    })

    it('keeps one description id across the helper-to-error swap', async () => {
      const helper = await mount({ helperText: 'Hint' })
      const helperId = helper.find('textarea').attributes('aria-describedby')

      const invalid = await mount({ helperText: 'Hint', errorMessage: 'Too short' })

      expect(invalid.find('textarea').attributes('aria-describedby')).toBe(helperId)
    })
  })

  describe('validity', () => {
    it('marks the control invalid and announces the message', async () => {
      const wrapper = await mount({ errorMessage: 'Too short' })

      expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('.ui-textarea__message').attributes('role')).toBe('alert')
    })

    it('treats the error prop as invalid even without a message', async () => {
      const wrapper = await mount({ error: true })

      expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true')
    })

    it('leaves a valid field unmarked and its helper silent', async () => {
      const wrapper = await mount({ helperText: 'Markdown supported' })

      expect(wrapper.find('textarea').attributes('aria-invalid')).toBeUndefined()
      expect(wrapper.find('.ui-textarea__message').attributes('role')).toBeUndefined()
      expect(wrapper.find('.ui-textarea__message').attributes('aria-live')).toBeUndefined()
    })

    it('exposes required through both the native attribute and ARIA', async () => {
      const wrapper = await mount({ required: true })
      const textarea = wrapper.find('textarea')

      expect(textarea.attributes('required')).toBeDefined()
      expect(textarea.attributes('aria-required')).toBe('true')
    })

    it('omits aria-required when the field is optional', async () => {
      const wrapper = await mount()

      expect(wrapper.find('textarea').attributes('aria-required')).toBeUndefined()
    })
  })

  describe('validity is not colour alone', () => {
    it('shows a glyph beside the message, so the state survives without hue', async () => {
      const wrapper = await mount({ errorMessage: 'Too short' })

      expect(wrapper.find('.ui-textarea__message-icon').exists()).toBe(true)
    })

    it('marks the glyph decorative — the message already says it', async () => {
      const wrapper = await mount({ errorMessage: 'Too short' })

      expect(wrapper.find('.ui-textarea__message-icon').attributes('aria-hidden')).toBe('true')
    })

    it('shows the glyph even when the error carries no message at all', async () => {
      const wrapper = await mount({ error: true })

      expect(wrapper.find('.ui-textarea__message-icon').exists()).toBe(true)
      expect(wrapper.find('.ui-textarea__message').text()).toBe('')
    })

    it('stays out of a valid field', async () => {
      const wrapper = await mount({ helperText: 'Markdown supported' })

      expect(wrapper.find('.ui-textarea__message-icon').exists()).toBe(false)
    })

    it('steps aside for a custom error slot, which owns its own indicator', async () => {
      const wrapper = await mount(
        { errorMessage: 'Too short' },
        { error: (scope: { message: string }) => `custom: ${scope.message}` },
      )

      expect(wrapper.find('.ui-textarea__message-icon').exists()).toBe(false)
    })
  })

  describe('counter announcements', () => {
    it('stays silent while the limit is far away — no chatter per keystroke', async () => {
      const wrapper = await mount({ counter: true, maxlength: 500, modelValue: 'abc' })
      const counter = wrapper.find('.ui-textarea__counter')

      expect(counter.attributes('aria-live')).toBeUndefined()
      expect(counter.attributes('aria-atomic')).toBeUndefined()
    })

    it('becomes a live region once the value approaches the limit', async () => {
      const wrapper = await mount({ counter: true, maxlength: 20, modelValue: 'a'.repeat(11) })
      const counter = wrapper.find('.ui-textarea__counter')

      expect(counter.attributes('aria-live')).toBe('polite')
      expect(counter.attributes('aria-atomic')).toBe('true')
    })

    it('never goes live without a limit to approach', async () => {
      const wrapper = await mount({ counter: true, modelValue: 'a'.repeat(400) })

      expect(wrapper.find('.ui-textarea__counter').attributes('aria-live')).toBeUndefined()
    })
  })

  describe('resize grip', () => {
    it('exposes the window-splitter pattern with a value in rows', async () => {
      const wrapper = await mount({ resizable: true, rows: 3, maxRows: 8, resizeLabel: 'Resize notes' })
      const grip = wrapper.find('.ui-textarea__grip')

      expect(grip.attributes('role')).toBe('separator')
      expect(grip.attributes('aria-orientation')).toBe('horizontal')
      expect(grip.attributes('aria-label')).toBe('Resize notes')
      expect(grip.attributes('aria-valuenow')).toBe('3')
      expect(grip.attributes('aria-valuemin')).toBe('3')
      expect(grip.attributes('aria-valuemax')).toBe('8')
    })

    it('is reachable by keyboard — a pointer-only handle would fail 2.1.1', async () => {
      const wrapper = await mount({ resizable: true })

      expect(wrapper.find('.ui-textarea__grip').attributes('tabindex')).toBe('0')
    })

    it('reports the height it has been dragged to', async () => {
      const wrapper = await mount({ resizable: true, rows: 3 })
      const grip = wrapper.find('.ui-textarea__grip')

      await grip.trigger('keydown', { key: 'ArrowDown' })

      expect(wrapper.find('.ui-textarea__grip').attributes('aria-valuenow')).toBe('4')
    })

    it('drops out of the tab order and reports itself disabled with the field', async () => {
      const wrapper = await mount({ resizable: true, disabled: true })
      const grip = wrapper.find('.ui-textarea__grip')

      expect(grip.attributes('tabindex')).toBe('-1')
      expect(grip.attributes('aria-disabled')).toBe('true')
    })

    it('is equally inert in a read-only field — nothing there responds', async () => {
      const wrapper = await mount({ resizable: true, readonly: true })
      const grip = wrapper.find('.ui-textarea__grip')

      expect(grip.attributes('tabindex')).toBe('-1')
      expect(grip.attributes('aria-disabled')).toBe('true')
    })

    it('omits an upper bound it does not have', async () => {
      const wrapper = await mount({ resizable: true, rows: 2 })

      expect(wrapper.find('.ui-textarea__grip').attributes('aria-valuemax')).toBeUndefined()
    })
  })
})
