import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import MTextarea from '../index.vue'
import MTextareaFooter from '../footer.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MTextarea, { props, slots })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

const footerSlot = () => h(MTextareaFooter, null, { end: () => h('button', { type: 'button' }, 'Submit') })

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-textarea · variants', () => {
  describe('shape', () => {
    it.each(['filled', 'outlined'] as const)('renders the %s container', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-textarea--${variant}`)
      expect(wrapper.find('.ui-textarea__control').exists()).toBe(true)
    })

    it('defaults to filled and to the small radius tier', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-textarea--filled')
      expect(wrapper.classes()).toContain('ui-textarea--small')
    })

    it('maps the rounded prop onto its own modifier', async () => {
      const wrapper = await mount({ rounded: 'large' })

      expect(wrapper.classes()).toContain('ui-textarea--large')
    })

    it('drops the shapes a multi-line box has no use for', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-textarea--underline')
      expect(wrapper.classes()).not.toContain('ui-textarea--ghost')
      expect(wrapper.classes()).not.toContain('ui-textarea--code')
    })
  })

  describe('label', () => {
    it('keeps the label above the box in every shape — it never overlays the value', async () => {
      const wrapper = await mount({ variant: 'outlined', label: 'Release notes' })
      const label = wrapper.find('label.ui-textarea__label')

      expect(label.text()).toContain('Release notes')
      expect(wrapper.find('.ui-textarea__control').element.contains(label.element)).toBe(false)
    })

    it('marks a required field in the label', async () => {
      const wrapper = await mount({ label: 'Notes', required: true })

      expect(wrapper.find('.ui-textarea__required').exists()).toBe(true)
    })

    it('hides the label visually while keeping it in the document', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })

      expect(wrapper.classes()).toContain('ui-textarea--label-hidden')
      expect(wrapper.find('label.ui-textarea__label').exists()).toBe(true)
    })

    it('renders no label element when there is no label', async () => {
      const wrapper = await mount()

      expect(wrapper.find('label.ui-textarea__label').exists()).toBe(false)
    })
  })

  describe('counter', () => {
    it('sits under the box, on the support row opposite the message', async () => {
      const wrapper = await mount({ label: 'Notes', counter: true, maxlength: 500, modelValue: 'abc' })
      const counter = wrapper.find('.ui-textarea__counter')

      expect(counter.text()).toBe('3 / 500')
      expect(wrapper.find('.ui-textarea__support').element.contains(counter.element)).toBe(true)
      expect(wrapper.find('.ui-textarea__control').element.contains(counter.element)).toBe(false)
    })

    it('supports a display-only limit without a native maxlength', async () => {
      const wrapper = await mount({ counter: 100, modelValue: 'hello' })

      expect(wrapper.find('textarea').attributes('maxlength')).toBeUndefined()
      expect(wrapper.find('.ui-textarea__counter').text()).toBe('5 / 100')
    })

    it('counts up with no limit when one is not known', async () => {
      const wrapper = await mount({ counter: true, modelValue: 'hello' })

      expect(wrapper.find('.ui-textarea__counter').text()).toBe('5')
    })

    it('is hidden by default', async () => {
      const wrapper = await mount({ modelValue: 'hello' })

      expect(wrapper.find('.ui-textarea__counter').exists()).toBe(false)
    })

    it('exposes length, limit and remaining to a custom counter slot', async () => {
      const wrapper = await mount(
        { counter: 10, modelValue: 'abc' },
        { counter: (scope: { length: number, limit: number, remaining: number }) => `${scope.length}·${scope.limit}·${scope.remaining}` },
      )

      expect(wrapper.find('.ui-textarea__counter').text()).toBe('3·10·7')
    })
  })

  describe('support line', () => {
    it('reserves its row even with nothing to say, so validity never reflows the form', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-textarea__support').exists()).toBe(true)
      expect(wrapper.find('.ui-textarea__message').text()).toBe('')
    })

    it('shows helper text and swaps it for the error message', async () => {
      const helper = await mount({ helperText: 'Markdown supported' })
      expect(helper.find('.ui-textarea__message').text()).toBe('Markdown supported')

      const invalid = await mount({ helperText: 'Markdown supported', errorMessage: 'Too short' })
      expect(invalid.find('.ui-textarea__message').text()).toContain('Too short')
      expect(invalid.find('.ui-textarea__message').text()).not.toContain('Markdown supported')
    })

    it('marks the invalid state on the root, and carries the reason in the message', async () => {
      const valid = await mount({ helperText: 'Markdown supported' })
      expect(valid.classes()).not.toContain('ui-textarea--error')

      const invalid = await mount({ errorMessage: 'Too short' })
      expect(invalid.classes()).toContain('ui-textarea--error')
      expect(invalid.find('.ui-textarea__message').text()).toBe('Too short')
    })

    it('lets a consumer replace helper and error content', async () => {
      const wrapper = await mount(
        { errorMessage: 'Too short' },
        { error: (scope: { message: string }) => `custom: ${scope.message}` },
      )

      expect(wrapper.find('.ui-textarea__message').text()).toContain('custom: Too short')
    })
  })

  describe('composer', () => {
    it('absorbs the footer into the container instead of stacking it outside', async () => {
      const wrapper = await mount({}, { footer: footerSlot })
      const footer = wrapper.find('.ui-textarea__footer')

      expect(wrapper.classes()).toContain('ui-textarea--composer')
      expect(footer.exists()).toBe(true)
      expect(wrapper.find('.ui-textarea__control').element.contains(footer.element)).toBe(true)
    })

    it('goes inert with a disabled field — no live buttons inside a dead box', async () => {
      const wrapper = await mount({ disabled: true }, { footer: footerSlot })
      const footer = wrapper.find('.ui-textarea__footer')

      expect(footer.attributes('inert')).toBeDefined()
      expect(footer.classes()).toContain('ui-textarea__footer--inactive')
    })

    it('goes inert with a read-only field too', async () => {
      const wrapper = await mount({ readonly: true }, { footer: footerSlot })

      expect(wrapper.find('.ui-textarea__footer').attributes('inert')).toBeDefined()
    })

    it('stays live while the field is editable', async () => {
      const wrapper = await mount({}, { footer: footerSlot })
      const footer = wrapper.find('.ui-textarea__footer')

      expect(footer.attributes('inert')).toBeUndefined()
      expect(footer.classes()).not.toContain('ui-textarea__footer--inactive')
    })

    it('splits the footer into leading and trailing groups', async () => {
      const wrapper = await mountSuspended(MTextareaFooter, {
        slots: { start: () => 'tools', end: () => 'Submit' },
      })

      const groups = wrapper.findAll('.ui-textarea__footer-group')
      expect(groups).toHaveLength(2)
      expect(groups[0]!.text()).toBe('tools')
      expect(groups[1]!.text()).toBe('Submit')
      wrapper.unmount()
    })

    it('falls back to the default slot for the trailing group', async () => {
      const wrapper = await mountSuspended(MTextareaFooter, { slots: { default: () => 'Send' } })

      expect(wrapper.find('.ui-textarea__footer-group--end').text()).toBe('Send')
      wrapper.unmount()
    })

    it('stays out of the container when no footer is given', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-textarea--composer')
      expect(wrapper.find('.ui-textarea__footer').exists()).toBe(false)
    })
  })

  describe('adornments', () => {
    it('renders prepend and append inside the text box, not beside the container', async () => {
      const wrapper = await mount({}, { prepend: () => '@', append: () => '!' })
      const body = wrapper.find('.ui-textarea__body')

      expect(body.element.contains(wrapper.find('.ui-textarea__adornment--prepend').element)).toBe(true)
      expect(body.element.contains(wrapper.find('.ui-textarea__adornment--append').element)).toBe(true)
    })

    it('renders no adornment wrappers when the slots are unused', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-textarea__adornment')).toHaveLength(0)
    })
  })

  describe('growth modifiers', () => {
    it('flags auto-grow and its ceiling', async () => {
      const wrapper = await mount({ autoGrow: true, rows: 1, maxRows: 10 })

      expect(wrapper.classes()).toContain('ui-textarea--auto-grow')
      expect(wrapper.classes()).toContain('ui-textarea--capped')
      expect(wrapper.find('textarea').attributes('style')).toContain('--m-textarea-rows: 1')
      expect(wrapper.find('textarea').attributes('style')).toContain('--m-textarea-max-rows: 10')
    })

    it('stays uncapped without maxRows', async () => {
      const wrapper = await mount({ autoGrow: true })

      expect(wrapper.classes()).not.toContain('ui-textarea--capped')
      expect(wrapper.find('textarea').attributes('style')).not.toContain('--m-textarea-max-rows')
    })

    it('renders the grip only when resizable', async () => {
      const fixed = await mount()
      expect(fixed.find('.ui-textarea__grip').exists()).toBe(false)

      const free = await mount({ resizable: true })
      expect(free.classes()).toContain('ui-textarea--resizable')
      expect(free.find('.ui-textarea__grip').exists()).toBe(true)
    })
  })

  describe('state modifiers', () => {
    it('reflects populated, disabled and readonly on the root', async () => {
      const wrapper = await mount({ modelValue: 'text', disabled: true, readonly: true })

      expect(wrapper.classes()).toContain('ui-textarea--populated')
      expect(wrapper.classes()).toContain('ui-textarea--disabled')
      expect(wrapper.classes()).toContain('ui-textarea--readonly')
    })

    it('marks an editable field interactive, so hover chrome applies to it alone', async () => {
      const editable = await mount()
      expect(editable.classes()).toContain('ui-textarea--interactive')

      const disabled = await mount({ disabled: true })
      expect(disabled.classes()).not.toContain('ui-textarea--interactive')

      const readonly = await mount({ readonly: true })
      expect(readonly.classes()).not.toContain('ui-textarea--interactive')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ modelValue: 'text', error: true })

      expect(wrapper.attributes('data-error')).toBeUndefined()
      expect(wrapper.attributes('data-populated')).toBeUndefined()
    })
  })

  describe('label placement', () => {
    it('defaults to top, the placement this field shipped with', async () => {
      const wrapper = await mount({ label: 'Name' })

      expect(wrapper.classes()).toContain('ui-textarea--label-top')
    })

    it.each(['top', 'float', 'inset', 'hidden'] as const)('carries %s on the root, independent of the shape', async (placement) => {
      const wrapper = await mount({ label: 'Name', labelPlacement: placement, variant: 'outlined' })

      expect(wrapper.classes()).toContain(`ui-textarea--label-${placement}`)
      expect(wrapper.classes()).toContain('ui-textarea--outlined')
    })

    it('keeps a hidden label in the document, and keeps it associated', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })
      const label = wrapper.find('label.ui-textarea__label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('for')).toBe(wrapper.find('textarea').attributes('id'))
    })

    it('renders no label element at all when there is no label to place', async () => {
      const wrapper = await mount({ labelPlacement: 'top' })

      expect(wrapper.find('label.ui-textarea__label').exists()).toBe(false)
    })

    it('has no density axis — a box that is `rows` tall has no height to scale', async () => {
      const wrapper = await mount()

      expect(wrapper.classes().some(name => name.startsWith('ui-textarea--density'))).toBe(false)
    })
  })
})
