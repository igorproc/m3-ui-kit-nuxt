<template>
  <slot
    name="activator"
    :open="open"
    :close="close"
    :toggle="toggle"
    :is-open="modelValue"
    :props="activatorProps"
  />

  <!--
    Rendered only once the lifecycle starts on the client: a teleport in the SSR
    output leaves anchor comments in the host that break hydration of every
    other overlay. Nested inside another overlay, it renders into that overlay's
    root — outside an open modal dialog it would be inert.
  -->
  <teleport
    v-if="lifecycle.isRendered.value"
    :to="resolvedTarget"
  >
    <component
      :is="isModal ? 'dialog' : 'div'"
      :id="rootId"
      ref="root"
      class="ui-overlay"
      :class="`ui-overlay--${mode}`"
      :popover.attr="usesPopoverLayer ? 'manual' : undefined"
      :aria-modal="isInertModal ? 'true' : undefined"
      :style="{ zIndex: ticket.zIndex.value }"
      v-bind="$attrs"
      @cancel="dismiss.onCancel"
      @close="onNativeClose"
    >
      <transition
        v-if="showScrim"
        v-bind="toTransitionProps(overlayTransition)"
        @after-enter="lifecycle.onPartAfterEnter"
        @after-leave="lifecycle.onPartAfterLeave"
      >
        <div
          v-show="lifecycle.isVisible.value"
          class="ui-overlay__scrim"
          :class="[{ 'ui-overlay__scrim--muted': isScrimMuted }, overlayClass]"
          aria-hidden="true"
          @click="dismiss.onScrimClick"
        >
          <slot name="scrim" />
        </div>
      </transition>

      <transition
        v-bind="toTransitionProps(contentTransition)"
        @after-enter="lifecycle.onPartAfterEnter"
        @after-leave="lifecycle.onPartAfterLeave"
      >
        <div
          v-show="lifecycle.isVisible.value"
          ref="panel"
          class="ui-overlay__panel"
          :class="[`ui-overlay__panel--${mode}`, { 'ui-overlay__panel--scrollable': isPanelScrollable }, panelSwipeClass, contentClass]"
          :style="swipeStyle"
        >
          <div
            v-if="showSwipeBanner && closeOnSwipe !== 'none'"
            ref="swipeBanner"
            class="ui-overlay__swipe-banner"
          >
            <slot name="swipe-banner" />
          </div>

          <slot
            :close="close"
            :is-top="isTop"
            :overlay-id="overlayId"
          />
        </div>
      </transition>

      <!-- Under an open modal the page is inert: announcements of surfaces inside it go here. -->
      <LiveRegion v-if="isModal" />

      <template v-if="preventNavigationGestures">
        <div class="ui-overlay__gesture-guard ui-overlay__gesture-guard--start" />
        <div class="ui-overlay__gesture-guard ui-overlay__gesture-guard--end" />
      </template>
    </component>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onScopeDispose, shallowRef, useAttrs, useId, watch } from 'vue'
