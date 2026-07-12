import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MDialog from '../app/components/ui/dialog/index.vue'

// MDialog now renders through <MOverlay>, which teleports into #ui-overlay-host.
beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  document.getElementById('ui-overlay-host')?.remove()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

function mountDialog(dialogProps: Record<string, unknown> = {}, content = 'Body') {
  const model = ref(Boolean(dialogProps.modelValue))
  const Harness = defineComponent({
    setup: () => () => h(
      MDialog,
      {
        ...dialogProps,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: boolean) => { model.value = value },
      },
      { default: () => content },
    ),
  })
  return { model, mount: () => mountSuspended(Harness) }
}

describe('m-dialog', () => {
  it('does not render while closed', async () => {
    const { mount } = mountDialog({ modelValue: false })
    await mount()

    expect(document.querySelector('.ui-dialog')).toBeNull()
  })

  it('renders role="dialog" + aria-modal, teleported and named by its title', async () => {
    const { mount } = mountDialog({ modelValue: true, title: 'Confirm' })
    await mount()
    await nextTick()

    const dialog = document.getElementById('ui-overlay-host')!.querySelector('.ui-dialog')!
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const headlineId = dialog.getAttribute('aria-labelledby')
    expect(headlineId).toBeTruthy()
    expect(document.getElementById(headlineId!)?.textContent).toBe('Confirm')
  })

  it('closes on a scrim click by default', async () => {
    const { model, mount } = mountDialog({ modelValue: true })
    await mount()
    await nextTick()

    ;(document.querySelector('.ui-overlay__scrim') as HTMLElement).click()
    await nextTick()

    expect(model.value).toBe(false)
  })

  it('does not close on scrim click when click-to-close is disabled', async () => {
    const { model, mount } = mountDialog({ modelValue: true, clickToClose: false })
    await mount()
    await nextTick()

    ;(document.querySelector('.ui-overlay__scrim') as HTMLElement).click()
    await nextTick()

    expect(model.value).toBe(true)
  })

  it('renders title, content and actions regions', async () => {
    const model = ref(true)
    const Harness = defineComponent({
      setup: () => () => h(
        MDialog,
        { 'modelValue': model.value, 'onUpdate:modelValue': (v: boolean) => { model.value = v }, 'title': 'T' },
        { default: () => 'Content', actions: () => h('button', { class: 'act' }, 'OK') },
      ),
    })
    await mountSuspended(Harness)
    await nextTick()

    const host = document.getElementById('ui-overlay-host')!
    expect(host.querySelector('.ui-dialog__headline')?.textContent).toBe('T')
    expect(host.querySelector('.ui-dialog__content')?.textContent).toContain('Content')
    expect(host.querySelector('.ui-dialog__actions .act')).not.toBeNull()
  })
})
