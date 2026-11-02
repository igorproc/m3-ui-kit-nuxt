<template>
  <!-- Finds the trigger: without an `anchor`, the popover's parent element. -->
  <div
    ref="anchorRef"
    class="ui-popover-anchor"
    style="display: none;"
  />

  <!-- Client-only, like every overlay; a `v-if` leaves a comment in place, not a <span>. -->
  <teleport
    v-if="isMounted"
    :to="teleportTarget"
  >
    <transition
      name="ui-popover-anim"
      appear
      @enter="showInTopLayer"
      @after-enter="popover.onAfterEnter"
      @after-leave="popover.onAfterLeave"
    >
      <div
        v-if="modelValue"
        ref="positioned"
        :popover.attr="usesPopoverLayer ? 'manual' : undefined"
        class="ui-popover"
        :dir="popover.surfaceDir.value"
        :style="[popover.popoverStyle.value, { 'zIndex': ticket.zIndex.value, '--ui-menu-origin': origin }]"
        v-bind="split.wrapper"
      >
        <div
          ref="surface"
          class="ui-popover__surface"
          v-bind="split.surface"
          @keydown="onKeydown"
        >
          <slot />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
/**
 * Private: a floating panel at its anchor for content that is not a menu — a
 * dropdown's listbox, a colour picker. It owns placement, the top layer,
 * stacking, outside presses and scroll lock, and gives the content no role
 * and no keyboard of its own: the widget inside keeps its semantics.
 *
 * With `trapFocus` the panel takes focus when it opens, keeps Tab among its
 * controls and gives focus back on Escape; without it focus stays where it
 * is (a combobox's field) and the widget there handles the keys.
 */
import { computed, nextTick, onMounted, shallowRef, useAttrs, watch } from 'vue'
import type { PropType } from 'vue'
import { usePopover } from '#kit/composables/popover/usePopover'
import type { PopoverPlacement } from '#kit/composables/popover/placement'
import { placementOrigin } from '#kit/composables/menu/useMenu'
import { useStack } from '#kit/composables/useStack'
import { useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { useFocusTrap } from '#kit/composables/overlay/useFocusTrap'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { supportsPopover } from '#kit/shared/utils/support'
import { splitMenuAttrs } from '#kit/utils/menu/attrs'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /** Side of the anchor the panel opens on; `start` / `end` are logical. */
  placement: { type: String as PropType<PopoverPlacement>, default: 'bottom-start' },
  matchWidth: { type: Boolean, default: false },
  /** Element the panel is positioned against; defaults to the parent element. */
  anchor: { type: Object as PropType<HTMLElement | null>, default: null },
  /** Close on a press outside the panel and its trigger. `click-outside` is emitted either way. */
  closeOnOutside: { type: Boolean, default: true },
  lockScroll: { type: Boolean, default: true },
  /** Move focus into the panel, keep Tab inside, give it back on Escape. */
  trapFocus: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'click-outside'): void
}>()

const modelValue = defineModel<boolean>({ default: false })

const attrs = useAttrs()
const split = computed(() => splitMenuAttrs(attrs))

const anchorRef = shallowRef<HTMLElement | null>(null)
const positioned = shallowRef<HTMLElement | null>(null)
const surface = shallowRef<HTMLElement | null>(null)

// Slotted into a button's label, the parent is a <span>; the button around it
// is the trigger. Elsewhere the parent element is.
const trigger = () => {
  const parent = anchorRef.value?.parentElement ?? null
  return parent?.closest<HTMLElement>('button, a[href], [role="button"]') ?? parent
}
const anchorEl = computed(() => props.anchor ?? trigger())

const usesPopoverLayer = supportsPopover()
const teleportTarget = useOverlayTeleportTarget()

const isMounted = shallowRef(false)
onMounted(() => {
  isMounted.value = true
})

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
  popover.reposition()
}

const popover = usePopover(modelValue, {
  placement: () => props.placement,
  matchWidth: () => props.matchWidth,
  trigger: () => anchorEl.value,
  surface: () => positioned.value,
})

const origin = computed(() => placementOrigin(popover.placement.value, popover.direction.value))

watch(anchorEl, (el, previous) => {
  if (!popover.isAnchorSupported.value) return
  previous?.style.removeProperty('anchor-name')
  el?.style.setProperty('anchor-name', popover.anchorName)
}, { immediate: true })

// A press outside closes without taking focus back: it went where the press put it.
const returnFocus = shallowRef(true)
const focusTrap = useFocusTrap(surface, { returnFocus })

watch(modelValue, async (open) => {
  if (!open) {
    focusTrap.deactivate()
    return
  }
  if (!props.trapFocus) return
  returnFocus.value = true
  focusTrap.rememberFocus()
  await nextTick()
  focusTrap.activate()
}, { flush: 'sync' })

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.trapFocus) return
  event.preventDefault()
  modelValue.value = false
}

function requestClose() {
  emit('click-outside')
  if (props.closeOnOutside) modelValue.value = false
}

const ticket = useStack().register({ onDismiss: requestClose })
const scrollLock = useScrollLock()

watch(modelValue, (open) => {
  if (open) {
    ticket.select()
    if (props.lockScroll) scrollLock.lock()
  } else {
    ticket.unselect()
    scrollLock.unlock()
  }
}, { immediate: true })

const outside = useClickOutside(surface, () => {
  if (!modelValue.value) return
  if (props.closeOnOutside) returnFocus.value = false
  requestClose()
}, { ignore: [trigger] })

// A closed panel listens to nothing.
watch(modelValue, open => (open ? outside.resume() : outside.pause()), { immediate: true })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/popover/index' as t;

$t: material-map(t.$tokens, 'md-popover');

.ui-popover {
  // Neutralise the UA [popover] box; the surface below draws the panel.
  position: fixed;
  inset: auto;
  width: max-content;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;
  pointer-events: auto;

  &__surface {
    position: relative;
    width: 100%;
    border-radius: g($t, 'surface.border.radius');
    background-color: g($t, 'surface.bg.color');
    color: g($t, 'surface.color');
    box-shadow: g($t, 'surface.shadow');
    transform-origin: var(--ui-menu-origin);

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  // Reduced motion shortens the system durations; the fade stays, the scale goes.
  &-anim-enter-active {
    transition: opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');

    .ui-popover__surface {
      transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
    }
  }

  &-anim-leave-active {
    transition: opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');

    .ui-popover__surface {
      transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
    }
  }

  &-anim-enter-from,
  &-anim-leave-to {
    opacity: 0;

    .ui-popover__surface {
      transform: scale(g($t, 'motion.scale.from'));

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }
}
</style>