import type { TransitionProps } from 'vue'
import { useNuxtApp } from '#app'
import { useStack } from '#kit/composables/useStack'
import { useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { useFocusTrap } from '#kit/composables/overlay/useFocusTrap'
import { useOverlayLifecycle } from '#kit/composables/overlay/useOverlayLifecycle'
import { useOverlaySwipe } from '#kit/composables/overlay/useOverlaySwipe'
import { useTopLayer } from '#kit/composables/overlay/useTopLayer'
import LiveRegion from '#kit/components/fragments/live-region/index.vue'
import { provideOverlayTarget, useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { claimModalOwner, closeModalChildren, useModalContext } from '#kit/composables/modal/useModalContext'
import { useOverlayDismiss } from '#kit/composables/overlay/useOverlayDismiss'
import { supportsPopover } from '#kit/shared/utils/support'
import { mOverlayProps } from './props'
import type { MOverlayEmits, MOverlayTransition } from './props'

// Two roots (activator slot + teleport): attrs go to the overlay root explicitly.
defineOptions({ inheritAttrs: false })

const props = defineProps(mOverlayProps)
const emit = defineEmits<MOverlayEmits>()

const modelValue = defineModel<boolean>({ default: false })

const overlayId = useId()
const attrs = useAttrs()
// The activator's `aria-controls` names the root: the consumer's id if it gave one.
const rootId = computed(() => (attrs.id as string | undefined) ?? overlayId)
const root = shallowRef<HTMLElement | null>(null)
const panel = shallowRef<HTMLElement | null>(null)
const swipeBanner = shallowRef<HTMLElement | null>(null)

const isModal = computed(() => props.mode === 'modal')
// Modal + non-interactive background is the only case that makes the page inert.
const isInertModal = computed(() => isModal.value && props.background === 'non-interactive')
const usesPopoverLayer = computed(() => !isInertModal.value && supportsPopover())
const showScrim = computed(() => !(props.hideOverlay ?? !isModal.value))

const resolvedTarget = useOverlayTeleportTarget()
// Descendant menus, tooltips and overlays render inside this root.
provideOverlayTarget(root)

const stack = useStack()
const ticket = stack.register({ blocking: props.persistent, modal: isModal.value, onDismiss: () => dismiss.request('outside') })
const isTop = computed(() => ticket.globalTop.value)
const isScrimMuted = computed(() => props.overlayBehavior === 'auto' && ticket.isSelected.value && stack.topModal.value !== ticket)

const scrollLock = useScrollLock()
// On the root, not the panel: focus can sit on the <dialog> itself (after
// showModal() or a click on the scrim), and menus / snackbars teleported into
// the root live beside the panel — Tab from either would otherwise reach the
// browser chrome.
const focusTrap = useFocusTrap(root)
const shouldTrapFocus = computed(() => props.trapFocus ?? isInertModal.value)
const topLayer = useTopLayer(root, () => isInertModal.value)
const modalService = useNuxtApp().$material.modal

function toTransitionProps(transition: MOverlayTransition | undefined): TransitionProps {
  if (!transition) return {}
  return typeof transition === 'string' ? { name: transition } : transition
}

function show() {
  ticket.select()
  if (shouldTrapFocus.value) focusTrap.rememberFocus()
  topLayer.show()
  if (isInertModal.value && props.lockScroll) scrollLock.lock(props.reserveScrollBarGap)
  if (isModal.value) modalService.markOpened(overlayId, showScrim.value)
}

function hide() {
  topLayer.hide()
  ticket.unselect()
  scrollLock.unlock()
  focusTrap.deactivate()
  modalService.markClosed(overlayId)
}

const lifecycle = useOverlayLifecycle(modelValue, {
  parts: () => (showScrim.value ? 2 : 1),
  keepMounted: () => props.displayDirective === 'show',
  show,
  hide,
  prepareClose: async () => {
    await closeModalChildren(context)
    return context.children.value.every(child => child.status.value === 'closed')
  },
  hooks: {
    beforeOpen: event => emit('beforeOpen', event),
    beforeClose: event => emit('beforeClose', event),
    opened: () => emit('opened'),
    closed: () => emit('closed'),
  },
})

function open(): Promise<void> {
  modelValue.value = true
  return lifecycle.whenOpenSettles()
}

async function close(): Promise<void> {
  modelValue.value = false
  await nextTick()
  // A controlled parent may refuse (it never sets the prop back to false).
  if (modelValue.value && lifecycle.status.value !== 'closing') return
  await lifecycle.whenCloseSettles()
}

function toggle() {
  if (modelValue.value) void close()
  else void open()
}

const context = useModalContext({ id: overlayId, status: lifecycle.status, close, parent: props.parent })

if (isModal.value) {
  const unregister = modalService.register({ id: overlayId, isOpen: () => modelValue.value, open, close, owner: claimModalOwner() })
  onScopeDispose(unregister)
}

// A popover promises no role, so it announces none; `aria-controls` only names
// a root that exists.
const activatorProps = computed(() => ({
  'aria-haspopup': isModal.value ? 'dialog' : undefined,
  'aria-expanded': modelValue.value,
  'aria-controls': lifecycle.isRendered.value ? rootId.value : undefined,
  'onClick': toggle,
}))

const dismiss = useOverlayDismiss({
  policy: () => props,
  isOpen: () => modelValue.value,
  isTop: () => isTop.value,
  receivesCloseRequests: () => isInertModal.value,
  hasScrim: () => showScrim.value,
  panel,
  close: () => void close(),
  onDismiss: reason => emit('dismiss', reason),
  onClickOutside: () => emit('clickOutside'),
})

// The browser may still force-close a dialog (repeated Esc without user
// activation). Follow it when dismissal is allowed, otherwise re-open.
function onNativeClose() {
  if (topLayer.isHiding() || lifecycle.status.value === 'closed' || lifecycle.status.value === 'closing') return
  if (dismiss.canDismiss('escape')) void close()
  else topLayer.show()
}

const swipeStart = () => props.swipeTarget ?? (props.showSwipeBanner ? swipeBanner.value : panel.value)

// A panel that starts the swipe itself leaves the browser only the other
// axis, so the drag is not taken for a page pan (`pointercancel` mid-swipe).
const panelSwipeClass = computed(() => {
  if (props.closeOnSwipe === 'none' || props.swipeTarget || props.showSwipeBanner) return undefined
  return props.closeOnSwipe === 'left' || props.closeOnSwipe === 'right' ? 'ui-overlay__panel--swipe-inline' : 'ui-overlay__panel--swipe-block'
})

const isPanelScrollable = computed(() => isModal.value && lifecycle.status.value === 'open')

const { swipeStyle } = useOverlaySwipe(swipeStart, {
  direction: () => props.closeOnSwipe,
  threshold: () => props.swipeThreshold,
  disabled: () => !dismiss.canDismiss('swipe') || lifecycle.status.value !== 'open',
  onDismiss: () => dismiss.request('swipe'),
})

// The trap puts focus on the surface; the content's own `autofocus` wins
// after it (showModal() ran while the panel was still hidden, so the browser
// could not apply it).
function activateFocus() {
  focusTrap.activate()
  panel.value?.querySelector<HTMLElement>('[autofocus]')?.focus()
}

watch(lifecycle.isVisible, (visible) => {
  if (visible && shouldTrapFocus.value) nextTick(activateFocus)
})

defineExpose({ id: overlayId, status: lifecycle.status, open, close, toggle })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/overlay/index' as t;

$prefix: 'md-overlay';

.ui-overlay {
  $t: material-map(t.$tokens, $prefix);

  // Neutralise the UA <dialog> / [popover] box: the root is a transparent,
  // viewport-sized layer and the panel inside positions the content.
  position: fixed;
  inset: 0;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;

  // Explicit: a nested overlay must not inherit a popover parent's `none`.
  pointer-events: auto;

  &::backdrop {
    background: transparent;
  }

  &--popover {
    pointer-events: none;
  }

  &__scrim {
    position: absolute;
    inset: 0;
    background-color: color-mix(in srgb, #{g($t, 'scrim.color')} #{g($t, 'scrim.opacity')}, transparent);
    transition: opacity g($t, 'scrim.motion.enter.duration') g($t, 'scrim.motion.enter.easing');

    @media (prefers-contrast: more) {
      background-color: color-mix(in srgb, #{g($t, 'scrim.color')} #{g($t, 'scrim.contrast.more.opacity')}, transparent);
    }

    // `overlayBehavior: auto` — only the topmost modal dims the page.
    &--muted {
      opacity: 0;
    }
  }

  &__panel {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: transform g($t, 'scrim.motion.exit.duration') g($t, 'scrim.motion.exit.easing');

    // Let the scrim receive outside clicks; the actual content re-enables pointers.
    > * {
      pointer-events: auto;
    }
  }

  &__panel--modal {
    @supports (align-items: safe center) {
      align-items: safe center;
    }
  }

  &__panel--scrollable {
    overflow: hidden auto;
    overscroll-behavior: contain;
  }

  &__panel--popover {
    align-items: flex-start;
    justify-content: flex-start;
  }

  &__panel--swipe-inline {
    touch-action: pan-y;
  }

  &__panel--swipe-block {
    touch-action: pan-x;
  }

  &__swipe-banner {
    touch-action: none;
  }

  &__gesture-guard {
    position: absolute;
    inset-block: 0;
    width: g($t, 'gesture-guard.width');
    touch-action: none;

    &--start {
      inset-inline-start: 0;
    }

    &--end {
      inset-inline-end: 0;
    }
  }
}

.ui-overlay-fade {
  $t: material-map(t.$tokens, $prefix);

  &-enter-active {
    transition: opacity g($t, 'scrim.motion.enter.duration') g($t, 'scrim.motion.enter.easing');
  }

  &-leave-active {
    transition: opacity g($t, 'scrim.motion.exit.duration') g($t, 'scrim.motion.exit.easing');
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
