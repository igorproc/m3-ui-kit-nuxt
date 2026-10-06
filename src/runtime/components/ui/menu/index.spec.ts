import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import MMenu from './index.vue'
import { useMenu } from '#kit/composables/menu/useMenu'
import { __resetScrollLock } from '#kit/composables/overlay/useScrollLock'

// The menu teleports into the shared #ui-overlay-host (client-only). Tests check
// roles/emits in document.body rather than overlay geometry/pixels.
beforeEach(() => {
  const host = document.createElement('div')
  host.id = 'ui-overlay-host'
  document.body.appendChild(host)
})

afterEach(() => {
  document.getElementById('ui-overlay-host')?.remove()
  __resetScrollLock()
})

function renderTrigger(props: Record<string, unknown> = {}, items = '') {
  // A real trigger parent is needed: the anchor's parentElement is the trigger.
  return defineComponent({
    props: { open: { type: Boolean, default: false } },
    setup(p) {
      return () => h('button', { class: 'trigger' }, [
        h(MMenu, { ...props, modelValue: props.modelValue ?? p.open }, {
          default: () => items
            ? [
                h('button', { class: 'ui-menu__item' }, 'A'),
                h('button', { class: 'ui-menu__item' }, 'B'),
              ]
            : undefined,
        }),
      ])
    },
  })
}

describe('m-menu', () => {
  it('uses the anchor width in the native CSS anchor path', () => {
    const supports = vi.spyOn(CSS, 'supports').mockReturnValue(true)
    const scope = effectScope()
    const menu = scope.run(() => useMenu(ref(false), {
      absolute: () => true,
      origin: () => 'top left',
      matchWidth: () => true,
    }))!

    expect(menu.menuStyle.value.width).toBe('anchor-size(width)')

    scope.stop()
    supports.mockRestore()
  })

  // `vi.spyOn(CSS, 'supports')` does not reach the module's `CSS` under the
  // nuxt environment (happy-dom answers `true` to everything); stub the global.
  it('lets the native anchor path flip at the viewport edges', () => {
    vi.stubGlobal('CSS', { supports: () => true })
    const scope = effectScope()
    const menu = scope.run(() => useMenu(ref(false), {
      absolute: () => true,
      origin: () => 'top right',
      matchWidth: () => false,
    }))!

    expect(menu.menuStyle.value['position-area']).toBe('bottom span-left')
    expect(menu.menuStyle.value['position-try-fallbacks']).toBe('flip-block, flip-inline, flip-block flip-inline')

    scope.stop()
    vi.unstubAllGlobals()
  })

  it('falls back to JS placement when anchoring cannot flip', () => {
    vi.stubGlobal('CSS', {
      supports: (declaration: string) => !declaration.startsWith('position-try-fallbacks'),
    })
    const scope = effectScope()
    const menu = scope.run(() => useMenu(ref(false), {
      absolute: () => true,
      origin: () => 'top left',
      matchWidth: () => false,
    }))!

    expect(menu.isAnchorSupported.value).toBe(false)
    expect(menu.menuStyle.value['position-anchor']).toBeUndefined()
    expect(menu.menuStyle.value.top).toBeDefined()

    scope.stop()
    vi.unstubAllGlobals()
  })

  it('does not render the surface while closed', async () => {
    await mountSuspended(renderTrigger({ modelValue: false }))

    expect(document.querySelector('.ui-menu__surface')).toBeNull()
  })

  it('renders a role="menu" surface when open', async () => {
    await mountSuspended(renderTrigger({ modelValue: true }))
    await nextTick()

    const surface = document.querySelector('.ui-menu__surface')
    expect(surface).not.toBeNull()
    expect(surface!.getAttribute('role')).toBe('menu')
  })

  it('renders slotted menu items inside the surface', async () => {
    await mountSuspended(renderTrigger({ modelValue: true }, 'items'))
    await nextTick()

    const items = document.querySelectorAll('.ui-menu__surface .ui-menu__item')
    expect(items).toHaveLength(2)
  })

  it('promotes slotted buttons to role="menuitem" when transitioning to open', async () => {
    // Promotion runs in the open watcher (not immediate), so mount closed first.
    const wrapper = await mountSuspended(renderTrigger({}, 'items'), {
      props: { open: false },
    })
    await nextTick()

    await wrapper.setProps({ open: true })
    await nextTick()
    await nextTick()

    const items = document.querySelectorAll('.ui-menu__surface .ui-menu__item')
    expect(items).toHaveLength(2)
    expect(items[0]!.getAttribute('role')).toBe('menuitem')
  })

  it('traps Tab inside the open menu and lets the menu own inner focus', async () => {
    const wrapper = await mountSuspended(renderTrigger({}, 'items'), { props: { open: false } })
    await wrapper.setProps({ open: true })
    await nextTick()
    await nextTick()

    const [first, second] = Array.from(document.querySelectorAll<HTMLElement>('.ui-menu__surface .ui-menu__item'))
    const press = (key: string, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
      document.activeElement!.dispatchEvent(event)
      return event
    }

    // The menu decides inner focus: its first item.
    expect(document.activeElement).toBe(first)
    // Roving tabindex leaves one tab stop, so Tab cannot leave the menu.
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    expect(press('Tab', true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    // Moving between items stays the menu's job.
    press('ArrowDown')
    expect(document.activeElement).toBe(second)
  })

  it('emits click-outside when the backdrop is clicked', async () => {
    const wrapper = await mountSuspended(renderTrigger({ modelValue: true }))
    await nextTick()

    const backdrop = document.querySelector('.ui-menu__backdrop') as HTMLElement
    expect(backdrop).not.toBeNull()
    backdrop.click()
    await nextTick()

    const menu = wrapper.findComponent(MMenu)
    expect(menu.emitted('click-outside')).toBeTruthy()
  })

  it('locks page scroll while open and releases it on close', async () => {
    const wrapper = await mountSuspended(renderTrigger({ absolute: true }), { props: { open: false } })

    await wrapper.setProps({ open: true })
    expect(document.documentElement.style.overflow).toBe('hidden')

    await wrapper.setProps({ open: false })
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('leaves page scroll alone with lock-scroll off', async () => {
    const wrapper = await mountSuspended(renderTrigger({ absolute: true, lockScroll: false }), { props: { open: false } })

    await wrapper.setProps({ open: true })
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('renders no backdrop in absolute mode', async () => {
    await mountSuspended(renderTrigger({ modelValue: true, absolute: true }))
    await nextTick()

    expect(document.querySelector('.ui-menu__surface')).not.toBeNull()
    expect(document.querySelector('.ui-menu__backdrop')).toBeNull()
    expect(document.querySelector('.ui-menu--absolute')).not.toBeNull()
  })
})
