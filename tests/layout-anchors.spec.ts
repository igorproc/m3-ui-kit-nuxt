import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MLayout from '../app/components/ui/layout/index.vue'
import MLayoutHeader from '../app/components/ui/layout/header.vue'
import MLayoutAside from '../app/components/ui/layout/aside.vue'
import MLayoutMain from '../app/components/ui/layout/main.vue'
import MAppBar from '../app/components/ui/app-bar/index.vue'
import { useLayoutZone } from '../app/composables/useLayout'

// useHead в тестовой среде не пишет в document.head (генерация CSS покрыта
// юнитами carve), поэтому интеграцию проверяем по inline-стилям и реестру зоны
const Probe = defineComponent({
  setup() {
    const zone = useLayoutZone()

    return () => h('div', {
      'data-testid': 'probe',
      'data-items': JSON.stringify(
        zone?.items.map(item => ({ kind: item.kind, size: item.size ?? null })) ?? [],
      ),
    })
  },
})

const probeItems = (wrapper: { find: (sel: string) => { attributes: (name: string) => string | undefined } }) =>
  JSON.parse(wrapper.find('[data-testid="probe"]').attributes('data-items') ?? '[]') as { kind: string, size: string | null }[]

describe('multi-instance zones & sticky anchors', () => {
  it('two sized headers stack: fixed bars, second offset by the first', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader, { sizeToken: '--h1' }),
        h(MLayoutHeader, { sizeToken: '--h2' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const headers = wrapper.findAll('header')
    expect(headers).toHaveLength(2)

    const first = headers[0]!.element as HTMLElement
    const second = headers[1]!.element as HTMLElement
    const id2 = second.style.gridArea

    // top-зоны с размером прибиваются fixed (sticky в строке точной высоты не работает)
    expect(first.style.position).toBe('fixed')
    expect(second.style.position).toBe('fixed')
    expect(second.style.insetBlockStart).toBe(`var(--m3-layout-${id2}-top, 0px)`)

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--h1)' },
      { kind: 'top', size: 'var(--h2)' },
      { kind: 'main', size: null },
    ])
  })

  it('app-bar self-registers as a top zone at first level', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MAppBar, { title: 'Title' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const bar = wrapper.find('.ui-app-bar')
    const el = bar.element as HTMLElement

    expect(el.style.gridArea).toBeTruthy()
    expect(el.style.position).toBe('fixed')
    expect(bar.classes()).toContain('ui-app-bar--anchored')

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-app-bar-height-center-aligned)' },
      { kind: 'main', size: null },
    ])
  })

  it('app-bar inside m-layout-header contributes its height to the zone instead', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader, () => h(MAppBar, { title: 'Title' })),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const bar = wrapper.find('.ui-app-bar')
    const header = wrapper.find('header').element as HTMLElement

    expect((bar.element as HTMLElement).style.gridArea).toBeFalsy()
    expect(bar.classes()).not.toContain('ui-app-bar--anchored')
    // зона получила размер из вклада app-bar → прибита и резервирует строку
    expect(header.style.position).toBe('fixed')

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-app-bar-height-center-aligned)' },
      { kind: 'main', size: null },
    ])
  })

  it('sticky aside pins with viewport-clamped height; default aside stays in flow', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutAside, { sizeToken: '--w', sticky: true }),
        h(MLayoutAside, { position: 'end', sizeToken: '--w2' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const asides = wrapper.findAll('aside')
    const stickyEl = asides[0]!.element as HTMLElement
    const plainEl = asides[1]!.element as HTMLElement
    const id = stickyEl.style.gridArea

    expect(stickyEl.style.position).toBe('sticky')
    expect(stickyEl.style.alignSelf).toBe('start')
    expect(stickyEl.style.insetBlockStart).toBe(`var(--m3-layout-${id}-top, 0px)`)
    // height: calc(100dvh − insets) тоже выставляется, но happy-dom отбрасывает
    // calc()+var() в height при валидации — в браузере свойство применяется

    expect(plainEl.style.position).toBe('')

    expect(probeItems(wrapper).map(item => item.kind)).toEqual(['start', 'end', 'main'])
  })

  it('sizeless sticky top zone degrades to in-flow (cannot reserve the row)', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const header = wrapper.find('header').element as HTMLElement
    expect(header.style.position).toBe('')
    expect(header.style.gridArea).toBeTruthy()
  })
})
