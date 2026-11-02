import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { createSSRApp, createTextVNode, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useNuxtApp } from '#app'
import type { DynamicModal } from '#kit/composables/modal/createModalService'
import CoreGlobalContainer from '../global-container.vue'

let current: { unmount: () => void } | null = null

async function mount() {
  if (current) current.unmount()
  current = await mountSuspended(CoreGlobalContainer)

  return current as VueWrapper
}

const Dialog = defineComponent({
  props: { title: { type: String, default: '' } },
  setup: (props, { slots }) => () => h('section', { 'data-testid': 'dialog' }, [h('h2', props.title), slots.default?.()]),
})

const modal = (id: string, title: string): DynamicModal => ({
  id,
  component: Dialog,
  props: { title },
  slots: { default: () => [createTextVNode(`Body of ${id}`)] },
})

afterEach(() => {
  current?.unmount()
  current = null
  useNuxtApp().$material.modal.dynamicModals.splice(0)
})

describe('core · interaction', () => {
  describe('core-global-container', () => {
    it('renders each programmatic modal with its props and slots', async () => {
      const wrapper = await mount()
      const { dynamicModals } = useNuxtApp().$material.modal

      dynamicModals.push(modal('first', 'First'), modal('second', 'Second'))
      await nextTick()

      const dialogs = wrapper.findAll('[data-testid="dialog"]')
      expect(dialogs.map(dialog => dialog.find('h2').text())).toEqual(['First', 'Second'])
      expect(dialogs[1]!.text()).toContain('Body of second')
    })

    it('unmounts a modal once the service drops it', async () => {
      const wrapper = await mount()
      const { dynamicModals } = useNuxtApp().$material.modal

      dynamicModals.push(modal('first', 'First'), modal('second', 'Second'))
      await nextTick()
      dynamicModals.splice(0, 1)
      await nextTick()

      expect(wrapper.findAll('[data-testid="dialog"]').map(dialog => dialog.find('h2').text())).toEqual(['Second'])
    })

    // Programmatic modals open from user interaction: the server output carries none of them.
    it('renders no programmatic modal into the server HTML', async () => {
      useNuxtApp().$material.modal.dynamicModals.push(modal('first', 'First'))

      const html = await renderToString(createSSRApp(defineComponent({ render: () => h(CoreGlobalContainer) })))

      expect(html).toContain('ui-dialog-global-container')
      expect(html).not.toContain('data-testid="dialog"')
    })
  })
})
