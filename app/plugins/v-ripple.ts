import { defineNuxtPlugin } from '#app'
import type { DirectiveBinding } from 'vue'
import '~/assets/stylesheet/components/_ripple.scss'

const stopSymbol = Symbol('rippleStop')

interface RippleOptions {
  class?: string
  center?: boolean
  circle?: boolean
}

type RippleEvent = (MouseEvent | TouchEvent | KeyboardEvent) & { [stopSymbol]?: boolean }

const DELAY_RIPPLE = 80

function transform(el: HTMLElement, value: string) {
  el.style.transform = value
}

interface RippleDirectiveBinding extends Omit<DirectiveBinding, 'modifiers' | 'value'> {
  value?: boolean | {
    class?: string
    keys?: string[]
  }
  modifiers: {
    center?: boolean
    circle?: boolean
    stop?: boolean
  }
}

function isTouchEvent(e: RippleEvent): e is TouchEvent {
  return e.constructor.name === 'TouchEvent'
}

function isKeyboardEvent(e: RippleEvent): e is KeyboardEvent {
  return e.constructor.name === 'KeyboardEvent'
}

const calculate = (e: RippleEvent, el: HTMLElement, value: RippleOptions = {}) => {
  let localX = 0
  let localY = 0

  if (!isKeyboardEvent(e)) {
    const offset = el.getBoundingClientRect()
    const target = isTouchEvent(e) ? e.touches[e.touches.length - 1] : e

    localX = target.clientX - offset.left
    localY = target.clientY - offset.top
  }

  const maxDim = Math.max(el.clientWidth, el.clientHeight)
  const softEdgeSize = Math.max(0.35 * maxDim, 75)
  const hypotenuse = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2)
  const maxRadius = hypotenuse + 10
  
  const radius = (maxRadius + softEdgeSize) / 2
  const scale = (maxDim * 0.2) / (radius * 2)

  // @ts-expect-error custom property
  const rippleData = el._ripple

  const centerX = `${(el.clientWidth - (radius * 2)) / 2}px`
  const centerY = `${(el.clientHeight - (radius * 2)) / 2}px`

  const x = value.center ? centerX : `${localX - radius}px`
  const y = value.center ? centerY : `${localY - radius}px`

  return { radius, scale, x, y, centerX, centerY }
}

const ripples = {
  show(e: RippleEvent, el: HTMLElement, value: RippleOptions = {}) {
    // @ts-expect-error custom property
    const rippleData = el._ripple
    if (!rippleData?.enabled) {
      return
    }

    const container = document.createElement('span')
    const animation = document.createElement('span')

    container.appendChild(animation)
    container.className = 'ui-ripple__container'

    if (value.class) {
      container.className += ` ${value.class}`
    }

    const { radius, scale, x, y, centerX, centerY } = calculate(e, el, value)

    const size = `${radius * 2}px`
    animation.className = 'ui-ripple__animation'
    animation.style.width = size
    animation.style.height = size

    el.appendChild(container)

    const computed = window.getComputedStyle(el)
    if (computed && computed.position === 'static') {
      el.style.position = 'relative'
      el.dataset.previousPosition = 'static'
    }

    animation.classList.add('ui-ripple__animation--enter')
    animation.classList.add('ui-ripple__animation--visible')
    transform(animation, `translate(${x}, ${y}) scale3d(${scale},${scale},${scale})`)
    animation.dataset.activated = String(performance.now())

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animation.classList.remove('ui-ripple__animation--enter')
        animation.classList.add('ui-ripple__animation--in')
        transform(animation, `translate(${centerX}, ${centerY}) scale3d(1,1,1)`)
      })
    })
  },

  hide(el: HTMLElement | null) {
    if (!el) return
    // @ts-expect-error custom property
    const rippleData = el._ripple
    if (!rippleData?.enabled) return

    const ripplesNodes = el.getElementsByClassName('ui-ripple__animation')

    if (ripplesNodes.length === 0) return
    const animation = Array.from(ripplesNodes).findLast(ripple => !(ripple as HTMLElement).dataset.isHiding) as HTMLElement

    if (!animation) return
    else animation.dataset.isHiding = 'true'

    const diff = performance.now() - Number(animation.dataset.activated)
    const delay = Math.max(250 - diff, 0)

    setTimeout(() => {
      animation.classList.remove('ui-ripple__animation--in')
      animation.classList.add('ui-ripple__animation--out')

      setTimeout(() => {
        const remainingRipples = el.getElementsByClassName('ui-ripple__animation')
        if (remainingRipples.length === 1 && el.dataset.previousPosition) {
          el.style.position = el.dataset.previousPosition
          delete el.dataset.previousPosition
        }

        if (animation.parentNode?.parentNode === el) el.removeChild(animation.parentNode)
      }, 300)
    }, delay)
  },
}

function isRippleEnabled(value: any) {
  return typeof value === 'undefined' || !!value
}

function rippleShow(e: RippleEvent) {
  const value: RippleOptions = {}
  const element = e.currentTarget as HTMLElement | undefined

  // @ts-expect-error custom property
  const rippleData = element?._ripple
  if (!rippleData || rippleData.touched || e[stopSymbol]) return

  e[stopSymbol] = true

  if (isTouchEvent(e)) {
    rippleData.touched = true
    rippleData.isTouch = true
  } else {
    if (rippleData.isTouch) return
  }

  value.center = rippleData.centered || isKeyboardEvent(e)
  if (rippleData.class) {
    value.class = rippleData.class
  }

  if (isTouchEvent(e)) {
    if (rippleData.showTimerCommit) return

    rippleData.showTimerCommit = () => {
      ripples.show(e, element!, value)
    }
    rippleData.showTimer = window.setTimeout(() => {
      // @ts-expect-error custom property
      if (element?._ripple?.showTimerCommit) {
        // @ts-expect-error custom property
        element._ripple.showTimerCommit()
        // @ts-expect-error custom property
        element._ripple.showTimerCommit = null
      }
    }, DELAY_RIPPLE)
  } else {
    ripples.show(e, element!, value)
  }
}

