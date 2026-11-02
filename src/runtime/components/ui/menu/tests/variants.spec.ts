import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, onMounted, ref } from 'vue'
import MMenu from '../index.vue'
import MMenuGroup from '../group/index.vue'
import MMenuItem from '../item/index.vue'
import { mountTracked, overlayHost, useOverlayHost } from '../../overlay/tests/helpers'
import { menuItems, mountMenu, surface, wrapperEl } from './helpers'

useOverlayHost()

describe('m-menu · variants', () => {
  describe('open state', () => {
    it('renders no surface while closed', async () => {
      await mountMenu({ modelValue: false })

      expect(surface()).toBeNull()
    })

    it('renders the surface into the overlay host when open', async () => {
      await mountMenu({ modelValue: true })

      expect(overlayHost().contains(surface())).toBe(true)
    })

    it('renders the slotted items inside the surface', async () => {
      await mountMenu({ modelValue: true })

      expect(menuItems()).toHaveLength(3)
    })
  })

  // Ш1-д6: the enter hook that shows it in the top layer runs on the first render too.
  describe('mounted open', () => {
    const original = HTMLElement.prototype.showPopover

    afterEach(() => {
      HTMLElement.prototype.showPopover = original
    })

    it('shows itself in the top layer and locks the page', async () => {
      const shown: Element[] = []
      HTMLElement.prototype.showPopover = function (this: HTMLElement) {
        shown.push(this)
      }

      await mountMenu({ modelValue: true })

      expect(wrapperEl()!.getAttribute('popover')).toBe('manual')
      expect(shown).toEqual([wrapperEl()])
      expect(document.documentElement.style.overflow).toBe('hidden')
    })
  })

  // Q4-1 / Q5-1: standard (`elevated`) or vibrant (`tonal`); a menu is its groups.
  describe('expressive', () => {
    it.each([
      [{}, 'ui-menu__surface--elevated'],
      [{ variant: 'tonal' }, 'ui-menu__surface--tonal'],
    ])('%o draws the %s surface', async (props, modifier) => {
      await mountMenu({ modelValue: true, ...props })

      expect(surface()!.classList).toContain(modifier)
    })

    it('draws its surface as the one group of a menu without groups', async () => {
      await mountMenu({ modelValue: true })

      expect(surface()!.classList).not.toContain('ui-menu__surface--grouped')
    })

    it('leaves the drawing to its groups when it has them', async () => {
      await mountMenu({ modelValue: true }, () => [
        h(MMenuGroup, () => [h(MMenuItem, { label: 'Cut' })]),
        h(MMenuGroup, () => [h(MMenuItem, { label: 'Delete' })]),
      ])

      expect(surface()!.classList).toContain('ui-menu__surface--grouped')
    })
  })

  // An M3 menu always opens at its anchor: no corner-of-the-window mode, no backdrop.
  describe('anchoring', () => {
    it('renders no backdrop', async () => {
      await mountMenu({ modelValue: true })

      expect(document.querySelector('.ui-menu__backdrop')).toBeNull()
      expect(wrapperEl()!.classList).not.toContain('ui-menu--absolute')
    })
  })

  describe('placement', () => {
    it.each([
      ['bottom-start', 'top left'],
      ['bottom-end', 'top right'],
      ['bottom', 'top center'],
      ['top-start', 'bottom left'],
      ['end-start', 'top left'],
    ] as const)('grows a %s menu out of its %s corner', async (placement, origin) => {
      await mountMenu({ modelValue: true, placement })

      expect(wrapperEl()!.style.getPropertyValue('--ui-menu-origin')).toBe(origin)
    })

    it('defaults to opening below, aligned to the start edge', async () => {
      await mountMenu({ modelValue: true })

      expect(wrapperEl()!.style.getPropertyValue('--ui-menu-origin')).toBe('top left')
    })
  })

  describe('attrs', () => {
    it('keeps class and style on the positioned wrapper', async () => {
      await mountMenu({ modelValue: true, class: 'custom-menu', style: 'outline-color: red' })

      expect(wrapperEl()!.classList).toContain('custom-menu')
      expect(wrapperEl()!.style.outlineColor).toBe('red')
      expect(surface()!.classList).not.toContain('custom-menu')
    })

    it('puts id and aria attributes on the menu itself', async () => {
      await mountMenu({ 'modelValue': true, 'id': 'actions-menu', 'aria-describedby': 'hint' })

      expect(surface()!.id).toBe('actions-menu')
      expect(surface()!.getAttribute('aria-describedby')).toBe('hint')
      expect(wrapperEl()!.hasAttribute('id')).toBe(false)
    })
  })

  describe('placeholder', () => {
    it('leaves no placeholder element in its parent before the teleport mounts', async () => {
      const siblings: string[] = []
      const Probe = defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          // Mounted hooks run before the post-mount re-render that swaps a placeholder out.
          onMounted(() => {
            for (const child of Array.from(el.value?.parentElement?.children ?? [])) siblings.push(child.tagName.toLowerCase())
          })
          return () => h('i', { ref: el })
        },
      })

      await mountTracked(defineComponent({
        render: () => h('div', [h(MMenu, { modelValue: false }), h(Probe)]),
      }))
      await nextTick()

      expect(siblings).toEqual(['div', 'i'])
    })
  })
})
