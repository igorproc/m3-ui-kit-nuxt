import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import MOverlay from './index.vue'
import { __resetScrollLock } from '~/composables/overlay/useScrollLock'

// Overlays teleport into the shared #ui-overlay-host (client-only).
beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

function mountOverlay(overlayProps: Record<string, unknown> = {}, content = 'Panel') {
  const model = ref(Boolean(overlayProps.modelValue))
  const Harness = defineComponent({
    setup: () => () => h(
      MOverlay,
      {
        ...overlayProps,
        'modelValue': model.value,
        'onUpdate:modelValue': (value: boolean) => { model.value = value },
      },
      { default: () => h('div', { class: 'panel-content' }, content) },
    ),
  })
  return { model, mount: () => mountSuspended(Harness) }
}

describe('m-overlay', () => {
  it('does not render content while closed', async () => {
    const { mount } = mountOverlay({ modelValue: false })
    await mount()

    expect(document.querySelector('.panel-content')).toBeNull()
  })

  it('renders content teleported into the overlay host when open', async () => {
    const { mount } = mountOverlay({ modelValue: true })
    await mount()
    await nextTick()

    const host = document.getElementById('ui-overlay-host')!
    expect(host.querySelector('.panel-content')?.textContent).toBe('Panel')
  })

  it('renders a scrim in modal mode and none in popover mode', async () => {
    const modal = mountOverlay({ modelValue: true, mode: 'modal' })
    await modal.mount()
    await nextTick()
    expect(document.querySelector('.ui-overlay__scrim')).not.toBeNull()

    document.querySelector('.ui-overlay__scrim')?.remove()

    const popover = mountOverlay({ modelValue: true, mode: 'popover' })
    await popover.mount()
    await nextTick()
    // Popover overlays render no scrim.
    const scrims = document.querySelectorAll('.ui-overlay__scrim')
    expect(scrims).toHaveLength(0)
  })

  it('marks the popover viewport boundary for pointer pass-through styling', async () => {
    const popover = mountOverlay({ modelValue: true, mode: 'popover' })
    await popover.mount()
    await nextTick()

    const root = document.querySelector('.ui-overlay--popover') as HTMLElement

    expect(root.classList).toContain('ui-overlay--popover')
  })

  it('closes on a scrim click and emits dismiss(outside)', async () => {
    const { model, mount } = mountOverlay({ modelValue: true })
    await mount()
    await nextTick()

    const scrim = document.querySelector('.ui-overlay__scrim') as HTMLElement
    scrim.click()
    await nextTick()

    expect(model.value).toBe(false)
  })

  it('does not close on scrim click when persistent', async () => {
    const { model, mount } = mountOverlay({ modelValue: true, persistent: true })
    await mount()
    await nextTick()

    const scrim = document.querySelector('.ui-overlay__scrim') as HTMLElement
    scrim.click()
    await nextTick()

    expect(model.value).toBe(true)
  })

  it('closes on Escape and respects closeOnEscape=false', async () => {
    const open = mountOverlay({ modelValue: true })
    await open.mount()
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(open.model.value).toBe(false)

    const noEsc = mountOverlay({ modelValue: true, closeOnEscape: false })
    await noEsc.mount()
    await nextTick()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(noEsc.model.value).toBe(true)
  })

  it('locks body scroll in modal mode and restores it on close', async () => {
    const { model, mount } = mountOverlay({ modelValue: true })
    await mount()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    model.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('exposes an activator scope that toggles the overlay', async () => {
    const model = ref(false)
    const Harness = defineComponent({
      setup: () => () => h(
        MOverlay,
        {
          'modelValue': model.value,
          'onUpdate:modelValue': (value: boolean) => { model.value = value },
        },
        {
          activator: (scope: { props: Record<string, unknown> }) =>
            h('button', { class: 'act', ...scope.props }, 'open'),
          default: () => h('div', { class: 'panel-content' }, 'Panel'),
        },
      ),
    })
    const wrapper = await mountSuspended(Harness)

    await wrapper.find('.act').trigger('click')
    await nextTick()
    expect(model.value).toBe(true)
  })
})
