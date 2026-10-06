<template>
  <span
    class="ui-tooltip"
    @mouseenter="show"
    @mouseleave="scheduleHide"
    @focusin="show"
    @focusout="hide"
  >
    <span
      ref="trigger"
      class="ui-tooltip__trigger"
      :style="popover.anchorStyle.value"
      :aria-describedby="visible ? tooltipId : undefined"
    >
      <slot />
    </span>

    <client-only>
      <teleport :to="teleportTarget">
        <transition
          name="ui-tooltip-fade"
          @enter="showInTopLayer"
          @after-enter="popover.onAfterEnter"
          @after-leave="popover.onAfterLeave"
        >
          <span
            v-if="visible"
            :id="tooltipId"
            ref="surface"
            class="ui-tooltip__content"
            role="tooltip"
            :popover.attr="usesPopoverLayer ? 'manual' : undefined"
            :style="[popover.popoverStyle.value, { zIndex: ticket.zIndex.value }]"
            @mouseenter="hideTimer.stop"
            @mouseleave="scheduleHide"
          >
            <slot name="content">
              {{ text }}
            </slot>
          </span>
        </transition>
      </teleport>
    </client-only>
  </span>
</template>

<script setup lang="ts">
import { shallowRef, useId, watch } from 'vue'
import { useStack } from '#kit/composables/useStack'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { usePopover } from '#kit/composables/popover/usePopover'
import { useTimer } from '#kit/composables/useTimer'
import { supportsPopover } from '#kit/shared/utils/support'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { mTooltipProps } from './props'

defineProps(mTooltipProps)

/** Gap between trigger and tooltip — mirrors the `content.offset` token. */
const TOOLTIP_OFFSET = 8
/** Grace period for moving the pointer from the trigger onto the tooltip (WCAG 1.4.13, hoverable). */
const HIDE_DELAY_MS = 100

const tooltipId = useId()
const visible = shallowRef(false)
const trigger = shallowRef<HTMLElement | null>(null)
const surface = shallowRef<HTMLElement | null>(null)

const popover = usePopover(visible, {
  placement: 'top',
  offset: TOOLTIP_OFFSET,
  trigger,
  surface,
})

// Top layer keeps the tooltip above a modal <dialog> and outside any overflow;
// the teleport puts it inside that dialog, where it is not inert.
const usesPopoverLayer = supportsPopover()
const teleportTarget = useOverlayTeleportTarget()

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
}

// Overlay stacking: keep the tooltip above whatever overlay it annotates.
const ticket = useStack().register()

watch(visible, value => (value ? ticket.select() : ticket.unselect()))

function show() {
  hideTimer.stop()
  visible.value = true
}

function hide() {
  hideTimer.stop()
  visible.value = false
}

const hideTimer = useTimer(hide, { duration: HIDE_DELAY_MS })

function scheduleHide() {
  hideTimer.start()
}

// Esc dismisses the tooltip (APG tooltip pattern) without moving focus.
useGlobalListener('window', 'keydown', (event) => {
  if ((event as KeyboardEvent).key === 'Escape' && visible.value) hide()
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/tooltip/index' as t;

.ui-tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }
}

// Teleported content
.ui-tooltip__content {
  $t: material-map(t.$tokens, 'md-tooltip');

  // Neutralise the UA [popover] box; hoverable even inside a popover overlay.
  pointer-events: auto;
  margin: 0;
  border: 0;
  overflow: visible;
  max-width: g($t, 'content.max-width');
  padding: g($t, 'content.padding');
  border-radius: g($t, 'content.border.radius');
  background-color: g($t, 'content.bg.color');
  color: g($t, 'content.color');
  white-space: normal;
  overflow-wrap: break-word;
  box-shadow: g($t, 'content.shadow');

  @include typescale(g($t, 'content.text.type'));
}

// Vue Transition
.ui-tooltip-fade-enter-active,
.ui-tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.ui-tooltip-fade-enter-from,
.ui-tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
