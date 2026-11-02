import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MPagination from '../index.vue'

const labels = {
  ariaLabel: 'Pagination',
  firstLabel: 'First page',
  previousLabel: 'Previous page',
  nextLabel: 'Next page',
  lastLabel: 'Last page',
}

let current: { unmount: () => void } | null = null

async function mount(props: Record<string, unknown> = {}, slots?: Record<string, (...args: never[]) => unknown>) {
  if (current) current.unmount()
  current = await mountSuspended(MPagination, { props: { ...labels, length: 10, modelValue: 1, ...props }, slots })

  return current as VueWrapper
}

/** A two-way bound pagination, attached so focus can be observed. */
async function mountBound(initial: number, props: Record<string, unknown> = {}) {
  const page = ref(initial)

  if (current) current.unmount()
  current = await mountSuspended(defineComponent({
    render: () => h(MPagination, {
      ...labels,
      'length': 10,
      ...props,
      'modelValue': page.value,
      'onUpdate:modelValue': (value: number) => {
        page.value = value
      },
    }),
  }), { attachTo: document.body })

  return { page, wrapper: current as VueWrapper }
}

const control = (wrapper: VueWrapper, label: string) => wrapper.find(`[aria-label="${label}"]`)
const pageButton = (wrapper: VueWrapper, page: number) => wrapper.findAll('.ui-pagination__page').find(button => button.find('.ui-pagination__number').text() === String(page))!
const lastModel = (wrapper: VueWrapper) => wrapper.emitted('update:modelValue')?.at(-1)

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-pagination · interaction', () => {
  describe('pages', () => {
    it('writes a clicked page to the model', async () => {
      const wrapper = await mount()

      await pageButton(wrapper, 3).trigger('click')

      expect(lastModel(wrapper)).toEqual([3])
    })

    it('does not rewrite the model when the current page is clicked', async () => {
      const wrapper = await mount({ modelValue: 4 })

      await pageButton(wrapper, 4).trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('controls', () => {
    it.each([
      ['First page', 5, 1],
      ['Previous page', 5, 4],
      ['Next page', 5, 6],
      ['Last page', 5, 10],
    ])('%s from page %i goes to page %i', async (label, from, to) => {
      const wrapper = await mount({ modelValue: from, showFirstLast: true })

      await control(wrapper, label).trigger('click')

      expect(lastModel(wrapper)).toEqual([to])
    })

    it.each([
      ['First page', 1],
      ['Previous page', 1],
      ['Next page', 10],
      ['Last page', 10],
    ])('%s does nothing at the boundary (page %i)', async (label, page) => {
      const wrapper = await mount({ modelValue: page, showFirstLast: true })

      await control(wrapper, label).trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('keeps focus on Next when it reaches the last page', async () => {
      const { page, wrapper } = await mountBound(9)
      const next = wrapper.find<HTMLButtonElement>('[aria-label="Next page"]')

      next.element.focus()
      await next.trigger('click')
      await nextTick()

      expect(page.value).toBe(10)
      expect(next.attributes('aria-disabled')).toBe('true')
      expect(document.activeElement).toBe(next.element)

      await next.trigger('click')
      expect(page.value).toBe(10)
    })

    it('runs a slotted control through the bindings it is handed', async () => {
      const wrapper = await mount({ modelValue: 4 }, {
        next: ({ props: bindings }: { props: Record<string, unknown> }) => h('button', { ...bindings, class: 'custom-next' }, '>'),
      })

      await wrapper.find('.custom-next').trigger('click')

      expect(lastModel(wrapper)).toEqual([5])
    })

    it('runs a slotted page through the bindings it is handed', async () => {
      const wrapper = await mount({ length: 5, modelValue: 2 }, {
        item: ({ page, props: bindings }: { page: number, props: Record<string, unknown> }) => h('button', { ...bindings, class: 'custom' }, String(page)),
      })

      await wrapper.findAll('.custom')[3]!.trigger('click')

      expect(lastModel(wrapper)).toEqual([4])
    })
  })

  describe('disabled', () => {
    it('ignores every control and page', async () => {
      const wrapper = await mount({ modelValue: 3, disabled: true, showFirstLast: true })

      await pageButton(wrapper, 1).trigger('click')
      for (const label of ['First page', 'Previous page', 'Next page', 'Last page']) {
        await control(wrapper, label).trigger('click')
      }

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('ignores a slotted control', async () => {
      const wrapper = await mount({ modelValue: 3, disabled: true }, {
        next: ({ props: bindings }: { props: Record<string, unknown> }) => h('button', { ...bindings, class: 'custom-next' }, '>'),
      })

      await wrapper.find('.custom-next').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  // The plan: focus stays on the pressed page; if that button leaves the window,
  // focus goes to the current page rather than to <body>.
  describe('focus', () => {
    it('moves focus to the current page when the focused page button leaves the window', async () => {
      const length = ref(10)
      const page = ref(9)

      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MPagination, {
          ...labels,
          'length': length.value,
          'modelValue': page.value,
          'onUpdate:modelValue': (value: number) => {
            page.value = value
          },
        }),
      }), { attachTo: document.body })
      const wrapper = current as VueWrapper

      ;(pageButton(wrapper, 10).element as HTMLButtonElement).focus()
      length.value = 4
      await flushPromises()

      expect(page.value).toBe(4)
      expect(document.activeElement).toBe(wrapper.find('[aria-current="page"]').element)
    })

    it('leaves focus alone when it was outside the pagination', async () => {
      const length = ref(10)
      const outside = document.createElement('button')
      document.body.append(outside)

      if (current) current.unmount()
      current = await mountSuspended(defineComponent({
        render: () => h(MPagination, { ...labels, length: length.value, modelValue: 9 }),
      }), { attachTo: document.body })

      outside.focus()
      length.value = 4
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(outside)
      outside.remove()
    })
  })

  describe('model normalization', () => {
    it('normalizes the model down when length shrinks', async () => {
      const wrapper = await mount({ modelValue: 8 })

      await wrapper.setProps({ length: 5 })

      expect(lastModel(wrapper)).toEqual([5])
    })

    it.each([
      [0, 1],
      [-3, 1],
      [42, 10],
      [3.7, 3],
    ])('normalizes an initial model of %s to %i', async (initial, normalized) => {
      const wrapper = await mount({ modelValue: initial })

      expect(lastModel(wrapper)).toEqual([normalized])
    })

    it('leaves a valid model alone', async () => {
      const wrapper = await mount({ modelValue: 4 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('moves the current page with a model changed by the parent', async () => {
      const wrapper = await mount({ modelValue: 2, length: 5 })

      await wrapper.setProps({ modelValue: 5 })

      expect(wrapper.find('[aria-current="page"] .ui-pagination__number').text()).toBe('5')
    })
  })
})
