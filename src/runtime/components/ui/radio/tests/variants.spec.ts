import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { MRadio, MRadioGroup, mount, mountGroup, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-radio · variants', () => {
  describe('anatomy', () => {
    it('draws a ring and a dot over a native radio carrying its value', async () => {
      const wrapper = await mount({ value: 'a' })
      const input = wrapper.find('input.ui-radio__input')

      expect(wrapper.classes()).toContain('ui-radio')
      expect(input.attributes('type')).toBe('radio')
      expect(input.attributes('value')).toBe('a')
      expect(wrapper.find('.ui-radio__control .ui-radio__outer').exists()).toBe(true)
      expect(wrapper.find('.ui-radio__control .ui-radio__inner').exists()).toBe(true)
      expect(wrapper.find('.ui-radio__state-layer').exists()).toBe(true)
    })

    it('keeps a numeric value', async () => {
      const wrapper = await mount({ value: 2 })

      expect(wrapper.find('input').attributes('value')).toBe('2')
    })
  })

  describe('value', () => {
    it.each([
      ['a', true],
      ['b', false],
      [undefined, false],
    ])('model %s on the radio of "a" → checked %s', async (modelValue, checked) => {
      const wrapper = await mount({ value: 'a', modelValue })

      expect(wrapper.classes().includes('ui-radio--checked')).toBe(checked)
      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(checked)
    })
  })

  describe('label', () => {
    it('renders the label prop as the text beside the ring', async () => {
      const wrapper = await mount({ label: 'Express delivery' })

      expect(wrapper.find('.ui-radio__label').text()).toBe('Express delivery')
    })

    it('lets the default slot replace the label text', async () => {
      const wrapper = await mount({ label: 'Express' }, { default: () => 'Express delivery' })

      expect(wrapper.find('.ui-radio__label').text()).toBe('Express delivery')
    })

    it('renders the default slot without a label prop', async () => {
      const wrapper = await mount({}, { default: () => 'Express delivery' })

      expect(wrapper.find('.ui-radio__label').text()).toBe('Express delivery')
    })

    it('renders no label element with neither a label nor a slot', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-radio__label').exists()).toBe(false)
    })
  })

  describe('support line', () => {
    // Decision 2026-10-19: reserved only when something can appear in it.
    it('renders no line when nothing can appear in it', async () => {
      const wrapper = await mount({ label: 'A' })

      expect(wrapper.find('.ui-radio__support').exists()).toBe(false)
    })

    it('reserves an empty line when an error is bound but empty', async () => {
      const wrapper = await mount({ label: 'A', errorMessage: undefined })

      expect(wrapper.find('.ui-radio__support').text()).toBe('')
    })

    it('shows helper text and swaps it for the error message', async () => {
      const helper = await mount({ label: 'A', helperText: 'Arrives tomorrow' })
      expect(helper.find('.ui-radio__support').text()).toBe('Arrives tomorrow')

      const invalid = await mount({ label: 'A', helperText: 'Arrives tomorrow', errorMessage: 'Not available' })
      expect(invalid.find('.ui-radio__support').text()).toBe('Not available')
    })

    it('shows a standalone field error in the line', async () => {
      const { adapter } = stubAdapter(undefined, 'Choose a delivery')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadio, { value: 'a', path: 'delivery', label: 'A' }))

      expect(wrapper.find('.ui-radio__support').text()).toBe('Choose a delivery')
    })

    it('keeps the line out of the label, so its text neither names nor selects the radio', async () => {
      const wrapper = await mount({ label: 'A', helperText: 'Arrives tomorrow' })

      expect(wrapper.find('label').element.contains(wrapper.find('.ui-radio__support').element)).toBe(false)
    })

    it('leaves a grouped radio without a line of its own — the group owns it', async () => {
      const { wrapper } = await mountGroup({ path: undefined, helperText: 'Pick one' }, ['a', 'b'])

      expect(wrapper.findAll('.ui-radio__support')).toHaveLength(0)
      expect(wrapper.findAll('.ui-radio-group__support')).toHaveLength(1)
    })
  })

  describe('state modifiers', () => {
    it('marks the root and the native control disabled', async () => {
      const wrapper = await mount({ disabled: true })

      expect(wrapper.classes()).toContain('ui-radio--disabled')
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('takes the error modifier from a standalone field error', async () => {
      const { adapter } = stubAdapter(undefined, 'Choose a delivery')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadio, { value: 'a', path: 'delivery' }))

      expect(wrapper.find('.ui-radio').classes()).toContain('ui-radio--error')
    })

    it.each([
      [{ errorMessage: 'Not available' }],
      [{ error: true }],
    ])('takes the error modifier from %o', async (props) => {
      const wrapper = await mount(props)

      expect(wrapper.classes()).toContain('ui-radio--error')
    })

    it('exposes no data-state attributes — state is carried by BEM classes', async () => {
      const wrapper = await mount({ modelValue: 'a', disabled: true })
      const names = [wrapper.element, ...wrapper.element.querySelectorAll('*')]
        .flatMap(el => [...el.attributes].map(attribute => attribute.name))

      expect(names.filter(name => name.startsWith('data-'))).toEqual([])
    })
  })

  describe('form', () => {
    it('posts under its own name when standalone', async () => {
      const wrapper = await mount({ name: 'delivery' })

      expect(wrapper.find('input').attributes('name')).toBe('delivery')
    })

    it('falls back to the path for its name, so standalone radios of one field group natively', async () => {
      const wrapper = await mount({ path: 'delivery' })

      expect(wrapper.find('input').attributes('name')).toBe('delivery')
    })
  })

  describe('fallthrough attributes', () => {
    it('keeps class and style on the root and hands the rest to the native control', async () => {
      const wrapper = await mount({ 'class': 'consumer', 'style': 'margin: 4px', 'aria-describedby': 'hint', 'data-test': 'a' })
      const input = wrapper.find('input')

      expect(wrapper.classes()).toContain('consumer')
      expect(wrapper.attributes('style')).toContain('margin')
      expect(input.attributes('aria-describedby')).toBe('hint')
      expect(input.attributes('data-test')).toBe('a')
    })
  })
})

