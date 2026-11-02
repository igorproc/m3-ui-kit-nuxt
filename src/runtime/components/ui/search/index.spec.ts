import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSearch from './index.vue'

const messages = { clear: 'Clear search' }

describe('m-search · bar', () => {
  it('renders a bar with a type="search" input and the search glyph in front', async () => {
    const wrapper = await mountSuspended(MSearch)

    const input = wrapper.find('.ui-search__bar input.ui-search__input')

    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('search')
    expect(wrapper.find('.ui-search__leading .ui-icon').exists()).toBe(true)
  })

  it('forwards placeholder and aria-label', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { placeholder: 'Find', ariaLabel: 'Find products' },
    })

    const input = wrapper.find('input.ui-search__input')

    expect(input.attributes('placeholder')).toBe('Find')
    expect(input.attributes('aria-label')).toBe('Find products')
  })

  it('ships no copy of its own: no placeholder, no name, no clear-button name', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'abc' } })

    expect(wrapper.find('input').attributes('placeholder')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-label')).toBeUndefined()
    expect(wrapper.find('.ui-search__clear').attributes('aria-label')).toBeUndefined()
  })

  it('updates v-model on input', async () => {
    const wrapper = await mountSuspended(MSearch)

    await wrapper.find('input.ui-search__input').setValue('query')

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['query'])
  })

  it('submits the query on Enter', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'nuxt' } })

    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')!.at(-1)).toEqual(['nuxt'])
  })

  it('does not submit the Enter that confirms an IME candidate', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'にほん' } })

    await wrapper.find('input').trigger('keydown', { key: 'Enter', isComposing: true })
    await wrapper.find('input').trigger('keydown', { key: 'Enter', keyCode: 229 })

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('empties the query on Escape and says so; an empty bar lets Escape go on', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'abc', messages } })

    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)

    await wrapper.setProps({ modelValue: '' })
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('keeps the id the app gives it on the input', async () => {
    const wrapper = await mountSuspended(MSearch, { attrs: { id: 'archive-search' } })

    expect(wrapper.find('input').attributes('id')).toBe('archive-search')
  })

  it('clears the query with a named clear button and says so', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'abc', messages } })

    const clear = wrapper.find('button.ui-search__clear')
    expect(clear.attributes('aria-label')).toBe('Clear search')

    await clear.trigger('click')

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('has no clear button, and keeps no place for one, while there is nothing to clear', async () => {
    const wrapper = await mountSuspended(MSearch)

    expect(wrapper.find('.ui-search__clear').exists()).toBe(false)
  })

  it('disables the input, drops the clear button and marks the root when disabled', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { modelValue: 'abc', disabled: true } })

    expect(wrapper.find('input.ui-search__input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-search__clear').exists()).toBe(false)
    expect(wrapper.classes()).toContain('ui-search--disabled')
  })

  it('renders the leading, clear, trailing and avatar slots', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { modelValue: 'abc' },
      slots: {
        leading: () => 'L',
        clear: () => 'X',
        trailing: () => 'T',
        avatar: () => 'A',
      },
    })

    expect(wrapper.find('.ui-search__leading').text()).toBe('L')
    expect(wrapper.find('.ui-search__clear').text()).toBe('X')
    expect(wrapper.find('.ui-search__trailing').text()).toBe('T')
    expect(wrapper.find('.ui-search__avatar').text()).toBe('A')
  })

  it('renders no trailing or avatar box without their slots', async () => {
    const wrapper = await mountSuspended(MSearch)

    expect(wrapper.find('.ui-search__trailing').exists()).toBe(false)
    expect(wrapper.find('.ui-search__avatar').exists()).toBe(false)
  })

  it('lets the query run to the text edge only while no target closes the bar', async () => {
    const bare = await mountSuspended(MSearch)
    expect(bare.classes()).toContain('ui-search--text-end')

    const typed = await mountSuspended(MSearch, { props: { modelValue: 'abc' } })
    expect(typed.classes()).not.toContain('ui-search--text-end')

    const avatar = await mountSuspended(MSearch, { slots: { avatar: () => 'A' } })
    expect(avatar.classes()).not.toContain('ui-search--text-end')
  })

  it('wears the ring for keyboard focus only', async () => {
    const wrapper = await mountSuspended(MSearch)
    const input = wrapper.find('input')

    await input.trigger('focus')
    expect(wrapper.classes()).toContain('ui-search--keyboard')

    await input.trigger('blur')
    expect(wrapper.classes()).not.toContain('ui-search--keyboard')

    await input.trigger('pointerdown')
    await input.trigger('focus')
    expect(wrapper.classes()).not.toContain('ui-search--keyboard')
  })

  it('marks the density step on the root', async () => {
    const wrapper = await mountSuspended(MSearch, { props: { density: 'compact' } })

    expect(wrapper.classes()).toContain('ui-search--compact')
  })

  it('passes attributes to the input and keeps class on the root', async () => {
    const wrapper = await mountSuspended(MSearch, { attrs: { 'class': 'consumer', 'aria-labelledby': 'heading' } })

    expect(wrapper.classes()).toContain('consumer')
    expect(wrapper.find('input').attributes('aria-labelledby')).toBe('heading')
  })

  it('is a plain field, not a combobox, without results to show', async () => {
    const wrapper = await mountSuspended(MSearch)

    expect(wrapper.find('input').attributes('role')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-expanded')).toBeUndefined()
    expect(wrapper.find('.ui-search-view').exists()).toBe(false)
  })
})
