<template>
  <!--
    Client-only, like every overlay: teleports into the shared #ui-overlay-host
    (or the overlay it sits in). SSR teleport anchors in the host would break
    hydration of the other overlays rendered there. A `v-if` leaves a comment
    in place, where <client-only> renders a <span> that would land in its
    parent (a stray grid cell in m-layout).
  -->
  <teleport
    v-if="isMounted"
    :to="teleportTarget"
  >
    <LiveRegion v-if="ownsRegion" />

    <transition
      name="ui-snackbar-fade"
      @enter="showInTopLayer"
    >
      <div
        v-if="shown"
        ref="root"
        :popover.attr="usesPopoverLayer ? 'manual' : undefined"
        class="ui-snackbar"
        :style="{ zIndex: ticket.zIndex.value }"
      >
        <div
          class="ui-snackbar__surface"
          :class="{
            'ui-snackbar__surface--stacked': actionPlacement === 'below',
            'ui-snackbar__surface--trailing': hasTrailing,
          }"
          @mouseenter="timer.hold"
          @mouseleave="timer.release"
          @focusin="timer.hold"
          @focusout="timer.release"
        >
          <div
            ref="labelEl"
            class="ui-snackbar__label"
          >
            <slot>
              {{ label }}
            </slot>
          </div>

          <div
            v-if="hasTrailing"
            class="ui-snackbar__controls"
          >
            <slot
              name="action"
              :dismiss="onAction"
            >
              <button
                v-if="actionLabel"
                type="button"
                class="ui-snackbar__action"
                @click="onAction"
              >
                {{ actionLabel }}
              </button>
            </slot>

            <button
              v-if="closable"
              type="button"
              class="ui-snackbar__close"
              :aria-label="closeLabel"
              @click="dismiss('close')"
            >
              <MIcon
                class="ui-snackbar__close-icon"
                :name="ICONS.close"
              />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useSlots, watch } from 'vue'
import LiveRegion from '#kit/components/fragments/live-region/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { useStack } from '#kit/composables/useStack'
import { supportsPopover } from '#kit/shared/utils/support'
import { ICONS } from '#kit/shared/constants/icons'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useLiveRegion } from '#kit/composables/overlay/useLiveRegion'
import { useSnackbarTimer } from '#kit/utils/snackbar/useSnackbarTimer'
import { mSnackbarProps } from './props'
import type { MSnackbarDismissReason } from './props'

const props = defineProps(mSnackbarProps)

const emit = defineEmits<{
  (e: 'action'): void
  (e: 'dismiss', reason: MSnackbarDismissReason): void
}>()

const modelValue = defineModel<boolean>({ default: false })
const slots = useSlots()

const hasAction = computed(() => Boolean(props.actionLabel || slots.action))
const hasTrailing = computed(() => hasAction.value || props.closable)
const hasMessage = computed(() => Boolean(props.label || slots.default))
const shown = computed(() => modelValue.value && hasMessage.value)

// Inside an overlay the snackbar renders into it (outside an open modal it would
// be inert); elsewhere into #ui-overlay-host with the other overlays.
const teleportTarget = useOverlayTeleportTarget()

// The message is announced through the layer's persistent region, which is in
// the document before the message. A layer without one gets this snackbar's.
const live = useLiveRegion(teleportTarget)
const ownsRegion = shallowRef(false)
const isMounted = shallowRef(false)
onMounted(() => {
  ownsRegion.value = !live.hasRegion()
  isMounted.value = true
})

// Overlay stacking: derive z-index from activation order instead of a magic number.
const stack = useStack()
const ticket = stack.register()

// Top layer keeps the snackbar visible above a modal <dialog>.
const root = shallowRef<HTMLElement | null>(null)
const labelEl = shallowRef<HTMLElement | null>(null)
const usesPopoverLayer = supportsPopover()

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
}

// The top layer stacks by opening order: a modal opened after the snackbar
// would cover it, so re-enter the top layer above the new modal.
watch(() => stack.topModal.value, () => {
  const el = root.value
  if (!el || !usesPopoverLayer || !el.matches(':popover-open')) return
  el.hidePopover()
  el.showPopover()
}, { flush: 'post' })

function dismiss(reason: MSnackbarDismissReason) {
  if (!modelValue.value) return
  emit('dismiss', reason)
  modelValue.value = false
}

function onAction() {
  if (!modelValue.value) return
  emit('action')
  dismiss('action')
}