describe('m-radio-group · variants', () => {
  it('wraps its radios in one group element', async () => {
    const { wrapper } = await mountGroup()

    expect(wrapper.find('.ui-radio-group').exists()).toBe(true)
    expect(wrapper.findAll('.ui-radio-group input.ui-radio__input')).toHaveLength(3)
  })

  it('checks the radio matching a preset model at mount', async () => {
    const { wrapper } = await mountGroup({ modelValue: 'b' })
    const checked = wrapper.findAll('input').map(input => (input.element as HTMLInputElement).checked)

    expect(checked).toEqual([false, true, false])
    expect(wrapper.findAll('.ui-radio')[1]!.classes()).toContain('ui-radio--checked')
  })

  it('shares a generated name across its radios', async () => {
    const { wrapper } = await mountGroup()
    const names = wrapper.findAll('input').map(input => input.attributes('name'))

    expect(names[0]).toBeTruthy()
    expect(new Set(names).size).toBe(1)
  })

  it('takes its name prop over the generated one and over a radio of its own', async () => {
    const { wrapper } = await mountGroup({ name: 'delivery' }, ['a', { value: 'b', name: 'other' }])

    expect(wrapper.findAll('input').map(input => input.attributes('name'))).toEqual(['delivery', 'delivery'])
  })

  describe('support line', () => {
    it('renders no line when nothing can appear in it', async () => {
      const { wrapper } = await mountGroup()

      expect(wrapper.find('.ui-radio-group__support').exists()).toBe(false)
    })

    it('shows helper text under the group and swaps it for the error', async () => {
      const helper = await mountGroup({ helperText: 'Pick one' })
      expect(helper.wrapper.find('.ui-radio-group__support').text()).toBe('Pick one')

      const invalid = await mountGroup({ helperText: 'Pick one', errorMessage: 'Choose a delivery' })
      expect(invalid.wrapper.find('.ui-radio-group__support').text()).toBe('Choose a delivery')
    })

    it('shows the group field error in the line', async () => {
      const { adapter } = stubAdapter(undefined, 'Choose a delivery')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadioGroup, { path: 'delivery' }, () => [h(MRadio, { value: 'a' })]))

      expect(wrapper.find('.ui-radio-group__support').text()).toBe('Choose a delivery')
    })
  })

  it('marks its radios as grouped, so each row is the 48 target tall', async () => {
    const { wrapper } = await mountGroup()

    expect(wrapper.findAll('.ui-radio').every(radio => radio.classes().includes('ui-radio--grouped'))).toBe(true)
  })

  it('leaves a standalone radio ungrouped', async () => {
    const wrapper = await mount()

    expect(wrapper.classes()).not.toContain('ui-radio--grouped')
  })

  it('renders no group label without one', async () => {
    const { wrapper } = await mountGroup()

    expect(wrapper.find('.ui-radio-group__label').exists()).toBe(false)
  })

  it('paints every radio with the group error', async () => {
    const { wrapper } = await mountGroup({ errorMessage: 'Choose a delivery' })

    expect(wrapper.findAll('.ui-radio').every(radio => radio.classes().includes('ui-radio--error'))).toBe(true)
  })

  it('leaves the radios unpainted while the group is valid', async () => {
    const { wrapper } = await mountGroup({ helperText: 'Pick one' })

    expect(wrapper.findAll('.ui-radio').some(radio => radio.classes().includes('ui-radio--error'))).toBe(false)
  })

  it('disables every radio with the group, and one radio on its own', async () => {
    const { wrapper } = await mountGroup({ disabled: true })
    expect(wrapper.findAll('input').every(input => input.attributes('disabled') !== undefined)).toBe(true)

    const single = await mountGroup({}, ['a', { value: 'b', disabled: true }])
    const disabled = single.wrapper.findAll('input').map(input => input.attributes('disabled') !== undefined)
    expect(disabled).toEqual([false, true])
  })
})
