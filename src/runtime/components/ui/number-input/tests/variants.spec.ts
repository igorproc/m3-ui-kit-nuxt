import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import MNumberInput from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MNumberInput, { props, slots })

  return current as Awaited<ReturnType<typeof mountSuspended>>
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-number-input · variants', () => {
  describe('shape', () => {
    it.each(['filled', 'outlined'] as const)('renders the %s container', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.classes()).toContain(`ui-number-input--${variant}`)
      expect(wrapper.find('.ui-number-input__control').exists()).toBe(true)
    })

    it('defaults to filled and to the small radius tier', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-number-input--filled')
      expect(wrapper.classes()).toContain('ui-number-input--small')
    })

    it('maps the rounded prop onto its own modifier', async () => {
      const wrapper = await mount({ rounded: 'pill' })

      expect(wrapper.classes()).toContain('ui-number-input--pill')
    })

    it('drops the shape a value flanked by stepper zones cannot carry', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-number-input--underline')
      expect(wrapper.classes()).not.toContain('ui-number-input--ghost')
    })
  })

  describe('label', () => {
    it('overlays the label on the container, as the text field does', async () => {
      const wrapper = await mount({ label: 'Width' })
      const label = wrapper.find('label.ui-number-input__label')

      expect(label.text()).toContain('Width')
      expect(wrapper.find('.ui-number-input__control').element.contains(label.element)).toBe(false)
    })

    it('marks a required field in the label', async () => {
      const wrapper = await mount({ label: 'Width', required: true })

      expect(wrapper.find('.ui-number-input__required').exists()).toBe(true)
    })

    it('renders no label element when there is no label', async () => {
      const wrapper = await mount()

      expect(wrapper.find('label.ui-number-input__label').exists()).toBe(false)
    })

    it('raises the label once a value is present', async () => {
      const empty = await mount({ label: 'Width' })
      expect(empty.classes()).not.toContain('ui-number-input--populated')

      const filled = await mount({ label: 'Width', modelValue: 12 })
      expect(filled.classes()).toContain('ui-number-input--populated')
    })
  })

  describe('controls', () => {
    it('defaults to the split stepper, one zone at each edge', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-number-input--split')
      expect(wrapper.findAll('.ui-number-input__stepper')).toHaveLength(2)
      expect(wrapper.find('.ui-number-input__stacked').exists()).toBe(false)
    })

    it('collects the arrows into one trailing column when stacked', async () => {
      const wrapper = await mount({ controls: 'stacked' })
      const stacked = wrapper.find('.ui-number-input__stacked')

      expect(wrapper.classes()).toContain('ui-number-input--stacked')
      expect(stacked.exists()).toBe(true)
      expect(stacked.findAll('.ui-number-input__stepper')).toHaveLength(2)
    })

    it('renders no stepper at all when controls are off', async () => {
      const wrapper = await mount({ controls: false })

      expect(wrapper.findAll('.ui-number-input__stepper')).toHaveLength(0)
      expect(wrapper.classes()).not.toContain('ui-number-input--split')
      expect(wrapper.classes()).not.toContain('ui-number-input--stacked')
    })

    it('keeps the stepper zones inside the container, not beside it', async () => {
      const wrapper = await mount()
      const control = wrapper.find('.ui-number-input__control').element

      for (const stepper of wrapper.findAll('.ui-number-input__stepper')) {
        expect(control.contains(stepper.element)).toBe(true)
      }
    })

    it.each(['split', 'stacked'] as const)('lets a consumer replace the %s controls', async (controls) => {
      const wrapper = await mount({ controls }, {
        increment: () => h('button', { type: 'button', class: 'custom-up' }, '+'),
        decrement: () => h('button', { type: 'button', class: 'custom-down' }, '-'),
      })

      expect(wrapper.find('.custom-up').exists()).toBe(true)
      expect(wrapper.find('.custom-down').exists()).toBe(true)
      expect(wrapper.findAll('.ui-number-input__stepper')).toHaveLength(0)
    })

    it('hands the slot the next value it would produce', async () => {
      const wrapper = await mount(
        { modelValue: 4, step: 2 },
        { increment: (scope: { nextValue: number }) => h('span', { class: 'peek' }, String(scope.nextValue)) },
      )

      expect(wrapper.find('.peek').text()).toBe('6')
    })
  })

  describe('unit', () => {
    it('renders the unit inside the container, as a zone of its own', async () => {
      const wrapper = await mount({ unit: 'MiB', modelValue: 512 })
      const unit = wrapper.find('.ui-number-input__unit')

      expect(unit.text()).toBe('MiB')
      expect(wrapper.classes()).toContain('ui-number-input--unit')
      expect(wrapper.find('.ui-number-input__control').element.contains(unit.element)).toBe(true)
    })

    it('renders no unit zone without a unit', async () => {
      const wrapper = await mount({ modelValue: 512 })

      expect(wrapper.find('.ui-number-input__unit').exists()).toBe(false)
    })

    it('lets a consumer take over the unit slot', async () => {
      const wrapper = await mount({ unit: 'MiB' }, { unit: () => h('button', { type: 'button' }, 'MiB') })

      expect(wrapper.find('.ui-number-input__unit button').text()).toBe('MiB')
    })
  })

  describe('scrub', () => {
    it('moves the label into the box and makes it the handle', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W', modelValue: 240 })
      const handle = wrapper.find('.ui-number-input__scrub')

      expect(wrapper.classes()).toContain('ui-number-input--scrub')
      expect(handle.text()).toBe('W')
      expect(wrapper.find('.ui-number-input__control').element.contains(handle.element)).toBe(true)
    })

    it('leaves no floating label behind — one label, not two', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'W' })

      expect(wrapper.find('label.ui-number-input__label').exists()).toBe(false)
      expect(wrapper.findAll('label')).toHaveLength(1)
    })

    it('renders no handle without a label to hang it on', async () => {
      const wrapper = await mount({ controls: 'scrub' })

      expect(wrapper.find('.ui-number-input__scrub').exists()).toBe(false)
    })

    it('lets a consumer replace the handle content', async () => {
      const wrapper = await mount({ controls: 'scrub', label: 'Width' }, { scrub: () => '↔' })

      expect(wrapper.find('.ui-number-input__scrub').text()).toBe('↔')
    })

    it('stays off by default', async () => {
      const wrapper = await mount({ label: 'W' })

      expect(wrapper.classes()).not.toContain('ui-number-input--scrub')
      expect(wrapper.find('.ui-number-input__scrub').exists()).toBe(false)
    })
  })

  describe('adornments', () => {
    it('renders prepend and append inside the value row', async () => {
      const wrapper = await mount({}, { prepend: () => '$', append: () => '%' })
      const body = wrapper.find('.ui-number-input__body').element

      expect(body.contains(wrapper.find('.ui-number-input__adornment--prepend').element)).toBe(true)
      expect(body.contains(wrapper.find('.ui-number-input__adornment--append').element)).toBe(true)
    })

    it('renders no adornment wrappers when the slots are unused', async () => {
      const wrapper = await mount()

      expect(wrapper.findAll('.ui-number-input__adornment')).toHaveLength(0)
    })
  })

  describe('support line', () => {
    it('shows helper text and swaps it for the error message', async () => {
      const helper = await mount({ helperText: 'Pixels' })
      expect(helper.find('.ui-number-input__support').text()).toBe('Pixels')

      const invalid = await mount({ helperText: 'Pixels', errorMessage: 'Out of range' })
      expect(invalid.find('.ui-number-input__support').text()).toBe('Out of range')
    })

    it('renders nothing when there is nothing to say', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-number-input__support').exists()).toBe(false)
    })

    it('marks the invalid state on the root', async () => {
      const valid = await mount({ helperText: 'Pixels' })
      expect(valid.classes()).not.toContain('ui-number-input--error')

      const invalid = await mount({ errorMessage: 'Out of range' })
      expect(invalid.classes()).toContain('ui-number-input--error')
    })

    it('lets a consumer replace helper and error content', async () => {
      const wrapper = await mount(
        { errorMessage: 'Out of range' },
        { error: (scope: { message: string }) => `custom: ${scope.message}` },
      )

      expect(wrapper.find('.ui-number-input__support').text()).toContain('custom: Out of range')
    })
  })

  describe('state modifiers', () => {
    it('reflects disabled and readonly on the root', async () => {
      const wrapper = await mount({ modelValue: 3, disabled: true, readonly: true })

      expect(wrapper.classes()).toContain('ui-number-input--disabled')
      expect(wrapper.classes()).toContain('ui-number-input--readonly')
    })

    it('marks an editable field interactive, so hover chrome applies to it alone', async () => {
      const editable = await mount()
      expect(editable.classes()).toContain('ui-number-input--interactive')

      const disabled = await mount({ disabled: true })
      expect(disabled.classes()).not.toContain('ui-number-input--interactive')

      const readonly = await mount({ readonly: true })
      expect(readonly.classes()).not.toContain('ui-number-input--interactive')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ modelValue: 3, error: true })

      expect(wrapper.attributes('data-error')).toBeUndefined()
      expect(wrapper.attributes('data-populated')).toBeUndefined()
      expect(wrapper.attributes('data-focused')).toBeUndefined()
    })
  })

  describe('label placement', () => {
    it('defaults to float, the placement this field shipped with', async () => {
      const wrapper = await mount({ label: 'Name' })

      expect(wrapper.classes()).toContain('ui-number-input--label-float')
    })

    it.each(['top', 'float', 'inset', 'hidden'] as const)('carries %s on the root, independent of the shape', async (placement) => {
      const wrapper = await mount({ label: 'Name', labelPlacement: placement, variant: 'outlined' })

      expect(wrapper.classes()).toContain(`ui-number-input--label-${placement}`)
      expect(wrapper.classes()).toContain('ui-number-input--outlined')
    })

    it('keeps a hidden label in the document, and keeps it associated', async () => {
      const wrapper = await mount({ label: 'Search', labelPlacement: 'hidden' })
      const label = wrapper.find('label.ui-number-input__label')

      expect(label.exists()).toBe(true)
      expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    })

    it('renders no label element at all when there is no label to place', async () => {
      const wrapper = await mount({ labelPlacement: 'top' })

      expect(wrapper.find('label.ui-number-input__label').exists()).toBe(false)
    })
  })

  describe('density', () => {
    it('defaults to the scale this field shipped with', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).toContain('ui-number-input--density-default')
    })

    it.each(['compact', 'default', 'comfortable'] as const)('carries %s on the root', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.classes()).toContain(`ui-number-input--density-${density}`)
    })

    it('is independent of placement — the two axes never collapse into one', async () => {
      const wrapper = await mount({ label: 'Name', density: 'compact', labelPlacement: 'inset' })

      expect(wrapper.classes()).toContain('ui-number-input--density-compact')
      expect(wrapper.classes()).toContain('ui-number-input--label-inset')
    })
  })
})
