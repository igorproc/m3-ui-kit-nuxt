import { h } from 'vue'
import type { VNode } from 'vue'
import MTooltip from '../index.vue'
import { mountTracked } from '../../overlay/tests/helpers'

type Slot = (scope: { props: Record<string, unknown> }) => VNode | string

export const plainTrigger: Slot = () => h('button', { class: 'target' }, 'Trigger')
export const boundTrigger: Slot = ({ props }) => h('button', { class: 'target', ...props }, 'Trigger')

export async function mountTooltip(props: Record<string, unknown> = { text: 'Hint' }, slots: Record<string, Slot | (() => unknown)> = {}) {
  return mountTracked(MTooltip, { props, slots: { default: plainTrigger, ...slots }, attachTo: document.body })
}

export const surface = () => document.querySelector<HTMLElement>('.ui-tooltip__content')
/** The surface stays in the DOM; `v-show` hides it between showings. */
export const isShown = () => Boolean(surface()) && surface()!.style.display !== 'none'

/** Longer than the tooltip's hide grace period. */
export const waitForHideDelay = () => new Promise(resolve => setTimeout(resolve, 150))
