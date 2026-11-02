import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MChip from '../index.vue'

type Slots = Record<string, (...args: never[]) => unknown>

let current: { unmount: () => void } | null = null

/** Mounts one chip at a time (default label "Label"); the previous one is unmounted first. */
export async function mount(props: Record<string, unknown> = {}, slots: Slots = { default: () => 'Label' }, attach = false) {
  unmountCurrent()
  current = await mountSuspended(MChip, { props, slots, ...(attach ? { attachTo: document.body } : {}) })

  return current as VueWrapper
}

export function unmountCurrent() {
  current?.unmount()
  current = null
}

export const TYPES = ['assist', 'filter', 'input', 'suggestion'] as const
