import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MPagination from '../index.vue'

const labels = {
  ariaLabel: 'Pagination',
  firstLabel: 'First page',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  lastLabel: 'Last page',
}

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  if (current) current.unmount()
  current = await mountSuspended(MPagination, { props: { ...labels, length: 10, modelValue: 1, ...props }, attrs })

  return current as VueWrapper
}

const control = (wrapper: VueWrapper, label: string) => wrapper.find(`[aria-label="${label}"]`)

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-pagination · a11y', () => {
  describe('landmark', () => {
    it('is a native nav named by ariaLabel', async () => {
      const wrapper = await mount()

      expect(wrapper.element.tagName).toBe('NAV')
      expect(wrapper.attributes('aria-label')).toBe('Pagination')
    })

    it('takes its name from a visible heading', async () => {
      const wrapper = await mount({ ariaLabel: undefined }, { 'aria-labelledby': 'results-heading' })

      expect(wrapper.attributes('aria-labelledby')).toBe('results-heading')
    })

    it('lists the controls in an ordered list', async () => {
      const wrapper = await mount()

      expect(wrapper.find('ol').findAll('li').length).toBeGreaterThan(0)
    })
  })

  // B5.7c (Q32-А): the kit ships no English names; pages are named by their number.
  describe('naming', () => {
    it('ships no English names of its own', async () => {
      if (current) current.unmount()
      current = await mountSuspended(MPagination, { props: { length: 10, modelValue: 2, showFirstLast: true } })
      const wrapper = current as VueWrapper

      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(wrapper.html()).not.toMatch(/aria-label="[^"]*(page|Page|Pagination)/)
      expect(wrapper.findAll('.ui-pagination__page')[0]!.attributes('aria-label')).toBeUndefined()
    })

    it.each(['First page', 'Previous page', 'Next page', 'Last page'])('names the %s control by its prop', async (label) => {
      const wrapper = await mount({ showFirstLast: true, modelValue: 5 })

      expect(control(wrapper, label).exists()).toBe(true)
    })

    it('names the page buttons through pageLabel(page, current)', async () => {
      const pageLabel = (page: number, isCurrent: boolean) => (isCurrent ? `Страница ${page}, текущая` : `Страница ${page}`)
      const wrapper = await mount({ length: 5, modelValue: 2, pageLabel })
      const pages = wrapper.findAll('.ui-pagination__page')

      expect(pages[0]!.attributes('aria-label')).toBe('Страница 1')
      expect(pages[1]!.attributes('aria-label')).toBe('Страница 2, текущая')
    })

    it('keeps the width-reserving copy of a number out of its name', async () => {
      const wrapper = await mount({ length: 5, modelValue: 2, pageLabel: undefined })
      const page = wrapper.findAll('.ui-pagination__page')[2]!

      expect(page.find('.ui-pagination__reserve').attributes('aria-hidden')).toBe('true')
      expect(page.find('.ui-pagination__number').attributes('aria-hidden')).toBeUndefined()
    })

    it('hides the control glyphs from assistive tech', async () => {
      const wrapper = await mount({ showFirstLast: true })
      const glyphs = wrapper.findAll('.ui-icon-button .ui-icon')

      expect(glyphs).toHaveLength(4)
      expect(glyphs.every(glyph => glyph.attributes('aria-hidden') === 'true')).toBe(true)
    })
  })

  describe('current page', () => {
    it('marks exactly the current page with aria-current="page"', async () => {
      const wrapper = await mount({ modelValue: 3 })
      const marked = wrapper.findAll('[aria-current="page"]')

      expect(marked).toHaveLength(1)
      expect(marked[0]!.find('.ui-pagination__number').text()).toBe('3')
    })

    it('hides the ellipsis from assistive tech and keeps it out of the Tab order', async () => {
      const wrapper = await mount({ length: 20, modelValue: 10 })
      const ellipsis = wrapper.find('.ui-pagination__ellipsis')

      expect(ellipsis.attributes('aria-hidden')).toBe('true')
      expect(ellipsis.element.tagName).toBe('SPAN')
      expect(ellipsis.attributes('tabindex')).toBeUndefined()
    })
  })

  // B5.7a (Q24-А): at a boundary the control is soft-disabled — it keeps its
  // Tab stop instead of a native `disabled` that throws focus to <body>.
  describe('boundaries', () => {
    it('soft-disables first and previous on the first page', async () => {
      const wrapper = await mount({ showFirstLast: true, modelValue: 1 })

      for (const label of ['First page', 'Previous page']) {
        expect(control(wrapper, label).attributes('aria-disabled')).toBe('true')
        expect(control(wrapper, label).attributes('disabled')).toBeUndefined()
      }
      expect(control(wrapper, 'Next page').attributes('aria-disabled')).toBeUndefined()
    })

    it('soft-disables next and last on the last page', async () => {
      const wrapper = await mount({ showFirstLast: true, modelValue: 10 })

      for (const label of ['Next page', 'Last page']) {
        expect(control(wrapper, label).attributes('aria-disabled')).toBe('true')
        expect(control(wrapper, label).attributes('disabled')).toBeUndefined()
      }
      expect(control(wrapper, 'Previous page').attributes('aria-disabled')).toBeUndefined()
    })

    it('soft-disables every directional control when the pagination is disabled', async () => {
      const wrapper = await mount({ showFirstLast: true, modelValue: 5, disabled: true })

      for (const label of ['First page', 'Previous page', 'Next page', 'Last page']) {
        expect(control(wrapper, label).attributes('aria-disabled')).toBe('true')
      }
    })

    // A disabled pagination (a page loading) keeps the focused page button in
    // the Tab order: a native `disabled` would throw focus to <body>.
    it('soft-disables every page button when the pagination is disabled', async () => {
      const wrapper = await mount({ modelValue: 3, disabled: true })
      const pages = wrapper.findAll('.ui-pagination__page')

      expect(pages.every(page => page.attributes('aria-disabled') === 'true')).toBe(true)
      expect(pages.every(page => page.attributes('disabled') === undefined)).toBe(true)
    })

    it('hands a slotted page aria-disabled, not disabled, when the pagination is disabled', async () => {
      if (current) current.unmount()
      current = await mountSuspended(MPagination, {
        props: { ...labels, length: 3, modelValue: 1, disabled: true },
        slots: { item: ({ props: bindings }: { props: Record<string, unknown> }) => h('button', { ...bindings, class: 'custom' }, 'x') },
      })
      const page = (current as VueWrapper).find('.custom')

      expect(page.attributes('aria-disabled')).toBe('true')
      expect(page.attributes('disabled')).toBeUndefined()
    })

    it('leaves page buttons enabled when the pagination is enabled', async () => {
      const wrapper = await mount({ modelValue: 3 })

      expect(wrapper.find('.ui-pagination__page[aria-disabled]').exists()).toBe(false)
    })
  })

  describe('server render', () => {
    // B5.7b: camelCase keys in a spread bag rendered as `arialabel` in SSR HTML.
    it('hands out slot bindings that render as ARIA attributes on the server', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MPagination, { length: 3, modelValue: 3, pageLabel: (page: number) => `Page ${page}` }, {
          item: ({ props: itemProps }: { props: Record<string, unknown> }) => h('button', itemProps, 'x'),
          next: ({ props: bindings }: { props: Record<string, unknown> }) => h('button', { ...bindings, class: 'next' }, '>'),
        }),
      })))
      const next = html.match(/<button[^>]*class="next"[^>]*>/)?.[0] ?? ''

      expect(html).not.toMatch(/arialabel|ariacurrent/i)
      expect(html).toContain('aria-label="Page 3"')
      expect(html).toContain('aria-current="page"')
      expect(next).toContain('aria-disabled="true"')
      expect(next).not.toMatch(/\sdisabled/)
    })

    it('renders the current page and the boundary state of the kit controls on the server', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MPagination, { ...labels, length: 5, modelValue: 1 }),
      })))
      const previous = html.match(/<button[^>]*aria-label="Previous page"[^>]*>/)?.[0] ?? ''

      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
      expect(previous).toContain('aria-disabled="true"')
    })
  })
})
