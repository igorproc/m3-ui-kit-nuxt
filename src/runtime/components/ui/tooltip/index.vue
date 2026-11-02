<template>
  <span
    class="ui-tooltip"
    @pointerenter="control.onPointerEnter"
    @mouseenter="control.onMouseEnter"
    @mouseleave="control.scheduleHide"
    @focusin="control.onFocusIn"
    @focusout="control.hide"
    @pointerdown="control.onPointerDown"
    @pointerup="control.onPointerEnd"
    @pointercancel="control.onPointerEnd"
    @click.capture="control.onAfterLongPress"
    @contextmenu.capture="control.onAfterLongPress"
  >
    <span
      ref="trigger"
      class="ui-tooltip__trigger"
      :style="popover.anchorStyle.value"
    >
      <slot :props="control.triggerProps.value" />
    </span>

    <!-- A `v-if` leaves a comment in place, where <client-only> renders a <span>. -->
    <teleport
      v-if="isMounted"
      :to="teleportTarget"
    >
      <transition
        name="ui-tooltip-fade"
        @enter="showInTopLayer"
        @after-enter="popover.onAfterEnter"
        @after-leave="onAfterLeave"
      >
        <span
          v-show="open"
          :id="tooltipId"
          ref="surface"
          class="ui-tooltip__content"
          :class="`ui-tooltip__content--${variant}`"
          role="tooltip"
          :dir="popover.surfaceDir.value"
          :popover.attr="usesPopoverLayer ? 'manual' : undefined"
          :style="[popover.popoverStyle.value, { zIndex: ticket.zIndex.value }]"
          @mouseenter="control.cancelHide"
          @mouseleave="control.scheduleHide"
        >
          <span
            v-if="isRich && hasSubhead"
            class="ui-tooltip__subhead"
          >
            <slot name="subhead">
              {{ subhead }}
            </slot>
          </span>
          <span class="ui-tooltip__text">
            <slot name="content">
              {{ text }}
            </slot>
          </span>
        </span>
      </transition>
    </teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef, useId, useSlots, watch } from 'vue'
import { useStack } from '#kit/composables/useStack'
import { usePopover } from '#kit/composables/popover/usePopover'
import { useTooltipControl } from '#kit/composables/tooltip/useTooltipControl'
import { supportsPopover } from '#kit/shared/utils/support'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { mTooltipProps } from './props'

const props = defineProps(mTooltipProps)

const open = defineModel<boolean>('open', { default: false })
const slots = useSlots()

/** Gap between trigger and tooltip, M3 `SpacingBetweenTooltipAndAnchor`; one home for it. */
const TOOLTIP_OFFSET = '4rem'
/** Grace period for moving the pointer from the trigger onto the tooltip (WCAG 1.4.13, hoverable). */
const HIDE_DELAY_MS = 100

const tooltipId = useId()
const trigger = shallowRef<HTMLElement | null>(null)
const surface = shallowRef<HTMLElement | null>(null)

const isRich = computed(() => props.variant === 'rich')
const hasSubhead = computed(() => Boolean(props.subhead || slots.subhead))

const control = useTooltipControl({
  id: tooltipId,
  open,
  trigger,
  hideDelay: HIDE_DELAY_MS,
  disabled: () => props.disabled,
  hasContent: () => Boolean(props.text || slots.content || (isRich.value && hasSubhead.value)),
})

const popover = usePopover(open, {
  placement: () => props.placement,
  offset: TOOLTIP_OFFSET,
  trigger,
  surface,
})

// The surface lives in the document from mount on, so the trigger's
// description points at it before the first showing. Client-only: a teleport
// in the SSR output breaks the hydration of the other overlays in the host.
const isMounted = shallowRef(false)
onMounted(() => {
  isMounted.value = true
})

// Top layer keeps the tooltip above a modal <dialog> and outside any overflow;
// the teleport puts it inside that dialog, where it is not inert.
const usesPopoverLayer = supportsPopover()
const teleportTarget = useOverlayTeleportTarget()

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
}

function onAfterLeave(el: Element) {
  if (usesPopoverLayer && (el as HTMLElement).matches(':popover-open')) (el as HTMLElement).hidePopover()
  popover.onAfterLeave()
}

// Overlay stacking: keep the tooltip above whatever overlay it annotates.
const ticket = useStack().register()

watch(open, value => (value ? ticket.select() : ticket.unselect()))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/tooltip/index' as t;

$t: material-map(t.$tokens, 'md-tooltip');

.ui-tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }
}

// Teleported content
.ui-tooltip__content {
  // Neutralise the UA [popover] box; hoverable even inside a popover overlay.
  pointer-events: auto;
  margin: 0;
  border: 0;
  overflow: visible;
  white-space: normal;
  overflow-wrap: break-word;

  @include forced-colors {
    border: 1px solid CanvasText;
  }

  &--plain {
    min-width: g($t, 'plain.min.width');
    min-height: g($t, 'plain.min.height');
    max-width: g($t, 'plain.max.width');
    padding: g($t, 'plain.padding');
    border-radius: g($t, 'plain.border.radius');
    background-color: g($t, 'plain.bg.color');
    color: g($t, 'plain.color');
    box-shadow: g($t, 'plain.shadow');

    @include typescale(g($t, 'plain.text.type'));
  }

  &--rich {
    display: flex;
    flex-direction: column;
    gap: g($t, 'rich.gap');
    max-width: g($t, 'rich.max.width');
    padding: g($t, 'rich.padding');
    border-radius: g($t, 'rich.border.radius');
    background-color: g($t, 'rich.bg.color');
    color: g($t, 'rich.color');
    box-shadow: g($t, 'rich.shadow');

    @include typescale(g($t, 'rich.text.type'));
  }
}

.ui-tooltip__subhead {
  color: g($t, 'rich.subhead.color');

  @include typescale(g($t, 'rich.subhead.type'));
}

// Reduced motion shortens the system durations; the fade stays, the scale goes.
.ui-tooltip-fade {
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
    transform: scale(g($t, 'motion.scale.from'));

    @media (prefers-reduced-motion: reduce) {
      transform: none;
    }
  }
}
</style>
