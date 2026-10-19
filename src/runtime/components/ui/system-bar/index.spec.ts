import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MSystemBar from './index.vue'
import MLayout from '#kit/components/ui/layout/index.vue'
import MLayoutHeader from '#kit/components/ui/layout/header.vue'
import MLayoutMain from '#kit/components/ui/layout/main.vue'
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import { useLayoutZone } from '#kit/composables/useLayout'

interface ProbeItem {
  kind: string
  size: string | null
  sticky: boolean
}

const Probe = defineComponent({
  setup() {
    const zone = useLayoutZone()

    return () => h('div', {
      'data-testid': 'probe',
      'data-items': JSON.stringify(
        zone?.items.map(item => ({
          kind: item.kind,
          size: item.size ?? null,
          sticky: item.sticky ?? false,
        })) ?? [],
      ),
    })
  },
})

const probeItems = (wrapper: { find: (selector: string) => { attributes: (name: string) => string | undefined } }) =>
  JSON.parse(wrapper.find('[data-testid="probe"]').attributes('data-items') ?? '[]') as ProbeItem[]

describe('m-system-bar', () => {
  it('renders the bar container', async () => {
    const wrapper = await mountSuspended(MSystemBar)

    expect(wrapper.find('.ui-system-bar').exists()).toBe(true)
  })

  it('renders default slot content inside the text element', async () => {
    const wrapper = await mountSuspended(MSystemBar, {
      slots: { default: () => 'status' },
    })

    expect(wrapper.find('.ui-system-bar__text').text()).toBe('status')
  })

  it('wraps the prepend and append slots in their icon elements', async () => {
    const wrapper = await mountSuspended(MSystemBar, {
      slots: {
        prepend: () => h('i', { 'data-testid': 'start-icon' }),
        default: () => 'status',
        append: () => h('i', { 'data-testid': 'end-icon' }),
      },
    })

    const parts = Array.from((wrapper.element as HTMLElement).children, part => part.className)

    expect(parts).toEqual([
      'ui-system-bar__prepend',
      'ui-system-bar__text',
      'ui-system-bar__append',
    ])
    expect(wrapper.find('.ui-system-bar__prepend [data-testid="start-icon"]').exists()).toBe(true)
    expect(wrapper.find('.ui-system-bar__append [data-testid="end-icon"]').exists()).toBe(true)
  })

  it('renders no empty elements for absent slots', async () => {
    const wrapper = await mountSuspended(MSystemBar)

    expect(wrapper.find('.ui-system-bar__prepend').exists()).toBe(false)
    expect(wrapper.find('.ui-system-bar__text').exists()).toBe(false)
    expect(wrapper.find('.ui-system-bar__append').exists()).toBe(false)
  })

  it('passes fallthrough attributes to the root', async () => {
    const wrapper = await mountSuspended(MSystemBar, {
      attrs: { 'data-test': 'bar', 'aria-label': 'Device status' },
    })

    expect(wrapper.attributes('data-test')).toBe('bar')
    expect(wrapper.attributes('aria-label')).toBe('Device status')
  })

  it('is not anchored when rendered outside a layout', async () => {
    const wrapper = await mountSuspended(MSystemBar)

    expect(wrapper.classes()).not.toContain('ui-system-bar--anchored')
    expect(wrapper.attributes('data-m3-zone')).toBeUndefined()
  })
})

describe('m-system-bar in m-layout', () => {
  it('registers as a sticky top zone sized by its height token', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MSystemBar),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const bar = wrapper.find('.ui-system-bar')
    const el = bar.element as HTMLElement

    expect(bar.classes()).toContain('ui-system-bar--anchored')
    expect(el.style.gridArea).toBeTruthy()
    expect(bar.attributes('data-m3-zone')).toBe(el.style.gridArea)
    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-system-bar-height)', sticky: true },
      { kind: 'main', size: null, sticky: false },
    ])
  })

  it('registers an in-flow zone when sticky is false', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MSystemBar, { sticky: false }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    expect(wrapper.find('.ui-system-bar').classes()).toContain('ui-system-bar--anchored')
    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-system-bar-height)', sticky: false },
      { kind: 'main', size: null, sticky: false },
    ])
  })

  it('carves its row above an app bar that follows it', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MSystemBar),
        h(MAppBar, { title: 'Title' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-system-bar-height)', sticky: true },
      { kind: 'top', size: 'var(--ui-app-bar-height-small)', sticky: true },
      { kind: 'main', size: null, sticky: false },
    ])
  })

  it('inside m-layout-header adds its height to the app bar instead of registering', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader, () => [
          h(MSystemBar),
          h(MAppBar, { title: 'Title' }),
        ]),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const bar = wrapper.find('.ui-system-bar')

    expect(bar.classes()).not.toContain('ui-system-bar--anchored')
    expect(bar.attributes('data-m3-zone')).toBeUndefined()
    expect((bar.element as HTMLElement).style.gridArea).toBeFalsy()
    expect(wrapper.find('header').attributes('data-m3-zone')).toBeTruthy()
    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'calc(var(--ui-system-bar-height) + var(--ui-app-bar-height-small))', sticky: true },
      { kind: 'main', size: null, sticky: false },
    ])
  })
})
