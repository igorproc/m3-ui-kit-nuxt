import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MFabMenu from './index.vue'

const items = [
  { label: 'Share', icon: 'ic:baseline-share', value: 'share' },
  { label: 'Edit', icon: 'ic:baseline-edit', value: 'edit' },
]

const activator = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) => wrapper.find('.ui-fab-menu__activator')

describe('m-fab-menu', () => {
  it('renders the root with the default align and color classes', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    expect(wrapper.find('.ui-fab-menu').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ui-fab-menu--end')
    expect(wrapper.classes()).toContain('ui-fab-menu--primary')
  })

  it('maps color and the logical align to classes', async () => {
    const wrapper = await mountSuspended(MFabMenu, {
      props: { items, color: 'secondary', align: 'start' },
    })

    expect(wrapper.classes()).toContain('ui-fab-menu--secondary')
    expect(wrapper.classes()).toContain('ui-fab-menu--start')
  })

  it('still honours the retired left / right as start / end', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items, align: 'left' } })

    expect(wrapper.classes()).toContain('ui-fab-menu--start')
  })

  it('renders the default FAB on its container colour with the density step', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items, density: 'comfortable', ariaLabel: 'Create' } })
    const fab = wrapper.find('button.ui-fab')

    expect(fab.classes()).toEqual(expect.arrayContaining(['ui-fab--tonal', 'ui-fab--comfortable']))
    expect(fab.attributes('aria-label')).toBe('Create')
  })

  it('still honours the retired size as a density step', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items, size: 'sm' } })

    expect(wrapper.find('button.ui-fab').classes()).toContain('ui-fab--compact')
  })

  it('is a disclosure: aria-expanded follows the menu, aria-controls names the actions', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    expect(activator(wrapper).attributes('aria-expanded')).toBe('false')
    expect(activator(wrapper).attributes('aria-controls')).toBeUndefined()

    await activator(wrapper).trigger('click')

    const drawer = wrapper.find('.ui-fab-menu__drawer')
    expect(activator(wrapper).attributes('aria-expanded')).toBe('true')
    expect(activator(wrapper).attributes('aria-controls')).toBe(drawer.attributes('id'))
    expect(activator(wrapper).classes()).toContain('ui-fab-menu__activator--open')
  })

  it('renders the actions as buttons, icon first', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    await activator(wrapper).trigger('click')
    const actions = wrapper.findAll('.ui-fab-menu__item')

    expect(actions).toHaveLength(2)
    for (const action of actions) {
      expect(action.attributes('type')).toBe('button')
      expect(action.element.firstElementChild?.classList.contains('ui-fab-menu__item-icon')).toBe(true)
    }
  })

  it('emits select and closes when an action is chosen', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    await activator(wrapper).trigger('click')
    await wrapper.findAll('.ui-fab-menu__item')[1]!.trigger('click')

    expect(wrapper.emitted('select')?.at(-1)).toEqual([items[1]])
    expect(activator(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it('closes on Escape', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items } })

    await activator(wrapper).trigger('click')
    await wrapper.find('.ui-fab-menu__drawer').trigger('keydown', { key: 'Escape' })

    expect(activator(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it('follows v-model:open and reports its own toggles', async () => {
    const wrapper = await mountSuspended(MFabMenu, { props: { items, open: true } })
    expect(activator(wrapper).attributes('aria-expanded')).toBe('true')

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(activator(wrapper).attributes('aria-expanded')).toBe('false')

    await activator(wrapper).trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('does not open when disabled or when there is nothing to show', async () => {
    const disabled = await mountSuspended(MFabMenu, { props: { items, disabled: true } })
    await activator(disabled).trigger('click')
    expect(disabled.find('.ui-fab-menu__drawer').exists()).toBe(false)

    const empty = await mountSuspended(MFabMenu)
    await activator(empty).trigger('click')
    expect(empty.find('.ui-fab-menu__drawer').exists()).toBe(false)
  })

  it('disables a single action', async () => {
    const wrapper = await mountSuspended(MFabMenu, {
      props: { items: [...items, { label: 'Delete', value: 'delete', disabled: true }] },
    })

    await activator(wrapper).trigger('click')

    expect(wrapper.findAll('.ui-fab-menu__item')[2]!.attributes('disabled')).toBeDefined()
  })
})
