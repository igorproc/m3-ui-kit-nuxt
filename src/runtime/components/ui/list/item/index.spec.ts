import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MListItem from './index.vue'
import MList from '../index.vue'
import MDivider from '../../divider/index.vue'

const inList = (props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) =>
  mountSuspended(defineComponent({ render: () => h(MList, null, { default: () => h(MListItem, props, slots) }) }))

describe('m-list-item', () => {
  it('renders a non-interactive <div> by default without a button role', async () => {
    const wrapper = await mountSuspended(MListItem)

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toContain('ui-list-item')
    expect(wrapper.classes()).not.toContain('ui-list-item--interactive')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('renders headline / supporting / overline content props', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: {
        headline: 'Title',
        supportingText: 'Subtitle',
        overline: 'Over',
      },
    })

    expect(wrapper.find('.ui-list-item__headline').text()).toBe('Title')
    expect(wrapper.find('.ui-list-item__supporting').text()).toBe('Subtitle')
    expect(wrapper.find('.ui-list-item__overline').text()).toBe('Over')
  })

  it('renders the default slot', async () => {
    const wrapper = await mountSuspended(MListItem, {
      slots: { default: () => 'Body' },
    })

    expect(wrapper.text()).toContain('Body')
  })

  it('defaults to the default density and reads the lines modifier alongside it', async () => {
    const wrapper = await mountSuspended(MListItem, { props: { headline: 'One line' } })

    expect(wrapper.classes()).toContain('ui-list-item--density-default')
    expect(wrapper.classes()).toContain('ui-list-item--lines-1')
  })

  it('applies an explicit density without touching the line count', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { headline: 'Title', supportingText: 'Subtitle', density: 'compact' },
    })

    expect(wrapper.classes()).toContain('ui-list-item--density-compact')
    expect(wrapper.classes()).toContain('ui-list-item--lines-2')
  })

  it('applies the selected modifier', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { selected: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--selected')
  })

  it('emulates a button (role + tabindex) when interactive', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--interactive')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('triggers click on Enter and Space when emulating a button', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true },
      attrs: { onClick: () => {} },
    })

    let clicks = 0
    wrapper.element.addEventListener('click', () => {
      clicks += 1
    })

    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })

    expect(clicks).toBe(2)
  })

  it('does not handle keyboard activation for a native button tag', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { tag: 'button' },
    })

    // Native <button> provides its own role/semantics — no emulated role/tabindex.
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })

  it('never submits the form it sits in', async () => {
    let submits = 0
    const wrapper = await mountSuspended(defineComponent({
      render: () => h('form', {
        onSubmit: (event: Event) => {
          event.preventDefault()
          submits += 1
        },
      }, [h(MListItem, { tag: 'button', headline: 'Row', type: 'submit' })]),
    }), { attachTo: document.body })

    const row = wrapper.find('button.ui-list-item')
    expect(row.attributes('type')).toBe('button')
    const button = row.element as HTMLButtonElement
    button.click()
    expect(submits).toBe(0)

    wrapper.unmount()
  })

  it('disables interaction: tabindex -1, aria-disabled and disabled class', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true, disabled: true },
    })

    expect(wrapper.classes()).toContain('ui-list-item--disabled')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('tabindex')).toBe('-1')
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('says a static row is disabled, and leaves a native button to its own attribute', async () => {
    const plain = await mountSuspended(MListItem, { props: { disabled: true } })
    expect(plain.attributes('aria-disabled')).toBe('true')

    const button = await mountSuspended(MListItem, { props: { tag: 'button', disabled: true } })
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBeUndefined()
  })

  it('does not activate on keyboard when disabled', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { interactive: true, disabled: true },
    })

    let clicks = 0
    wrapper.element.addEventListener('click', () => {
      clicks += 1
    })

    await wrapper.trigger('keydown', { key: 'Enter' })

    expect(clicks).toBe(0)
  })

  it('renders leading and trailing slots', async () => {
    const wrapper = await mountSuspended(MListItem, {
      slots: {
        leading: () => 'L',
        trailing: () => 'T',
      },
    })

    expect(wrapper.find('.ui-list-item__leading').text()).toBe('L')
    expect(wrapper.find('.ui-list-item__trailing').text()).toBe('T')
  })

  describe('selected state', () => {
    it('is aria-pressed on a button, true or false once the row is part of a selection', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { tag: 'button', selected: true } })
      expect(wrapper.attributes('aria-pressed')).toBe('true')

      await wrapper.setProps({ selected: false })
      expect(wrapper.attributes('aria-pressed')).toBe('false')
    })

    it('is aria-pressed on an emulated button', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { interactive: true, selected: true } })

      expect(wrapper.attributes('aria-pressed')).toBe('true')
    })

    it('leaves a plain action row a plain button', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { tag: 'button' } })

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('is aria-current="page" on a link, and absent while not selected', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { tag: 'a', selected: true }, attrs: { href: '/inbox' } })
      expect(wrapper.attributes('aria-current')).toBe('page')
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()

      await wrapper.setProps({ selected: false })
      expect(wrapper.attributes('aria-current')).toBeUndefined()
    })

    it('adds nothing when the consumer set a role', async () => {
      const wrapper = await mountSuspended(MListItem, {
        props: { interactive: true, selected: true },
        attrs: { 'role': 'option', 'aria-selected': 'true' },
      })

      expect(wrapper.attributes('role')).toBe('option')
      expect(wrapper.attributes('aria-selected')).toBe('true')
      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
    })

    it('says nothing on a static row', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { selected: true } })

      expect(wrapper.attributes('aria-pressed')).toBeUndefined()
      expect(wrapper.attributes('aria-current')).toBeUndefined()
    })
  })

  describe('disabled link', () => {
    it('drops href, stays announced as an unavailable link and leaves the tab order', async () => {
      const wrapper = await mountSuspended(MListItem, {
        props: { tag: 'a', disabled: true, headline: 'Archive' },
        attrs: { href: '/archive' },
      })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('role')).toBe('link')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.attributes('tabindex')).toBeUndefined()
    })

    it('renders a route link as a plain anchor without href', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { to: '/archive', disabled: true } })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBeUndefined()
      expect(wrapper.attributes('aria-disabled')).toBe('true')
    })

    it('keeps href while enabled', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { to: '/archive' } })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('/archive')
      expect(wrapper.attributes('aria-disabled')).toBeUndefined()
    })
  })

  describe('lines', () => {
    it('lets text wrap when lines is auto', async () => {
      const wrapper = await mountSuspended(MListItem, { props: { headline: 'Title', supportingText: 'Text' } })

      expect(wrapper.classes()).not.toContain('ui-list-item--clamped')
      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBeUndefined()
    })

    it('clamps an explicit line count and keeps the full text as a tooltip', async () => {
      const wrapper = await mountSuspended(MListItem, {
        props: { lines: 3, overline: 'Over', headline: 'Title', supportingText: 'A long supporting text' },
      })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-list-item--clamped', 'ui-list-item--lines-3']))
      expect(wrapper.find('.ui-list-item__overline').attributes('title')).toBe('Over')
      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBe('Title')
      expect(wrapper.find('.ui-list-item__supporting').attributes('title')).toBe('A long supporting text')
    })

    it('leaves slotted text to the consumer', async () => {
      const wrapper = await mountSuspended(MListItem, {
        props: { lines: 1, headline: 'Prop' },
        slots: { headline: () => 'Slotted' },
      })

      expect(wrapper.find('.ui-list-item__headline').attributes('title')).toBeUndefined()
    })
  })

  // Q-1 (M3-polish): the slot is kebab-case like every other multi-word slot;
  // Vue does not normalise slot names, so `#trailing-supporting` used to render nothing.
  it('fills the trailing supporting text through #trailing-supporting', async () => {
    const wrapper = await mountSuspended(MListItem, {
      props: { headline: 'Inbox' },
      slots: { 'trailing-supporting': () => '12' },
    })

    expect(wrapper.find('.ui-list-item__trailing-supporting').text()).toBe('12')
  })

  describe('inside a list', () => {
    it('is the li itself when static', async () => {
      const wrapper = await inList({ headline: 'Static' })
      const row = wrapper.find('.ui-list-item')

      expect(row.element.tagName).toBe('LI')
      expect(row.element.parentElement!.tagName).toBe('UL')
    })

    it('puts an interactive row inside its li, with the consumer attributes on the row', async () => {
      let clicks = 0
      const wrapper = await inList({ 'headline': 'Action', 'tag': 'button', 'selected': true, 'data-test': 'row', 'onClick': () => {
        clicks += 1
      } })

      const item = wrapper.find('.ui-list__row')
      const row = wrapper.find('.ui-list-item')
      expect(item.element.tagName).toBe('LI')
      expect(item.attributes()).toEqual({ class: 'ui-list__row' })
      expect(row.element.tagName).toBe('BUTTON')
      expect(row.element.parentElement).toBe(item.element)
      expect(row.classes()).toContain('ui-list-item--selected')
      expect(row.attributes('aria-pressed')).toBe('true')
      expect(row.attributes('data-test')).toBe('row')

      await row.trigger('click')
      expect(clicks).toBe(1)
    })

    it('keeps the content of a row out of the list structure', async () => {
      const wrapper = await inList({ headline: 'Row' }, { default: () => h(MDivider) })
      const divider = wrapper.find('.ui-divider')

      expect(divider.element.tagName).toBe('DIV')
      expect(divider.attributes('role')).toBe('separator')
    })
  })
})
