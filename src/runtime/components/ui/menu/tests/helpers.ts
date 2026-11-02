import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import MMenu from '../index.vue'
import MMenuItem from '../item/index.vue'
import { mountTracked } from '../../overlay/tests/helpers'

export type Items = () => VNode | VNode[] | string | undefined

export const clicks: string[] = []

const item = (name: string, extra: Record<string, unknown> = {}) =>
  h(MMenuItem, { class: `item-${name.toLowerCase()}`, label: name, onSelect: () => clicks.push(name), ...extra })

export const threeItems: Items = () => [item('Alpha'), item('Beta'), item('Gamma')]
export const withDisabled: Items = () => [item('Alpha'), item('Beta', { disabled: true }), item('Gamma')]

/**
 * A real trigger: the menu's hidden anchor sits inside it, and without an
 * `anchor` prop its parent element is what the menu attaches to.
 */
export async function mountMenu(props: Record<string, unknown> = {}, items: Items = threeItems, triggerAttrs: Record<string, unknown> = {}) {
  clicks.length = 0
  const open = ref(Boolean(props.modelValue))
  const outside: number[] = []
  const Harness = defineComponent({
    setup: () => () => h('div', { class: 'page' }, [
      h('button', { class: 'before' }, 'Before'),
      h('button', { class: 'trigger', onClick: () => { open.value = !open.value }, ...triggerAttrs }, [
        'Actions',
        h(MMenu, {
          ...props,
          'modelValue': open.value,
          'onUpdate:modelValue': (value: boolean) => { open.value = value },
          'onClickOutside': () => outside.push(1),
        }, { default: items }),
      ]),
      h('button', { class: 'after' }, 'After'),
    ]),
  })
  const wrapper = await mountTracked(Harness, { attachTo: document.body })
  await nextTick()
  return { open, outside, wrapper }
}

/** A menu opened from its `#activator` slot: the slot's element is the trigger. */
export async function mountWithActivator(props: Record<string, unknown> = {}, items: Items = threeItems) {
  clicks.length = 0
  const open = ref(Boolean(props.modelValue))
  const Harness = defineComponent({
    setup: () => () => h('div', { class: 'page' }, [
      h(MMenu, {
        ...props,
        'modelValue': open.value,
        'onUpdate:modelValue': (value: boolean) => { open.value = value },
      }, {
        activator: ({ props: trigger }: { props: Record<string, unknown> }) => h('button', { class: 'trigger', ...trigger }, 'Actions'),
        default: items,
      }),
      h('button', { class: 'after' }, 'After'),
    ]),
  })
  const wrapper = await mountTracked(Harness, { attachTo: document.body })
  await nextTick()
  return { open, wrapper }
}

/** Opens a menu that was mounted closed, so the open watcher runs. */
export async function openMenu(open: { value: boolean }) {
  open.value = true
  await nextTick()
  await nextTick()
}

export const surface = () => document.querySelector<HTMLElement>('.ui-menu__surface')
export const wrapperEl = () => document.querySelector<HTMLElement>('.ui-menu')
export const menuItems = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-menu__surface .ui-menu__item'))
export const triggerEl = () => document.querySelector<HTMLElement>('.trigger')!
