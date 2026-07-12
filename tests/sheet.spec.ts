import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import MSheet from '../app/components/ui/sheet/index.vue'

describe('m-sheet', () => {
  // vue-final-modal teleports its content to <body>; clear leftovers between
  // cases so queries never match a stale node from a previous mount.
  afterEach(() => {
    document.querySelectorAll('.ui-sheet').forEach(node => node.remove())
  })

  it('mounts without rendering sheet content while the v-model is closed', async () => {
    await mountSuspended(MSheet, {
      props: { modelValue: false },
      slots: { default: () => 'Sheet body' },
    })

    expect(document.querySelector('.ui-sheet__content')).toBeNull()
  })

  it('renders the default slot content when open', async () => {
    await mountSuspended(MSheet, {
      props: { modelValue: true },
      slots: { default: () => 'Sheet body' },
    })

    const content = document.querySelector('.ui-sheet__content')
    expect(content).not.toBeNull()
    expect(content!.textContent).toContain('Sheet body')
  })

  it('renders the drag handle affordance when open', async () => {
    await mountSuspended(MSheet, {
      props: { modelValue: true },
      slots: { default: () => 'Body' },
    })

    expect(document.querySelector('.ui-sheet__drag-handle')).not.toBeNull()
  })

  it('exposes a close() method', async () => {
    const wrapper = await mountSuspended(MSheet, {
      props: { modelValue: true },
      slots: { default: () => 'Body' },
    })

    expect(typeof (wrapper.vm as unknown as { close: () => void }).close).toBe('function')
  })
})
