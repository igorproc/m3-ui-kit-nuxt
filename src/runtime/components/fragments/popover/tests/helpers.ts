import { defineComponent, h, nextTick, ref } from 'vue'
import type { VNode } from 'vue'
import Popover from '../index.vue'
import { mountTracked } from '../../../ui/overlay/tests/helpers'

export const picker = () => [
  h('input', { class: 'hex', value: '#6750a4' }),
  h('button', { class: 'swatch' }, 'Swatch'),
]

export async function mountPopover(props: Record<string, unknown> = {}, content: () => VNode | VNode[] = picker) {
  const open = ref(Boolean(props.modelValue))
  const outside: number[] = []
  const Harness = defineComponent({
    setup: () => () => h('div', { class: 'page' }, [
      h('button', { class: 'trigger', onClick: () => { open.value = !open.value } }, [
        'Colour',
        h(Popover, {
          ...props,
          'modelValue': open.value,
          'onUpdate:modelValue': (value: boolean) => { open.value = value },
          'onClickOutside': () => outside.push(1),
        }, { default: content }),
      ]),
      h('button', { class: 'after' }, 'After'),
    ]),
  })
  const wrapper = await mountTracked(Harness, { attachTo: document.body })
  await nextTick()
  return { open, outside, wrapper }
}

export async function openPopover(open: { value: boolean }) {
  open.value = true
  await nextTick()
  await nextTick()
}

export const panel = () => document.querySelector<HTMLElement>('.ui-popover__surface')
export const wrapperEl = () => document.querySelector<HTMLElement>('.ui-popover')
export const triggerEl = () => document.querySelector<HTMLElement>('.trigger')!

export function pointerClick(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  ;(el as HTMLElement).click()
}
