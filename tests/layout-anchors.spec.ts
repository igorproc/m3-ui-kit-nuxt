import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import MLayout from '../app/components/ui/layout/index.vue'
import MLayoutHeader from '../app/components/ui/layout/header.vue'
import MLayoutAside from '../app/components/ui/layout/aside.vue'
import MLayoutMain from '../app/components/ui/layout/main.vue'
import MAppBar from '../app/components/ui/app-bar/index.vue'
import { useLayoutZone } from '../app/composables/useLayout'

// useHead в тестовой среде не пишет в document.head, поэтому генерацию CSS
// (sticky/fixed-правила, display: none вне диапазона) покрывают юниты carve;
// здесь проверяем интеграцию: data-m3-zone (селектор generated-правил),
// inline grid-area и live-реестр контекстной зоны
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

const probeItems = (wrapper: { find: (sel: string) => { attributes: (name: string) => string | undefined } }) =>
  JSON.parse(wrapper.find('[data-testid="probe"]').attributes('data-items') ?? '[]') as { kind: string, size: string | null, sticky: boolean }[]

describe('multi-instance zones & sticky anchors', () => {
  it('two sized headers register as sticky top zones with zone attributes', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader, { sizeToken: '--h1' }),
        h(MLayoutHeader, { sizeToken: '--h2' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const headers = wrapper.findAll('header')
    expect(headers).toHaveLength(2)

    // data-m3-zone — селектор generated sticky-правил; имя = grid-area
    for (const header of headers) {
      const el = header.element as HTMLElement
      expect(header.attributes('data-m3-zone')).toBeTruthy()
      expect(header.attributes('data-m3-zone')).toBe(el.style.gridArea)
    }

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--h1)', sticky: true },
      { kind: 'top', size: 'var(--h2)', sticky: true },
      { kind: 'main', size: null, sticky: false },
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
    expect(bar.attributes('data-m3-zone')).toBe(el.style.gridArea)
    expect(bar.classes()).toContain('ui-app-bar--anchored')

    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-app-bar-height-center-aligned)', sticky: true },
      { kind: 'main', size: null, sticky: false },
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
    const header = wrapper.find('header')

    expect((bar.element as HTMLElement).style.gridArea).toBeFalsy()
    expect(bar.attributes('data-m3-zone')).toBeUndefined()
    expect(bar.classes()).not.toContain('ui-app-bar--anchored')
    expect(header.attributes('data-m3-zone')).toBeTruthy()

    // зона получила размер из вклада app-bar — реестр отдаёт его live-геттером,
    // поэтому generated-CSS прибьёт header и зарезервирует строку и на SSR
    expect(probeItems(wrapper)).toEqual([
      { kind: 'top', size: 'var(--ui-app-bar-height-center-aligned)', sticky: true },
      { kind: 'main', size: null, sticky: false },
    ])
  })

  it('asides register their side and sticky intent for the css generator', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutAside, { sizeToken: '--w', sticky: true }),
        h(MLayoutAside, { position: 'end', sizeToken: '--w2' }),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const asides = wrapper.findAll('aside')
    expect(asides[0]!.attributes('data-m3-zone')).toBeTruthy()
    expect(asides[1]!.attributes('data-m3-zone')).toBeTruthy()

    expect(probeItems(wrapper)).toEqual([
      { kind: 'start', size: 'var(--w)', sticky: true },
      { kind: 'end', size: 'var(--w2)', sticky: false },
      { kind: 'main', size: null, sticky: false },
    ])
  })

  it('sizeless sticky top zone stays in flow (no inline position, area assigned)', async () => {
    const wrapper = await mountSuspended(defineComponent({
      render: () => h(MLayout, () => [
        h(MLayoutHeader),
        h(MLayoutMain, () => h(Probe)),
      ]),
    }))

    const header = wrapper.find('header')
    const el = header.element as HTMLElement

    // позиционирование живёт в generated-CSS; для безразмерной зоны правило
    // не эмитится (юнит buildLayoutCss) — инлайн в любом случае только grid-area
    expect(el.style.position).toBe('')
    expect(el.style.gridArea).toBeTruthy()
    expect(header.attributes('data-m3-zone')).toBe(el.style.gridArea)
  })
})
