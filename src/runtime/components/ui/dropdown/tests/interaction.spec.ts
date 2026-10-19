import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import { base, chips, createHost, destroyHost, input, mount, open, optionByText, options, press } from './helpers'

beforeEach(createHost)
afterEach(destroyHost)

describe('m-dropdown · interaction', () => {
  it('toggles the panel when the box is clicked', async () => {
    const wrapper = await mount(base)

    await wrapper.find('.ui-text-field__control').trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(true)

    await wrapper.find('.ui-text-field__control').trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('opens once from the field frame between the box and its support line', async () => {
    const wrapper = await mount(base)

    await wrapper.find('.ui-dropdown__field').trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(true)
  })

  it('does not toggle from the support line under the box', async () => {
    const wrapper = await mount({ ...base, helperText: 'Picked fresh every morning' })

    await wrapper.find('.ui-text-field__support').trigger('click')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('selects on click, writes the model and closes (single)', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('shows the selected title in the field', async () => {
    const wrapper = await mount({ ...base, modelValue: 3 })

    expect((input(wrapper).element as HTMLInputElement).value).toBe('Gamma')
  })

  it('ignores a disabled option', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    optionByText('Beta')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('accumulates values and keeps the panel open in multiple mode', async () => {
    const wrapper = await mount({ ...base, multiple: true })
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()
    optionByText('Gamma')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1, 3]])
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(true)
  })

  it('deselects a selected value on a second click', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1] })
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('renders a chip per selected value and removes one on click', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    expect(chips(wrapper)).toHaveLength(2)
    await chips(wrapper)[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[3]])
  })

  it('walks the rows with the arrows and picks with Enter', async () => {
    const wrapper = await mount(base)
    await open(wrapper) // ArrowDown opens, landing on the first row

    await press(wrapper, 'ArrowDown') // Beta is disabled, so this lands on Gamma
    await press(wrapper, 'Enter')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
  })

  it('jumps to the ends with Home and End', async () => {
    const wrapper = await mount(base)
    await open(wrapper)

    await press(wrapper, 'End')
    await press(wrapper, 'Enter')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([3])
  })

  it('opens on the current value rather than on the first row', async () => {
    const wrapper = await mount({ ...base, modelValue: 3 })
    await open(wrapper)

    const active = input(wrapper).attributes('aria-activedescendant')
    expect(optionByText('Gamma')!.id).toBe(active)
  })

  it('closes on Escape and on Tab', async () => {
    const wrapper = await mount(base)

    await open(wrapper)
    await press(wrapper, 'Escape')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)

    await open(wrapper)
    await press(wrapper, 'Tab')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('chooses the active row with Space, which a select does not type', async () => {
    const wrapper = await mount(base)

    await press(wrapper, ' ')
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(true)

    await press(wrapper, ' ')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1])
  })

  it('does not open when disabled or readonly', async () => {
    const disabled = await mount({ ...base, disabled: true })
    await disabled.find('.ui-text-field__control').trigger('click')
    expect(disabled.find('.ui-dropdown--open').exists()).toBe(false)

    const readonly = await mount({ ...base, readonly: true })
    await readonly.find('.ui-text-field__control').trigger('click')
    expect(readonly.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('stops selecting once max is reached and skips the blocked rows', async () => {
    const wrapper = await mount({ ...base, multiple: true, max: 1 })
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()
    optionByText('Gamma')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])

    // Only the selected row is still reachable, so the arrows stay on it.
    await press(wrapper, 'ArrowDown')
    expect(input(wrapper).attributes('aria-activedescendant')).toBe(optionByText('Alpha')!.id)
  })

  it('keeps the last value when mandatory', async () => {
    const wrapper = await mount({ ...base, multiple: true, mandatory: true, modelValue: [1] })
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('clears the selection through the clear control', async () => {
    const wrapper = await mount({ ...base, clearable: true, modelValue: 1 })

    const clear = wrapper.find('.ui-dropdown__clear')
    expect(clear.exists()).toBe(true)

    await clear.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(wrapper.emitted('clear')).toBeTruthy()
    // Clearing must not double as opening the panel.
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })

  it('clears the value with Backspace in single mode', async () => {
    const wrapper = await mount({ ...base, modelValue: 1 })

    await press(wrapper, 'Backspace')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('clears with Delete as well, and never against mandatory', async () => {
    const wrapper = await mount({ ...base, modelValue: 1 })
    await press(wrapper, 'Delete')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])

    const locked = await mount({ ...base, mandatory: true, modelValue: 1 })
    await press(locked, 'Backspace')
    expect(locked.emitted('update:modelValue')).toBeFalsy()
  })

  it('says nothing on Backspace when there is nothing to clear', async () => {
    const wrapper = await mount(base)

    await press(wrapper, 'Backspace')
    expect(wrapper.emitted('clear')).toBeFalsy()
  })

  it('focuses the input whenever the panel opens', async () => {
    // The click can land on the box, the label or the arrow — none focusable.
    const wrapper = await mount(base, true)

    await wrapper.find('.ui-text-field__control').trigger('click')
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(input(wrapper).element)
  })

  it('keeps focus in the field after picking with the mouse', async () => {
    // The panel swallows mousedown, so the field stays focused and keeps
    // showing it — a value that was just chosen should not read as inert.
    const wrapper = await mount(base, true)
    await open(wrapper)

    optionByText('Alpha')!.click()
    await nextTick()

    expect(document.activeElement).toBe(input(wrapper).element)
  })

  it('offers no clear control when mandatory or when nothing is selected', async () => {
    const empty = await mount({ ...base, clearable: true })
    expect(empty.find('.ui-dropdown__clear').exists()).toBe(false)

    const locked = await mount({ ...base, clearable: true, mandatory: true, modelValue: 1 })
    expect(locked.find('.ui-dropdown__clear').exists()).toBe(false)
  })

  it('walks into the chips with ArrowLeft and deletes the focused one', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    await press(wrapper, 'ArrowLeft')
    expect(chips(wrapper)[1]!.classes()).toContain('ui-dropdown__chip--active')

    await press(wrapper, 'Backspace')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])
  })

  it('deletes the last chip on a bare Backspace', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    await press(wrapper, 'Backspace')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])
  })

  it('keeps a read-only selection readable and untouchable', async () => {
    const wrapper = await mount({ ...base, multiple: true, clearable: true, readonly: true, modelValue: [1, 3], messages: { clear: 'Clear' } })

    // The value is read in full ink: no chip is dimmed, none offers removal.
    expect(chips(wrapper).every((chip: { classes: () => string[] }) => !chip.classes().includes('ui-chip--disabled'))).toBe(true)
    expect(wrapper.findAll('.ui-dropdown__chip .ui-chip__trailing')).toHaveLength(0)
    await chips(wrapper)[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    // The clear control stays where it is, off, as in MFileUpload.
    expect(wrapper.find('.ui-dropdown__clear').attributes('disabled')).toBeDefined()
  })

  it('moves the virtual focus under the pointer without scrolling the list', async () => {
    const scrolled = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrolled
    try {
      const wrapper = await mount(base)
      await open(wrapper)
      await nextTick()
      scrolled.mockClear()

      optionByText('Gamma')!.dispatchEvent(new Event('pointermove'))
      await nextTick()
      expect(input(wrapper).attributes('aria-activedescendant')).toBe(optionByText('Gamma')!.id)
      expect(scrolled).not.toHaveBeenCalled()

      await press(wrapper, 'Home')
      await nextTick()
      expect(scrolled).toHaveBeenCalled()
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })

  it('emits open and close alongside the panel model', async () => {
    const wrapper = await mount(base)

    await open(wrapper)
    expect(wrapper.emitted('open')).toBeTruthy()

    await press(wrapper, 'Escape')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('keeps the chips out of the tab order: the arrows reach them from the input', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    expect(chips(wrapper).map((chip: { attributes: (name: string) => string | undefined }) => chip.attributes('tabindex'))).toEqual(['-1', '-1'])
  })

  it('leaves keys on the clear control to the button: Enter clears, it does not open', async () => {
    const wrapper = await mount({ ...base, clearable: true, modelValue: 1, messages: { clear: 'Clear' } }, true)
    const clear = wrapper.find('.ui-dropdown__clear')

    await clear.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)

    await clear.trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
    // The button leaves with the value; focus goes back to the field.
    expect(document.activeElement).toBe(input(wrapper).element)
  })

  it('does not handle a keystroke twice when it starts on the input', async () => {
    const wrapper = await mount({ ...base, multiple: true, modelValue: [1, 3] })

    // One Backspace, one removal — not two, which is what a second handler on
    // the root would produce.
    await press(wrapper, 'Backspace')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[1]])
  })

  it('anchors the panel to the drawn box, not to the box plus its support line', async () => {
    const wrapper = await mount({ ...base, helperText: 'Reviewers are notified' })

    const menu = wrapper.findComponent(MMenu)
    const control = wrapper.find('.ui-text-field__control').element

    // The root's box also holds the support line; anchoring to it is what put
    // the panel a helper-text's height below the field.
    expect(menu.props('anchor')).toBe(control)
    expect(menu.props('anchor')).not.toBe(wrapper.find('.ui-dropdown').element)
  })

  it('renders nothing but the empty state when there are no items', async () => {
    const wrapper = await mount({ items: [], messages: { empty: 'Nothing to choose' } })
    await open(wrapper)

    expect(options()).toHaveLength(0)
    expect(document.querySelector('.ui-dropdown-panel__state')?.textContent).toContain('Nothing to choose')
  })

  it('does not open onto nothing: no rows, no message, no slot', async () => {
    const wrapper = await mount({ items: [] })
    await open(wrapper)

    expect(wrapper.find('.ui-dropdown--open').exists()).toBe(false)
  })
})