const timer = useSnackbarTimer({
  open: shown,
  duration: () => props.duration,
  hasAction: () => hasAction.value,
  onTimeout: () => dismiss('timeout'),
})

let announcedText = ''

watch(shown, (open) => {
  if (open) {
    ticket.select()
  } else {
    ticket.unselect()
    live.withdraw(announcedText)
  }
}, { immediate: true })

// Read from the rendered label, so slot content is announced as it reads.
watch(labelEl, async (el) => {
  if (!el) return
  await nextTick()
  announcedText = el.textContent?.trim() ?? ''
  live.announce(announcedText)
}, { flush: 'post' })

if (import.meta.dev) {
  watch(modelValue, (open) => {
    if (!open) return
    if (!hasMessage.value)
      console.warn('[m-snackbar] has no message: pass `label` or the default slot. Nothing is shown.')
    if (props.closable && !props.closeLabel)
      console.warn('[m-snackbar] the close control has no accessible name: pass `close-label`.')
    if (timer.lifetime.value === null && !hasTrailing.value)
      console.warn('[m-snackbar] an `indefinite` snackbar needs an action or `closable`: nothing else dismisses it.')
  }, { immediate: true })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/snackbar/index' as t;

$t: material-map(t.$tokens, 'md-snackbar');

.ui-snackbar {
  // Above the layout's pinned bottom zone (navigation bar), clear of its side
  // zones; the window's own inset rides on the layout's when it has one.
  position: fixed;
  inset-block: auto g($t, 'inset.block.end');
  inset-inline: g($t, 'inset.inline.start') g($t, 'inset.inline.end');

  // Neutralise the UA [popover] box.
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;
  display: flex;
  justify-content: center;
  pointer-events: none;

  &__surface {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: g($t, 'surface.gap');
    max-width: g($t, 'surface.max.width');
    min-height: g($t, 'surface.min.height');
    margin-inline: g($t, 'surface.margin.inline');
    padding-inline: g($t, 'surface.padding.inline.start') g($t, 'surface.padding.inline.end');
    border-radius: g($t, 'surface.border.radius');
    background-color: g($t, 'surface.bg.color');
    color: g($t, 'surface.color');
    box-shadow: g($t, 'surface.shadow');

    @include forced-colors {
      border: 1px solid CanvasText;
    }

    // Action and close sit closer to the edge than the message does.
    &--trailing {
      padding-inline-end: g($t, 'surface.padding.inline.trailing');
    }

    &--stacked {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__label {
    flex: 1;
    min-width: 0;
    padding-block: g($t, 'label.padding.block');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'label.text.type'));
  }

  &__surface--stacked &__label {
    padding-block-end: 0;
  }

  &__controls {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: flex-end;
    gap: g($t, 'controls.gap');
  }

  &__action,
  &__close {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background-color g($t, 'motion.state.duration') g($t, 'motion.state.easing');

    // 40 high on screen, 48 for a finger.
    @include touch-target;

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__action {
    min-height: g($t, 'action.min.height');
    padding-block: g($t, 'action.padding.block');
    padding-inline: g($t, 'action.padding.inline');
    border-radius: g($t, 'action.border.radius');
    color: g($t, 'action.color');

    @include typescale(g($t, 'action.text.type'));

    @include can-hover {
      &:hover {
        background-color: g($t, 'action.hover.bg');
      }
    }

    &:active {
      background-color: g($t, 'action.pressed.bg');
    }

    @include forced-colors {
      color: ButtonText;
    }
  }

  &__close {
    width: g($t, 'close.size');
    height: g($t, 'close.size');
    padding: 0;
    border-radius: g($t, 'close.border.radius');
    color: g($t, 'close.color');

    @include can-hover {
      &:hover {
        background-color: g($t, 'close.hover.bg');
      }
    }

    &:active {
      background-color: g($t, 'close.pressed.bg');
    }

    @include forced-colors {
      color: ButtonText;
    }
  }

  &__close-icon {
    font-size: g($t, 'close.icon.size');
  }
}

// Reduced motion shortens the system durations; the fade stays, the rise goes.
.ui-snackbar-fade {
  &-enter-active {
    transition:
      opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing'),
      transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &-leave-active {
    transition:
      opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing'),
      transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(g($t, 'motion.rise'));

    @media (prefers-reduced-motion: reduce) {
      transform: none;
    }
  }
}
</style>
