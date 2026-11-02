import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideValidationAdapter } from '#kit/composables/validation/context'
import type { ValidationAdapter } from '#kit/composables/validation/types'
import MTextField from '../index.vue'

let current: { unmount: () => void } | null = null

async function mount(
  props: Record<string, unknown> = {},
  options: { attrs?: Record<string, unknown>, slots?: Record<string, (...args: never[]) => unknown>, attach?: boolean } = {},
) {
  if (current) current.unmount()
  current = await mountSuspended(MTextField, {
    props,
    attrs: options.attrs,
    slots: options.slots,
    attachTo: options.attach ? document.body : undefined,
  })

  return current as VueWrapper
}

function withAdapter(adapter: ValidationAdapter, props: Record<string, unknown>) {
  return mountSuspended(defineComponent({
    setup() {
      provideValidationAdapter(adapter)
      return () => h(MTextField, props)
    },
  }))
}

afterEach(() => {
  current?.unmount()
  current = null
})

describe('m-text-field · interaction', () => {
  describe('model', () => {
    it('updates v-model on input', async () => {
      const wrapper = await mount()

      await wrapper.find('input').setValue('hello')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['hello'])
    })

    it('shows a numeric 0 as a value', async () => {
      const wrapper = await mount({ label: 'Count', modelValue: 0 as never })

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0')
    })

    it('keeps the affixes out of the model', async () => {
      const wrapper = await mount({ prefix: '$' })

      await wrapper.find('input').setValue('12')

      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['12'])
    })

    it('shows a model written from outside', async () => {
      const wrapper = await mount({ modelValue: 'a' })

      await wrapper.setProps({ modelValue: 'b' })

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('b')
    })
  })

  describe('focus', () => {
    it('tracks focus on the root class and on the focused model', async () => {
      const wrapper = await mount()
      const input = wrapper.find('input')

      await input.trigger('focus')
      expect(wrapper.classes()).toContain('ui-text-field--focused')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])

      await input.trigger('blur')
      expect(wrapper.classes()).not.toContain('ui-text-field--focused')
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([false])
    })

    it('makes the whole box act as the input: a press focuses it, a click reaches it', async () => {
      const onClick = vi.fn()
      const wrapper = await mount({}, { attrs: { onClick }, slots: { prepend: () => h('i', 'P') }, attach: true })
      const input = wrapper.find('input').element

      await wrapper.find('.ui-text-field__icon--prepend i').trigger('pointerdown', { button: 0 })
      expect(document.activeElement).toBe(input)

      await wrapper.find('.ui-text-field__control').trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)

      await wrapper.find('input').trigger('click')
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('leaves a press on a slotted button to the button', async () => {
      const wrapper = await mount({}, { slots: { append: () => h('button', { type: 'button' }, 'x') }, attach: true })

      await wrapper.find('.ui-text-field__icon--append button').trigger('pointerdown', { button: 0 })

      expect(document.activeElement).not.toBe(wrapper.find('input').element)
    })

    it('ignores a secondary-button press on the box', async () => {
      const wrapper = await mount({}, { attach: true })

      await wrapper.find('.ui-text-field__control').trigger('pointerdown', { button: 2 })

      expect(document.activeElement).not.toBe(wrapper.find('input').element)
    })

    it('exposes the drawn box and the input to a composite', async () => {
      const wrapper = await mount()
      const parts = wrapper.vm as unknown as { control: HTMLElement, input: HTMLInputElement }

      expect(parts.control).toBe(wrapper.find('.ui-text-field__control').element)
      expect(parts.input).toBe(wrapper.find('input').element)
    })
  })

  describe('attributes', () => {
    it('passes attributes and listeners to the native input, keeps class on the root', async () => {
      let keydowns = 0
      const wrapper = await mount({}, {
        attrs: { 'class': 'consumer', 'aria-label': 'Search', 'inputmode': 'search', 'onKeydown': () => { keydowns++ } },
      })
      const input = wrapper.find('input')

      expect(wrapper.classes()).toContain('consumer')
      expect(input.attributes('aria-label')).toBe('Search')
      expect(input.attributes('inputmode')).toBe('search')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      await input.trigger('keydown', { key: 'a' })
      expect(keydowns).toBe(1)
    })

    it('lets a composite field mark the input busy through inputAttrs', async () => {
      const wrapper = await mount({ inputAttrs: { 'aria-busy': true } })

      expect(wrapper.find('input').attributes('aria-busy')).toBe('true')
    })

    it('chains a composite listener and the field\'s own focus tracking', async () => {
      const onFocus = vi.fn()
      const wrapper = await mount({ inputAttrs: { onFocus } })

      await wrapper.find('input').trigger('focus')

      expect(onFocus).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])
    })

    it('submits under name, falling back to the adapter path', async () => {
      const named = await mount({ name: 'email', path: 'user.email' })
      expect(named.find('input').attributes('name')).toBe('email')

      const fromPath = await mount({ path: 'user.email' })
      expect(fromPath.find('input').attributes('name')).toBe('user.email')
    })

    it.each([
      ['autocomplete', { autocomplete: 'email' }, 'email'],
      ['autofocus', { autofocus: true }, ''],
      ['required', { required: true }, ''],
    ])('forwards %s to the native input', async (attribute, props, value) => {
      const wrapper = await mount(props)

      expect(wrapper.find('input').attributes(attribute)).toBe(value)
    })
  })

  describe('validation', () => {
    it('does not announce invalid before the error is shown', async () => {
      // An engine that has already validated silently: invalid meta, no message yet.
      const silentlyInvalid: ValidationAdapter = {
        bindField: <T>() => ({
          value: ref('') as never,
          errorMessage: ref<string | undefined>(undefined),
          meta: { required: true, touched: false, dirty: false, valid: false, validated: true, pending: false } as never,
        }) as never,
        createForm: () => { throw new Error('unused') },
      }
      const wrapper = await withAdapter(silentlyInvalid, { path: 'email', label: 'Email' })

      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
      wrapper.unmount()
    })

    it('shows the adapter\'s error on the support line', async () => {
      const failing: ValidationAdapter = {
        bindField: () => ({
          value: ref(''),
          errorMessage: ref<string | undefined>('Taken'),
          meta: { required: false, touched: true, dirty: true, valid: false, validated: true, pending: false },
        }) as never,
        createForm: () => { throw new Error('unused') },
      }
      const wrapper = await withAdapter(failing, { path: 'email', label: 'Email' })

      expect(wrapper.find('[role="alert"]').text()).toBe('Taken')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
      wrapper.unmount()
    })
  })

  describe('server render', () => {
    it('ships the label association, the reserved line and its alert region in the first frame', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTextField, { label: 'Email', helperText: 'Work address' }),
      })))
      const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1]

      expect(inputId).toBeTruthy()
      expect(html).toContain(`for="${inputId}"`)
      expect(html).toContain('role="alert"')
      expect(html).toMatch(/<input[^>]*aria-describedby="[^"]+"/)
    })

    it('renders the slot modifiers on the server, not after hydration', async () => {
      const html = await renderToString(createSSRApp(defineComponent({
        render: () => h(MTextField, null, { prepend: () => 'P' }),
      })))

      expect(html).toContain('ui-text-field--prepend')
    })
  })
})
