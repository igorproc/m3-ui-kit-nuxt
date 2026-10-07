import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MButtonGroup from './index.vue'

const periods = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
]

describe('m-button-group', () => {
  it('renders one MButton per item and nothing for an empty list', async () => {
    const filled = await mountSuspended(MButtonGroup, { props: { items: periods } })
    expect(filled.findAll('button.ui-button.ui-button-group__item')).toHaveLength(3)

    const empty = await mountSuspended(MButtonGroup)
    expect(empty.find('.ui-button-group').exists()).toBe(false)
  })

  it('is a radio group for a single choice and selects on click', async () => {
    const wrapper = await mountSuspended(MButtonGroup, { props: { items: periods, modelValue: 'day' } })
    const buttons = wrapper.findAll('button')

    expect(wrapper.find('.ui-button-group').attributes('role')).toBe('radiogroup')
    expect(buttons[0]!.attributes()).toMatchObject({ 'role': 'radio', 'aria-checked': 'true' })
    expect(buttons[0]!.attributes('aria-pressed')).toBeUndefined()

    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['week']])
  })

  it('wears the toggle look of MButton on each button', async () => {
    const wrapper = await mountSuspended(MButtonGroup, { props: { items: periods, modelValue: 'day', variant: 'tonal' } })
    const [selected, unselected] = wrapper.findAll('button')

    expect(selected!.classes()).toEqual(expect.arrayContaining(['ui-button--tonal', 'ui-button--selected']))
    expect(unselected!.classes()).toContain('ui-button--unselected')
  })

  it('moves a button to its selected pill on a spring', async () => {
    const wrapper = await mountSuspended(MButtonGroup, { props: { items: periods, modelValue: 'day' } })

    expect((wrapper.find('button').element as HTMLElement).style.transition).toContain('border-radius')
  })

  it('toggles values with aria-pressed in multiple mode', async () => {
    const wrapper = await mountSuspended(MButtonGroup, {
      props: { items: periods, modelValue: ['day'], multiple: true },
    })
    const buttons = wrapper.findAll('button')

    expect(wrapper.find('.ui-button-group').attributes('role')).toBe('group')
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')

    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[['day', 'week']]])
  })

  it('disables an item and the whole group', async () => {
    const one = await mountSuspended(MButtonGroup, { props: { items: periods } })
    expect(one.findAll('button')[2]!.attributes('disabled')).toBeDefined()

    const all = await mountSuspended(MButtonGroup, { props: { items: periods, disabled: true } })
    expect(all.findAll('button').every(button => button.attributes('disabled') !== undefined)).toBe(true)
  })

  it('passes density and the colour role to every button', async () => {
    const wrapper = await mountSuspended(MButtonGroup, { props: { items: periods, density: 'compact', color: 'tertiary' } })

    for (const button of wrapper.findAll('button')) {
      expect(button.classes()).toEqual(expect.arrayContaining(['ui-button--compact', 'ui-button--tertiary']))
    }
  })

  it('names an icon-only button from its item', async () => {
    const wrapper = await mountSuspended(MButtonGroup, {
      props: { items: [{ value: 'grid', icon: 'ic:outline-dashboard', ariaLabel: 'Grid' }] },
    })

    expect(wrapper.find('button').attributes('aria-label')).toBe('Grid')
    expect(wrapper.find('button').classes()).toContain('ui-button--icon-only')
  })
})
