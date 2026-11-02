import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useTooltipControl } from './useTooltipControl'
import type { UseTooltipControlReturn } from './useTooltipControl'

const keydown = vi.hoisted(() => ({ live: 0 }))

vi.mock('#kit/composables/useGlobalListener', async (importOriginal) => {
  const original = await importOriginal<typeof import('#kit/composables/useGlobalListener')>()
  return {
    ...original,
    useGlobalListener: (...args: Parameters<typeof original.useGlobalListener>) => {
      const stop = original.useGlobalListener(...args)
      if (args[1] !== 'keydown') return stop
      keydown.live++
      let stopped = false
      return () => {
        if (!stopped) keydown.live--
        stopped = true
        stop()
      }
    },
  }
})

interface HarnessOptions {
  id?: string
  content?: Ref<string>
  disabled?: Ref<boolean>
  bind?: boolean
}

const mounted: Array<{ unmount: () => void }> = []

function harness({ id = 'tip', content = ref('Hint'), disabled = ref(false), bind = false }: HarnessOptions = {}) {
  const open = ref(false)
  let control!: UseTooltipControlReturn

  const Harness = defineComponent({
    setup() {
      const trigger = shallowRef<HTMLElement | null>(null)
      control = useTooltipControl({ id, open, trigger, hideDelay: 100, disabled: () => disabled.value, hasContent: () => Boolean(content.value) })

      return () => h('div', [
        h('span', {
          ref: trigger,
          onPointerenter: control.onPointerEnter,
          onMouseenter: control.onMouseEnter,
          onMouseleave: control.scheduleHide,
          onFocusin: control.onFocusIn,
          onFocusout: control.hide,
          onPointerdown: control.onPointerDown,
          onPointerup: control.onPointerEnd,
          onClickCapture: control.onAfterLongPress,
        }, [h('button', bind ? control.triggerProps.value : {}, 'Trigger')]),
        h('span', { id, role: 'tooltip' }, content.value),
      ])
    },
  })

  return { Harness, open, content, disabled, control: () => control }
}

function mountHarness(options: HarnessOptions = {}) {
  const parts = harness(options)
  const wrapper = mount(parts.Harness, { attachTo: document.body })
  mounted.push(wrapper)
  const trigger = wrapper.find('span').element as HTMLElement
  const button = wrapper.find('button').element as HTMLButtonElement
  return { ...parts, wrapper, trigger, button }
}

function focusVisible(visible: boolean) {
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    return selector === ':focus-visible' ? visible : matches.call(this, selector)
  })
}

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('useTooltipControl', () => {
  describe('description', () => {
    it('hands out a bag with the description only: no class, no data-*', () => {
      const { control } = mountHarness({ bind: true })

      expect(control().triggerProps.value).toEqual({ 'aria-describedby': 'tip' })
    })

    it('links nothing in the server HTML, where no surface exists yet', async () => {
      const { Harness } = harness({ bind: true })

      const html = await renderToString(createSSRApp(Harness))

      expect(html).not.toContain('aria-describedby')
    })

    it('links the first focusable element when the bag is not bound', () => {
      const { button } = mountHarness()

      expect(button.getAttribute('aria-describedby')).toBe('tip')
    })

    it.each([true, false])('links nothing without content (bag bound: %s)', (bind) => {
      const { button, control } = mountHarness({ content: ref(''), bind })

      expect(control().triggerProps.value).toEqual({})
      expect(button.hasAttribute('aria-describedby')).toBe(false)
    })

    it('drops the link when the content goes and brings it back with the content', async () => {
      const content = ref('Hint')
      const { button } = mountHarness({ content })

      content.value = ''
      await nextTick()
      expect(button.hasAttribute('aria-describedby')).toBe(false)

      content.value = 'Back'
      await nextTick()
      expect(button.getAttribute('aria-describedby')).toBe('tip')
    })
  })

  describe('showing', () => {
    it('shows on hover and hides after the grace period', async () => {
      vi.useFakeTimers()
      const { trigger, open } = mountHarness()

      trigger.dispatchEvent(new MouseEvent('mouseenter'))
      expect(open.value).toBe(true)

      trigger.dispatchEvent(new MouseEvent('mouseleave'))
      vi.advanceTimersByTime(99)
      expect(open.value).toBe(true)
      vi.advanceTimersByTime(1)
      expect(open.value).toBe(false)
    })

    it('shows on keyboard focus, not on pointer focus', () => {
      const { button, open } = mountHarness()

      focusVisible(false)
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(open.value).toBe(false)

      vi.restoreAllMocks()
      focusVisible(true)
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(open.value).toBe(true)
    })

    it('never shows without content', () => {
      const { control, open } = mountHarness({ content: ref('') })

      control().show()

      expect(open.value).toBe(false)
    })

    it('never shows while disabled and hides when disabled', async () => {
      const disabled = ref(true)
      const { control, open } = mountHarness({ disabled })

      control().show()
      expect(open.value).toBe(false)

      disabled.value = false
      await nextTick()
      control().show()
      expect(open.value).toBe(true)

      disabled.value = true
      await nextTick()
      expect(open.value).toBe(false)
    })

    it('hides the shown tooltip when another one shows', async () => {
      const first = mountHarness({ id: 'first' })
      const second = mountHarness({ id: 'second' })

      first.control().show()
      await nextTick()
      second.control().show()
      await nextTick()

      expect(first.open.value).toBe(false)
      expect(second.open.value).toBe(true)
    })
  })

  describe('Escape', () => {
    it('listens on the window only while shown', async () => {
      const { control } = mountHarness()
      const closed = keydown.live

      control().show()
      await nextTick()
      expect(keydown.live).toBe(closed + 1)

      control().hide()
      await nextTick()
      expect(keydown.live).toBe(closed)
    })

    it('hides on Escape without moving focus', async () => {
      const { control, open, button } = mountHarness()
      button.focus()

      control().show()
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(open.value).toBe(false)
      expect(document.activeElement).toBe(button)
    })
  })

  describe('touch', () => {
    it('shows on a long press for a moment and swallows the click after it', () => {
      vi.useFakeTimers()
      const { button, open } = mountHarness()

      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      vi.advanceTimersByTime(500)
      button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
      expect(open.value).toBe(true)

      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      button.dispatchEvent(click)
      expect(click.defaultPrevented).toBe(true)

      vi.advanceTimersByTime(1500)
      expect(open.value).toBe(false)
    })

    it('ignores the mouse events a tap leaves behind', () => {
      const { trigger, open } = mountHarness()

      trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
      trigger.dispatchEvent(new MouseEvent('mouseenter'))
      expect(open.value).toBe(false)

      trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
      trigger.dispatchEvent(new MouseEvent('mouseenter'))
      expect(open.value).toBe(true)
    })

    it('leaves a short tap and a mouse press alone', () => {
      vi.useFakeTimers()
      const { button, open } = mountHarness()

      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
      vi.advanceTimersByTime(600)

      expect(open.value).toBe(false)
    })
  })
})
