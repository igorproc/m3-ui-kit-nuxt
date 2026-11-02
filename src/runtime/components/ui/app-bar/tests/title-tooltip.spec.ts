import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MAppBar from '../index.vue'

const LONG = 'Quarterly revenue by region and channel, adjusted for returns'

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MAppBar, { props: { title: LONG, headingLevel: 1, ...props }, attachTo: document.body })
  await nextTick()

  return current as VueWrapper
}

/** jsdom lays nothing out: a truncated title is one whose text runs past its box. */
function layOut(truncated: boolean) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(truncated ? 640 : 200)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200)
}

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]')
const isShown = () => Boolean(tooltip()) && tooltip()!.style.display !== 'none'

afterEach(() => {
  current?.unmount()
  current = null
  vi.restoreAllMocks()
})

// CT-02: a small bar cuts a long title with an ellipsis; the full text shows
// in a tooltip, and only when it is actually cut.
describe('m-app-bar · truncated title', () => {
  describe('markup', () => {
    it('keeps the title text inside the heading of a one-line bar', async () => {
      layOut(false)
      const wrapper = await mount()
      const heading = wrapper.find('h1.ui-app-bar__title')

      expect(heading.find('.ui-app-bar__text').text()).toBe(LONG)
      expect(heading.text()).toBe(LONG)
    })

    it('renders the medium bar title as plain heading text: it wraps instead', async () => {
      layOut(true)
      const wrapper = await mount({ type: 'medium' })

      expect(wrapper.find('.ui-app-bar__text').exists()).toBe(false)
      expect(wrapper.find('h1.ui-app-bar__title').text()).toBe(LONG)
    })

    it('ships the same heading and no tooltip in the server HTML', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MAppBar, { title: LONG, headingLevel: 1 }),
      })))

      expect(html).toMatch(/<h1[^>]*class="ui-app-bar__title[^"]*"/)
      expect(html).toContain(LONG)
      expect(html).not.toContain('role="tooltip"')
    })
  })

  describe('hover', () => {
    it('shows the full title when the text is cut', async () => {
      layOut(true)
      const wrapper = await mount()

      await wrapper.find('.ui-app-bar__tooltip').trigger('mouseenter')

      expect(isShown()).toBe(true)
      expect(tooltip()!.textContent).toContain(LONG)
    })

    it('stays hidden while the title fits', async () => {
      layOut(false)
      const wrapper = await mount({ title: 'Inbox' })

      await wrapper.find('.ui-app-bar__tooltip').trigger('mouseenter')

      expect(isShown()).toBe(false)
    })

    it('follows a title that changes after mount', async () => {
      layOut(false)
      const wrapper = await mount({ title: 'Inbox' })

      layOut(true)
      await wrapper.setProps({ title: LONG })
      await nextTick()
      await nextTick()
      await wrapper.find('.ui-app-bar__tooltip').trigger('mouseenter')

      expect(isShown()).toBe(true)
    })
  })

  describe('a11y', () => {
    it('leaves the heading named by its own text: nothing is added to the name or the description', async () => {
      layOut(true)
      const wrapper = await mount()
      const heading = wrapper.find('h1.ui-app-bar__title')

      expect(heading.attributes('aria-describedby')).toBeUndefined()
      expect(heading.find('[aria-describedby]').exists()).toBe(false)
      expect(heading.text()).toBe(LONG)
    })

    it('adds no Tab stop: the heading stays out of the Tab order', async () => {
      layOut(true)
      const wrapper = await mount()

      expect(wrapper.find('.ui-app-bar__title [tabindex]').exists()).toBe(false)
    })
  })
})
