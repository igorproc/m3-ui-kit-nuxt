import { defineComponent, h, ref } from 'vue'
import type { VNode } from 'vue'
import { mountTracked, settle } from '#kit/components/ui/overlay/tests/helpers'
import MNavigationDrawer from '../index.vue'

type Slots = Record<string, (scope: never) => VNode | VNode[] | string>

/**
 * Mounts the drawer behind a two-way `v-model`, records the lifecycle events
 * and waits for the opening transition to settle.
 */
export async function mountDrawer(props: Record<string, unknown> = {}, slots: Slots = {}, attrs: Record<string, unknown> = {}) {
  const model = ref(Boolean(props.modelValue ?? true))
  const events: string[] = []
  const Harness = defineComponent({
    setup: () => () => h(MNavigationDrawer, {
      ...props,
      ...attrs,
      'modelValue': model.value,
      'onUpdate:modelValue': (value: boolean) => {
        model.value = value
      },
      'onOpened': () => events.push('opened'),
      'onClosed': () => events.push('closed'),
    }, { default: () => 'Destinations', ...slots }),
  })
  const wrapper = await mountTracked(Harness)
  await settle()

  return { model, events, wrapper }
}

export const drawerPanel = () => document.querySelector<HTMLElement>('.ui-navigation-drawer')
export const drawerDialog = () => document.querySelector<HTMLDialogElement>('dialog.ui-overlay')
