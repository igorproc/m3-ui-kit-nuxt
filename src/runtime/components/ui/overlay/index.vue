<template>
  <slot
    name="activator"
    :open="open"
    :close="close"
    :toggle="toggle"
    :is-open="modelValue"
    :props="activatorProps"
  />

  <ClientOnly>
    <teleport :to="resolvedTarget">
      <transition
        :name="transitionName"
        @after-enter="emit('after:enter')"
        @after-leave="emit('after:leave')"
      >
        <div
          v-if="modelValue"
          class="ui-overlay"
          :class="`ui-overlay--${mode}`"
          :style="{ zIndex: ticket.zIndex.value }"
        >
          <div
            v-if="showScrim"
            class="ui-overlay__scrim"
            aria-hidden="true"
            @click="onScrimClick"
          >
            <slot name="scrim" />
          </div>

          <div
            ref="panel"
            class="ui-overlay__panel"
            :class="`ui-overlay__panel--${mode}`"
            :tabindex="mode === 'modal' ? -1 : undefined"
            @keydown="onPanelKeydown"
          >
            <slot
              :close="close"
              :is-top="isTop"
              :overlay-id="overlayId"
            />
          </div>
        </div>
      </transition>
    </teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from 'vue'
import { useStack } from '#kit/composables/useStack'
import { useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { mOverlayProps } from './props'
import type { MOverlayDismissReason } from './props'

const props = defineProps(mOverlayProps)

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (event: 'click:outside', nativeEvent: PointerEvent): void
  (event: 'dismiss', reason: MOverlayDismissReason): void
  (event: 'after:enter' | 'after:leave'): void
}>()

const overlayId = useId()
const panel = shallowRef<HTMLElement | null>(null)

// Fall back to <body> when the requested host is absent (e.g. no <MApp>), so
// overlays still render outside the themed root instead of failing silently.
const resolvedTarget = computed(() => {
  if (typeof props.teleportTo !== 'string') return props.teleportTo
  if (IN_BROWSER && !document.querySelector(props.teleportTo)) return 'body'
  return props.teleportTo
})

const showScrim = computed(() => props.scrim ?? props.mode === 'modal')
const transitionName = computed(() => (props.transition === false ? undefined : props.transition))

const stack = useStack()
const ticket = stack.register({ blocking: props.persistent })
const isTop = computed(() => ticket.globalTop.value)

const { lock, unlock } = useScrollLock()
let previouslyFocused: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  const root = panel.value
  if (!root) return []
  const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(selector))
}

function open() {
  modelValue.value = true
}

function close() {
  modelValue.value = false
}

function toggle() {
  modelValue.value = !modelValue.value
}

const activatorProps = computed(() => ({
  'aria-haspopup': props.mode === 'modal' ? 'dialog' : 'menu',
  'aria-expanded': modelValue.value,
  'onClick': toggle,
}))

function requestUserDismiss(reason: MOverlayDismissReason, nativeEvent?: PointerEvent) {
  if (props.persistent) return
  if (reason === 'outside' && !props.closeOnOutside) return
  if (reason === 'escape' && !props.closeOnEscape) return
  if (reason === 'outside' && nativeEvent) emit('click:outside', nativeEvent)
  emit('dismiss', reason)
  close()
}

function onScrimClick(event: MouseEvent) {
  requestUserDismiss('outside', event as PointerEvent)
}

function onPanelKeydown(event: KeyboardEvent) {
  if (props.mode !== 'modal' || event.key !== 'Tab') return
  const focusables = focusableElements()
  if (!focusables.length) {
    event.preventDefault()
    return
  }
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  const active = IN_BROWSER ? document.activeElement : null
  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

// Escape: only the topmost eligible overlay reacts, so one press never closes
// two nested layers.
useGlobalListener('window', 'keydown', (event) => {
  if (!modelValue.value || !isTop.value) return
  if ((event as KeyboardEvent).key !== 'Escape') return
  event.preventDefault()
  requestUserDismiss('escape')
})

// Popover outside dismissal (modal mode uses the scrim click instead).
useClickOutside(panel, (event) => {
  if (!modelValue.value || !isTop.value || showScrim.value) return
  requestUserDismiss('outside', event as PointerEvent)
})

watch(modelValue, (isOpen, wasOpen) => {
  if (isOpen === wasOpen) return

  if (isOpen) {
    ticket.select()
    if (props.mode === 'modal') {
      previouslyFocused = IN_BROWSER ? (document.activeElement as HTMLElement | null) : null
      lock()
      nextTick(() => {
        const focusables = focusableElements()
        ;(focusables[0] ?? panel.value)?.focus()
      })
    }
  } else {
    ticket.unselect()
    if (props.mode === 'modal') {
      unlock()
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  }
}, { immediate: true })

defineExpose({ open, close, toggle })
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/overlay/index' as t;

$prefix: 'md-overlay';

.ui-overlay {
  $t: material-map(t.$tokens, $prefix);

  position: fixed;
  inset: 0;

  &--popover {
    pointer-events: none;
  }

  &__scrim {
    position: absolute;
    inset: 0;
    background-color: color-mix(in srgb, #{g($t, 'scrim-color')} #{g($t, 'scrim-opacity')}, transparent);
  }

  &__panel {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    // Let the scrim receive outside clicks; the actual content re-enables pointers.
    > * {
      pointer-events: auto;
    }
  }

  &__panel--popover {
    align-items: flex-start;
    justify-content: flex-start;
  }
}
</style>
