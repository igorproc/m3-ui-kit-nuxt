import { defineComponent, h } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import { injectHead } from '#app'
import { useLayoutZone } from '#kit/composables/useLayout'

export interface ProbeItem {
  kind: string
  size: string | null
  sticky: boolean
}

/** Renders the live zone registry of the enclosing layout into a data attribute. */
export const Probe = defineComponent({
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

export const probeItems = (wrapper: VueWrapper) =>
  JSON.parse(wrapper.find('[data-testid="probe"]').attributes('data-items') ?? '[]') as ProbeItem[]

/** Captures the context zone of the enclosing layout for direct calls. */
export function createZoneCapture() {
  const captured: { zone: ReturnType<typeof useLayoutZone> } = { zone: null }

  const Capture = defineComponent({
    setup() {
      captured.zone = useLayoutZone()

      return () => h('span', { 'data-testid': 'capture' })
    },
  })

  return { Capture, captured }
}

/**
 * The generated grid of a mounted layout. `useHead` does not write into
 * `document.head` under Vitest, so the payload is read from the head instance.
 */
export async function layoutCss(wrapper: VueWrapper, selector = '.m-layout') {
  const id = wrapper.find(selector).attributes('id')
  const tags = await injectHead().resolveTags()

  return String(tags.find(tag => tag.tag === 'style' && tag.props.id === id)?.innerHTML ?? '')
}

/** The block of one device range: mobile is the base, tablet and desktop are `@media`. */
export function rangeBlock(css: string, range: 'mobile' | 'tablet' | 'desktop') {
  const tablet = css.indexOf('min-width: 768px')
  const desktop = css.indexOf('min-width: 1200px')

  if (range === 'mobile') return css.slice(0, tablet)
  if (range === 'tablet') return css.slice(tablet, desktop)
  return css.slice(desktop)
}
