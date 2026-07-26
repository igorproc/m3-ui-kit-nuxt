import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MBanner from '../app/components/ui/banner/index.vue'

describe('MBanner', () => {
  it('renders a polite auto surface banner by default', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { title: 'Sync is off', text: 'Local only.' } })
    const root = wrapper.find('.ui-banner')
    expect(root.element.tagName).toBe('SECTION')
    expect(root.classes()).toEqual(expect.arrayContaining(['ui-banner--surface', 'ui-banner--auto']))
    expect(root.attributes('aria-live')).toBe('polite')
    // A banner is a labelled section, never role=alert.
    expect(root.attributes('role')).toBeUndefined()
    expect(root.attributes('aria-labelledby')).toBe(wrapper.find('.ui-banner__title').attributes('id'))
    expect(root.attributes('aria-describedby')).toBe(wrapper.find('.ui-banner__body').attributes('id'))
  })

  it('omits the live region when announce is off', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { announce: 'off', title: 'Terms changed' } })
    expect(wrapper.find('.ui-banner').attributes('aria-live')).toBeUndefined()
  })

  it('renders no icon by default and suppresses it with icon=false', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { title: 'Sync is off' } })
    expect(wrapper.find('.ui-banner__icon').exists()).toBe(false)

    await wrapper.setProps({ icon: 'round-cloud-off' })
    expect(wrapper.html()).toContain('round-cloud-off')

    await wrapper.setProps({ icon: false })
    expect(wrapper.find('.ui-banner__icon').exists()).toBe(false)
  })

  it('prefers slots over the title/text props', async () => {
    const wrapper = await mountSuspended(MBanner, {
      props: { title: 'prop title', text: 'prop text' },
      slots: { title: () => 'slot title', default: () => 'slot text' },
    })
    expect(wrapper.find('.ui-banner__title').text()).toBe('slot title')
    expect(wrapper.find('.ui-banner__body').text()).toBe('slot text')
  })

  it('renders no empty wrappers without title, body, actions or close', async () => {
    const wrapper = await mountSuspended(MBanner)
    expect(wrapper.find('.ui-banner__title').exists()).toBe(false)
    expect(wrapper.find('.ui-banner__body').exists()).toBe(false)
    expect(wrapper.find('.ui-banner-actions').exists()).toBe(false)
    expect(wrapper.find('.ui-banner__close').exists()).toBe(false)
  })

  it('mounts the actions leaf with the parent layout only when the slot exists', async () => {
    const wrapper = await mountSuspended(MBanner, {
      props: { layout: 'stacked' },
      slots: { actions: () => h('button', { class: 'act' }, 'Set up') },
    })
    const actions = wrapper.find('.ui-banner-actions')
    expect(actions.classes()).toContain('ui-banner-actions--stacked')
    expect(actions.find('.act').exists()).toBe(true)
  })

  it('keeps action DOM order stable across layouts', async () => {
    const wrapper = await mountSuspended(MBanner, {
      props: { layout: 'inline' },
      slots: {
        actions: () => [h('button', { class: 'first' }, 'A'), h('button', { class: 'second' }, 'B')],
      },
    })
    const order = () => wrapper.findAll('.ui-banner-actions button').map(button => button.classes()[0])
    expect(order()).toEqual(['first', 'second'])

    await wrapper.setProps({ layout: 'stacked' })
    expect(order()).toEqual(['first', 'second'])
  })

  it('emits close once on explicit dismissal', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { closable: true, closeLabel: 'Скрыть' } })
    const close = wrapper.find('.ui-banner__close')
    expect(close.attributes('aria-label')).toBe('Скрыть')

    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
    expect(wrapper.find('.ui-banner').exists()).toBe(false)
  })

  it('hides on an external model change without emitting close', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { modelValue: true, closable: true } })
    await wrapper.setProps({ modelValue: false })
    expect(wrapper.find('.ui-banner').exists()).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.ui-banner').exists()).toBe(true)
  })

  it('lets the actions slot close the banner', async () => {
    const wrapper = await mountSuspended(MBanner, {
      slots: { actions: ({ close }: { close: () => void }) => h('button', { class: 'dismiss', onClick: close }, 'Ok') },
    })
    await wrapper.find('.dismiss').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('replaces the close control through the close slot', async () => {
    const wrapper = await mountSuspended(MBanner, {
      props: { closable: true },
      slots: {
        close: ({ props }: { props: Record<string, unknown> }) =>
          h('button', { ...props, class: [props.class, 'custom-close'] }, 'x'),
      },
    })
    expect(wrapper.find('.ui-icon-button').exists()).toBe(false)
    const custom = wrapper.find('.custom-close')
    expect(custom.classes()).toContain('ui-banner__close')

    await custom.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('ignores the close slot when the banner is not closable', async () => {
    const wrapper = await mountSuspended(MBanner, {
      slots: { close: () => h('button', { class: 'custom-close' }, 'x') },
    })
    expect(wrapper.find('.custom-close').exists()).toBe(false)
  })

  it('applies the tonal variant tokens', async () => {
    const wrapper = await mountSuspended(MBanner, { props: { variant: 'tonal', title: 'Offline' } })
    expect(wrapper.find('.ui-banner').classes()).toContain('ui-banner--tonal')
  })
})