function rippleStop(e: RippleEvent) {
  e[stopSymbol] = true
}

function rippleHide(e: Event) {
  const element = e.currentTarget as HTMLElement | null
  if (!element) return
  // @ts-expect-error custom property
  const rippleData = element._ripple
  if (!rippleData) return

  window.clearTimeout(rippleData.showTimer)

  if (e.type === 'touchend' && rippleData.showTimerCommit) {
    rippleData.showTimerCommit()
    rippleData.showTimerCommit = null

    rippleData.showTimer = window.setTimeout(() => {
      rippleHide(e)
    })
    return
  }

  window.setTimeout(() => {
    // @ts-expect-error custom property
    if (element._ripple) {
      // @ts-expect-error custom property
      element._ripple.touched = false
    }
  })
  ripples.hide(element)
}

function rippleCancelShow(e: MouseEvent | TouchEvent) {
  const element = e.currentTarget as HTMLElement | undefined
  // @ts-expect-error custom property
  const rippleData = element?._ripple
  if (!rippleData) return

  if (rippleData.showTimerCommit) {
    rippleData.showTimerCommit = null
  }

  window.clearTimeout(rippleData.showTimer)
}

let keyboardRipple = false

function keyboardRippleShow(e: KeyboardEvent, keys: string[]) {
  if (!keyboardRipple && keys.includes(e.key)) {
    keyboardRipple = true
    rippleShow(e as RippleEvent)
  }
}

function keyboardRippleHide(e: KeyboardEvent) {
  keyboardRipple = false
  rippleHide(e as Event)
}

function focusRippleHide(e: FocusEvent) {
  if (keyboardRipple) {
    keyboardRipple = false
    rippleHide(e as Event)
  }
}

function updateRipple(el: HTMLElement, binding: RippleDirectiveBinding, wasEnabled: boolean) {
  const { value, modifiers } = binding

  const enabled = isRippleEnabled(value)
  if (!enabled) {
    ripples.hide(el)
  }

  // @ts-expect-error custom property
  const rippleData = el._ripple ?? {}
  // @ts-expect-error custom property
  el._ripple = rippleData
  
  rippleData.enabled = enabled
  rippleData.centered = modifiers.center
  rippleData.circle = modifiers.circle

  const bindingValue = typeof value === 'object' && value !== null ? value : {}
  if ((bindingValue as any).class) {
    rippleData.class = (bindingValue as any).class
  }

  const allowedKeys = (bindingValue as any).keys ?? ['Enter', 'Space']
  rippleData.keyDownHandler = (e: KeyboardEvent) => keyboardRippleShow(e, allowedKeys)

  if (enabled && !wasEnabled) {
    if (modifiers.stop) {
      el.addEventListener('touchstart', rippleStop, { passive: true })
      el.addEventListener('mousedown', rippleStop)
      return
    }

    el.addEventListener('touchstart', rippleShow, { passive: true })
    el.addEventListener('touchend', rippleHide, { passive: true })
    el.addEventListener('touchmove', rippleCancelShow, { passive: true })
    el.addEventListener('touchcancel', rippleHide)

    el.addEventListener('mousedown', rippleShow)
    el.addEventListener('mouseup', rippleHide)
    el.addEventListener('mouseleave', rippleHide)

    el.addEventListener('keydown', rippleData.keyDownHandler)
    el.addEventListener('keyup', keyboardRippleHide)

    el.addEventListener('blur', focusRippleHide)

    el.addEventListener('dragstart', rippleHide, { passive: true })
  } else if (!enabled && wasEnabled) {
    removeListeners(el)
  }
}

function removeListeners(el: HTMLElement) {
  el.removeEventListener('touchstart', rippleStop)
  el.removeEventListener('mousedown', rippleStop)

  el.removeEventListener('touchstart', rippleShow)
  el.removeEventListener('touchend', rippleHide)
  el.removeEventListener('touchmove', rippleCancelShow)
  el.removeEventListener('touchcancel', rippleHide)

  el.removeEventListener('mousedown', rippleShow)
  el.removeEventListener('mouseup', rippleHide)
  el.removeEventListener('mouseleave', rippleHide)

  // @ts-expect-error custom property
  const rippleData = el._ripple
  if (rippleData?.keyDownHandler) {
    el.removeEventListener('keydown', rippleData.keyDownHandler)
  }
  el.removeEventListener('keyup', keyboardRippleHide)

  el.removeEventListener('blur', focusRippleHide)

  el.removeEventListener('dragstart', rippleHide)
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('ripple', {
    mounted(el: HTMLElement, binding: RippleDirectiveBinding) {
      updateRipple(el, binding, false)
    },
    unmounted(el: HTMLElement) {
      removeListeners(el)
      // @ts-expect-error custom property
      delete el._ripple
    },
    updated(el: HTMLElement, binding: RippleDirectiveBinding) {
      if (binding.value === binding.oldValue) {
        return
      }
      const wasEnabled = isRippleEnabled(binding.oldValue)
      updateRipple(el, binding, wasEnabled)
    }
  })
})
