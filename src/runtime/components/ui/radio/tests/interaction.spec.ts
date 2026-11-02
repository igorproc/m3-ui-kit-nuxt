import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { MRadio, MRadioGroup, mount, mountGroup, mountWithAdapter, stubAdapter, unmountCurrent } from './helpers'

afterEach(unmountCurrent)

describe('m-radio · interaction', () => {
  describe('standalone model', () => {
    it('selects its value on change, once', async () => {
      const wrapper = await mount({ value: 'a' })

      await wrapper.find('input').trigger('change')

      expect(wrapper.emitted('update:modelValue')).toEqual([['a']])
    })

    it('does not select while disabled', async () => {
      const wrapper = await mount({ value: 'a', disabled: true })

      await wrapper.find('input').trigger('change')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('follows a model the parent changes', async () => {
      const wrapper = await mount({ value: 'a', modelValue: 'b' })

      await wrapper.setProps({ modelValue: 'a' })

      expect(wrapper.classes()).toContain('ui-radio--checked')
    })
  })

  describe('group model', () => {
    it('writes the chosen radio to the group model', async () => {
      const { wrapper, model } = await mountGroup()

      await wrapper.findAll('input')[1]!.trigger('change')

      expect(model.value).toBe('b')
    })

    it('moves the check when the model changes after mount', async () => {
      const { wrapper, model } = await mountGroup({ modelValue: 'a' })

      model.value = 'c'
      await nextTick()
      await nextTick()

      const checked = wrapper.findAll('.ui-radio').map(radio => radio.classes().includes('ui-radio--checked'))
      expect(checked).toEqual([false, false, true])
    })

    it('registers a new value when a mounted radio changes it, and a checked radio carries the model along', async () => {
      const second = ref('b')
      const model = ref<unknown>()
      const wrapper = await mountSuspended(defineComponent({
        setup: () => () => h(
          MRadioGroup as never,
          { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value } },
          () => [h(MRadio, { value: 'a', label: 'A' }), h(MRadio, { value: second.value, label: 'B' })],
        ),
      }))

      second.value = 'b2'
      await nextTick()
      await wrapper.findAll('input')[1]!.trigger('change')
      await nextTick()
      expect(model.value).toBe('b2')

      second.value = 'b3'
      await nextTick()
      await nextTick()
      expect(model.value).toBe('b3')
      expect(wrapper.findAll('.ui-radio')[1]!.classes()).toContain('ui-radio--checked')
      wrapper.unmount()
    })

    it('ignores a press on a disabled radio of the group', async () => {
      const { wrapper, model } = await mountGroup({ modelValue: 'a' }, ['a', { value: 'b', disabled: true }])

      await wrapper.findAll('input')[1]!.trigger('change')

      expect(model.value).toBe('a')
    })

    it('ignores every press in a disabled group', async () => {
      const { wrapper, model } = await mountGroup({ disabled: true })

      await wrapper.findAll('input')[0]!.trigger('change')

      expect(model.value).toBeUndefined()
    })
  })

  describe('validation adapter', () => {
    it('binds a standalone radio to its field', async () => {
      const { adapter, value } = stubAdapter('a')
      const wrapper = await mountWithAdapter(adapter, () => [
        h(MRadio, { value: 'a', path: 'delivery' }),
      ])

      expect(wrapper.find('.ui-radio').classes()).toContain('ui-radio--checked')
      expect(value.value).toBe('a')
    })

    it('binds a group to its field and checks the matching radio', async () => {
      const { adapter, value } = stubAdapter('b')
      const wrapper = await mountWithAdapter(adapter, () => h(MRadioGroup, { path: 'delivery' }, () => [
        h(MRadio, { value: 'a' }),
        h(MRadio, { value: 'b' }),
      ]))
      await nextTick()

      expect((wrapper.findAll('input')[1]!.element as HTMLInputElement).checked).toBe(true)

      await wrapper.findAll('input')[0]!.trigger('change')
      await nextTick()

      expect(value.value).toBe('a')
    })
  })

  describe('focus', () => {
    it('puts focus on the native control', async () => {
      const wrapper = await mount({ value: 'a', label: 'A' }, undefined, true)
      const input = wrapper.find('input').element as HTMLInputElement

      input.focus()

      expect(document.activeElement).toBe(input)
    })
  })

  describe('server render', () => {
    it('ships a standalone check in the first frame', async () => {
      const html = await renderToString(createSSRApp({ render: () => h(MRadio, { value: 'a', modelValue: 'a', label: 'A' }) }))

      expect(html).toContain('ui-radio--checked')
      expect(html).toMatch(/<input[^>]*\schecked[\s>]/)
    })

    it('ships the radio matching a preset group model in the first frame', async () => {
      const html = await renderToString(createSSRApp({
        render: () => h(MRadioGroup, { modelValue: 'b' }, () => [
          h(MRadio, { value: 'a', label: 'A' }),
          h(MRadio, { value: 'b', label: 'B' }),
        ]),
      }))

      expect(html.match(/ui-radio--checked/g)).toHaveLength(1)
      expect(html).toMatch(/<input[^>]*\schecked[^>]*value="b"|<input[^>]*value="b"[^>]*\schecked/)
    })
  })
})
