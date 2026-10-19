import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useExpansionPanelControl } from './useExpansionPanelControl'
import type { ExpansionPanelControlProps } from './useExpansionPanelControl'
import { provideExpansionPanelGroupContext } from '#kit/components/ui/expansion-panels/context'
import type { ExpansionPanelGroupContext } from '#kit/components/ui/expansion-panels/context'
import type { PanelValue } from '#kit/components/ui/expansion-panel/props'
import type { GroupTicket } from '#kit/composables/registry/createGroup'

type Control = ReturnType<typeof useExpansionPanelControl>

// behavior.md: the composable hands out attribute bags only — no classes, no data-*.
const presentationKeys = (bag: Record<string, unknown>) => Object.keys(bag).filter(key => key === 'class' || key.startsWith('data-'))

/**
 * Mounts the attr bags onto anonymous markup — no kit component, no kit class
 * names. Anything asserted here is behavior the bags carry on their own.
 */
function createHarness(props: ExpansionPanelControlProps, open: Ref<boolean> = ref(false)) {
  let control: Control | null = null

  const component = defineComponent({
    setup() {
      control = useExpansionPanelControl(open, props)

      return () => h('div', [
        h('div', control!.headingAttrs.value, [h('button', control!.buttonAttrs.value, 'Shipping')]),
        h('div', control!.regionAttrs.value, [h('input', { 'aria-label': 'Address' })]),
      ])
    },
  })

  return { component, open, getControl: () => control! }
}

/** A group that records what the panel tells it and answers from `open`. */
function createFakeGroup(open: PanelValue[] = [], locked = false) {
  const registered: PanelValue[] = []
  const unregistered: string[] = []
  const toggled: PanelValue[] = []
  let next = 0

  const context: ExpansionPanelGroupContext = {
    multiple: false,
    register: ({ value }) => {
      registered.push(value)
      return { id: `ticket-${next++}`, value } as unknown as GroupTicket<{ value: PanelValue }>
    },
    unregister: id => unregistered.push(String(id)),
    toggle: value => toggled.push(value),
    isOpen: value => open.includes(value),
    isLocked: value => locked && open.includes(value),
  }

  return { context, registered, unregistered, toggled }
}

function inGroup(group: ExpansionPanelGroupContext, child: ReturnType<typeof defineComponent>) {
  return defineComponent({
    setup() {
      provideExpansionPanelGroupContext(group)
      return () => h(child)
    },
  })
}

describe('useExpansionPanelControl', () => {
  it('wires a disclosure to markup it knows nothing about', async () => {
    const { component } = createHarness({ disabled: false })

    const wrapper = await mountSuspended(component)
    const button = wrapper.find('button')
    const region = wrapper.find('[role="region"]')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe(region.attributes('id'))
    expect(region.attributes('aria-labelledby')).toBe(button.attributes('id'))
  })

  it('keeps collapsed content inert and releases it on open', async () => {
    const { component, open } = createHarness({ disabled: false })

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('[role="region"]').attributes('inert')).toBeDefined()
    expect(wrapper.find('[role="region"]').attributes('aria-hidden')).toBeUndefined()

    await wrapper.find('button').trigger('click')

    expect(open.value).toBe(true)
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="region"]').attributes('inert')).toBeUndefined()
  })

  it('does not toggle while disabled', async () => {
    const { component, open } = createHarness({ disabled: true })

    const wrapper = await mountSuspended(component)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    await wrapper.find('button').trigger('click')
    expect(open.value).toBe(false)
  })

  it('names a heading of the requested level on any element', async () => {
    const props = reactive<ExpansionPanelControlProps>({ disabled: false, headingLevel: 3 })
    const { component, getControl } = createHarness(props)

    const wrapper = await mountSuspended(component)
    const heading = wrapper.find('[role="heading"]')

    expect(heading.attributes('aria-level')).toBe('3')
    expect(heading.find('button').exists()).toBe(true)
    expect(getControl().headingTag.value).toBe('h3')

    props.headingLevel = undefined
    await nextTick()

    expect(wrapper.find('[role="heading"]').exists()).toBe(false)
    expect(getControl().headingTag.value).toBeUndefined()
  })

  it('moves focus from collapsing content to the header button', async () => {
    const { component, open } = createHarness({ disabled: false }, ref(true))

    const wrapper = await mountSuspended(component, { attachTo: document.body })
    const input = wrapper.find('input').element as HTMLInputElement
    input.focus()
    expect(document.activeElement).toBe(input)

    open.value = false
    await nextTick()

    expect(document.activeElement).toBe(wrapper.find('button').element)
    wrapper.unmount()
  })

  it('hands out no presentation', async () => {
    const { component, getControl } = createHarness({ disabled: false, headingLevel: 2 })

    await mountSuspended(component)
    const { headingAttrs, buttonAttrs, regionAttrs } = getControl()

    for (const bag of [headingAttrs.value, buttonAttrs.value, regionAttrs.value]) {
      expect(presentationKeys(bag)).toEqual([])
    }
  })

  describe('inside a group', () => {
    it('lets the group decide the open state and the toggle', async () => {
      const group = createFakeGroup(['b'])
      const { component } = createHarness({ disabled: false, value: 'b' })

      const wrapper = await mountSuspended(inGroup(group.context, component))
      expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')

      await wrapper.find('button').trigger('click')
      expect(group.toggled).toEqual(['b'])
    })

    it('marks the open panel of a mandatory exclusive group aria-disabled', async () => {
      const group = createFakeGroup(['a'], true)
      const { component } = createHarness({ disabled: false, value: 'a' })

      const wrapper = await mountSuspended(inGroup(group.context, component))

      expect(wrapper.find('button').attributes('aria-disabled')).toBe('true')
      expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
    })

    it('registers again under a new value', async () => {
      const group = createFakeGroup()
      const props = reactive<ExpansionPanelControlProps>({ disabled: false, value: 'a' })
      const { component } = createHarness(props)

      await mountSuspended(inGroup(group.context, component))
      props.value = 'z'
      await nextTick()

      expect(group.registered).toEqual(['a', 'z'])
      expect(group.unregistered).toEqual(['ticket-0'])
    })
  })
})
