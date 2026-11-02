import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MCheckbox from '../index.vue'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-checkbox · interaction', () => {
  describe('model', () => {
    it('writes a check through to the model, once', async () => {
      const wrapper = await mount({ modelValue: false })

      await wrapper.find('input').setValue(true)

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    })

    it('writes an uncheck through to the model', async () => {
      const wrapper = await mount({ modelValue: true })

      await wrapper.find('input').setValue(false)

      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('follows a model the parent changes', async () => {
      const wrapper = await mount({ modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.classes()).toContain('ui-checkbox--checked')
      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('indeterminate', () => {
    it('sets the DOM property the browser has no attribute for', async () => {
      const wrapper = await mount({ indeterminate: true })

      expect((wrapper.find('input').element as HTMLInputElement).indeterminate).toBe(true)
    })

    it('follows the prop both ways after mount', async () => {
      const wrapper = await mount({ indeterminate: false })
      const input = wrapper.find('input').element as HTMLInputElement

      await wrapper.setProps({ indeterminate: true })
      expect(input.indeterminate).toBe(true)

      await wrapper.setProps({ indeterminate: false })
      expect(input.indeterminate).toBe(false)
    })

    it('resolves to checked on activation and reports the mixed state gone', async () => {
      const wrapper = await mount({ modelValue: false, indeterminate: true }, undefined, true)

      // The browser's activation behaviour: checked flips, indeterminate clears, then `change`.
      ;(wrapper.find('input').element as HTMLInputElement).click()
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]])
    })

    it('keeps a mixed box that the parent holds mixed', async () => {
      // A `v-model:indeterminate` whose owner refuses the change: the prop stays true.
      const wrapper = await mountSuspended(defineComponent({
        render: () => h(MCheckbox, { 'indeterminate': true, 'onUpdate:indeterminate': () => {} }),
      }), { attachTo: document.body })
      const input = wrapper.find('input').element as HTMLInputElement

      input.click()
      await nextTick()

      expect(input.indeterminate).toBe(true)
      expect(wrapper.find('.ui-checkbox').classes()).toContain('ui-checkbox--indeterminate')
      wrapper.unmount()
    })

    it('reports nothing about indeterminate on an ordinary toggle', async () => {
      const wrapper = await mount({ modelValue: false })

      await wrapper.find('input').setValue(true)

      expect(wrapper.emitted('update:indeterminate')).toBeUndefined()
    })
  })

  describe('validation adapter', () => {
    it('takes its value from the bound field', async () => {
      const { adapter } = stubAdapter(true)
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('.ui-checkbox').classes()).toContain('ui-checkbox--checked')
    })

    it('coerces a non-boolean field value to the checkbox contract', async () => {
      const { adapter } = stubAdapter('yes')
      const wrapper = await mountWithAdapter(adapter)

      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)
    })

    it('writes a user toggle back to the field', async () => {
      const { adapter, value } = stubAdapter(false)
      const wrapper = await mountWithAdapter(adapter)

      await wrapper.find('input').setValue(true)
      await nextTick()

      expect(value.value).toBe(true)
    })

    it('stays a plain controlled checkbox without an adapter, even with a path', async () => {
      const wrapper = await mount({ path: 'terms' })

      await wrapper.find('input').setValue(true)

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
      expect(wrapper.classes()).not.toContain('ui-checkbox--error')
    })
  })

  describe('disabled', () => {
    it('leaves the native control disabled, so the browser drops clicks and Space', async () => {
      const wrapper = await mount({ disabled: true })

      expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true)
    })
  })

  describe('focus', () => {
    it('puts focus on the native control', async () => {
      const wrapper = await mount({ label: 'Remember me' }, undefined, true)
      const input = wrapper.find('input').element as HTMLInputElement

      input.focus()

      expect(document.activeElement).toBe(input)
    })
  })

  describe('server render', () => {
    it('ships the checked state in the first frame', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MCheckbox, { modelValue: true, label: 'Accept' }) }))

      expect(html).toContain('ui-checkbox--checked')
      expect(html).toMatch(/<input[^>]*\schecked[\s>]/)
    })

    it('draws a mixed box in the first frame, before the DOM property can be set', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MCheckbox, { indeterminate: true, label: 'All' }) }))

      expect(html).toContain('ui-checkbox--indeterminate')
    })
  })
})
