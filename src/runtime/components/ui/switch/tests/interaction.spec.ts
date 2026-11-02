import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import MSwitch from '../index.vue'
import { mount, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-switch · interaction', () => {
  describe('model', () => {
    it('writes a switch-on through to the model, once', async () => {
      const wrapper = await mount({ modelValue: false })

      await wrapper.find('input').setValue(true)

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    })

    it('writes a switch-off through to the model', async () => {
      const wrapper = await mount({ modelValue: true })

      await wrapper.find('input').setValue(false)

      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('follows a model the parent changes', async () => {
      const wrapper = await mount({ modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.classes()).toContain('ui-switch--checked')
      expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)
    })
  })

  describe('validation adapter', () => {
    it('takes its value from the bound field', async () => {
      const { adapter } = stubAdapter(true)
      const wrapper = await mountWithAdapter(adapter)

      expect(wrapper.find('.ui-switch').classes()).toContain('ui-switch--checked')
    })

    it('coerces a non-boolean field value to the switch contract', async () => {
      const { adapter } = stubAdapter(1)
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

    it('stays a plain controlled switch without an adapter, even with a path', async () => {
      const wrapper = await mount({ path: 'wifi' })

      await wrapper.find('input').setValue(true)

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
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
      const wrapper = await mount({ label: 'Wi-Fi' }, undefined, true)
      const input = wrapper.find('input').element as HTMLInputElement

      input.focus()

      expect(document.activeElement).toBe(input)
    })
  })

  describe('server render', () => {
    it('ships the role and the on state in the first frame', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MSwitch, { modelValue: true, label: 'Wi-Fi' }) }))

      expect(html).toContain('ui-switch--checked')
      expect(html).toContain('role="switch"')
      expect(html).toMatch(/<input[^>]*\schecked[\s>]/)
    })
  })
})
