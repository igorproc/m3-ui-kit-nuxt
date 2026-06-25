import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MSearch from '../app/components/ui/search/index.vue'

describe('m-search', () => {
  it('renders the root with a type="search" input and a leading icon slot', async () => {
    const wrapper = await mountSuspended(MSearch)

    expect(wrapper.find('.ui-search').exists()).toBe(true)

    const input = wrapper.find('input.ui-search__input')

    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('search')
    expect(wrapper.find('.ui-search__icon--leading').exists()).toBe(true)
  })

  it('starts empty and forwards placeholder + aria-label', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { placeholder: 'Find', ariaLabel: 'Find products' },
    })

    const input = wrapper.find('input.ui-search__input')

    expect(wrapper.classes()).toContain('ui-search--empty')
    expect(input.attributes('placeholder')).toBe('Find')
    expect(input.attributes('aria-label')).toBe('Find products')
  })

  it('falls back to the placeholder for aria-label when none is given', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { placeholder: 'Search items' },
    })

    expect(wrapper.find('input.ui-search__input').attributes('aria-label')).toBe('Search items')
  })

  it('updates v-model on input and drops the empty class', async () => {
    const wrapper = await mountSuspended(MSearch)

    await wrapper.find('input.ui-search__input').setValue('query')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['query'])
    expect(wrapper.classes()).not.toContain('ui-search--empty')
  })

  it('shows the clear button when populated and clears the model on click', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { modelValue: 'abc' },
    })

    const clear = wrapper.find('button.ui-search__icon--trailing')

    expect(clear.exists()).toBe(true)
    expect(clear.attributes('aria-label')).toBe('Clear search')

    await clear.trigger('click')

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
  })

  it('hides the clear button when empty', async () => {
    const wrapper = await mountSuspended(MSearch)

    expect(wrapper.find('button.ui-search__icon--trailing').exists()).toBe(false)
  })

  it('disables the input and hides the clear button when disabled', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { modelValue: 'abc', disabled: true },
    })

    expect(wrapper.find('input.ui-search__input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button.ui-search__icon--trailing').exists()).toBe(false)
  })

  it('renders custom leading and clear slots', async () => {
    const wrapper = await mountSuspended(MSearch, {
      props: { modelValue: 'abc' },
      slots: {
        leading: () => 'L',
        clear: () => 'X',
      },
    })

    expect(wrapper.find('.ui-search__icon--leading').text()).toBe('L')
    expect(wrapper.find('button.ui-search__icon--trailing').text()).toBe('X')
  })
})
