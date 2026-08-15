import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import MSnackbar from './index.vue'

describe('m-snackbar', () => {
  // Teleported content is appended to <body>; clear leftovers between cases so
  // queries never match a stale node from a previous mount.
  afterEach(() => {
    document.querySelectorAll('.ui-snackbar').forEach(node => node.remove())
  })

  it('renders nothing while the v-model is closed', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: false, label: 'Saved' },
    })

    expect(document.querySelector('.ui-snackbar')).toBeNull()
  })

  it('renders a status region with the label when open', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
    })

    const snackbar = document.querySelector('.ui-snackbar')
    expect(snackbar).not.toBeNull()
    expect(snackbar!.getAttribute('role')).toBe('status')
    expect(snackbar!.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('.ui-snackbar__label')!.textContent).toContain('Saved')
  })

  it('omits the action button when no actionLabel is provided', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
    })

    expect(document.querySelector('.ui-snackbar__action')).toBeNull()
  })

  it('renders the action button and emits `action` plus closes via v-model on click', async () => {
    const wrapper = await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved', actionLabel: 'Undo' },
    })

    const action = document.querySelector('.ui-snackbar__action') as HTMLButtonElement
    expect(action).not.toBeNull()
    expect(action.textContent).toContain('Undo')

    action.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('action')).toHaveLength(1)
    // v-model is closed exactly once (no duplicate emit alongside `action`).
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('prefers the default slot over the label prop', async () => {
    await mountSuspended(MSnackbar, {
      props: { modelValue: true, label: 'Saved' },
      slots: { default: () => 'Custom message' },
    })

    expect(document.querySelector('.ui-snackbar__label')!.textContent).toContain('Custom message')
  })
})
