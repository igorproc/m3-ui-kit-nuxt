<template>
  <span
    class="ui-tooltip"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <span
      ref="triggerRef"
      class="ui-tooltip__trigger"
    >
      <slot />
    </span>

    <teleport to="body">
      <transition name="ui-tooltip-fade">
        <span
          v-if="visible"
          ref="tooltipRef"
          class="ui-tooltip__content"
          role="tooltip"
          :style="tooltipStyle"
        >
          <slot name="content">
            {{ text }}
          </slot>
        </span>
      </transition>
    </teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useStack } from '~/composables/useStack'
import { useGlobalListener } from '~/composables/useGlobalListener'

interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '',
})

const visible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

// Overlay stacking: keep the tooltip above whatever overlay it annotates.
const ticket = useStack().register()

const position = ref({ top: 0, left: 0 })

const tooltipStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  position: 'fixed' as const,
  zIndex: ticket.zIndex.value,
}))

const updatePosition = () => {
  if (!visible.value || !triggerRef.value || !tooltipRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()

  // Default position: top centered
  const left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
  let top = triggerRect.top - tooltipRect.height - 8 // 8px offset

  // Boundary checks (prevent clipping)
  const safeLeft = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8))

  // If top goes off-screen, fallback to bottom
  if (top < 8) {
    top = triggerRect.bottom + 8
  }
  const safeTop = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8))

  position.value = { top: safeTop, left: safeLeft }
}

async function onEnter() {
  visible.value = true
  ticket.select()
  await nextTick()
  updatePosition()
}

function onLeave() {
  visible.value = false
  ticket.unselect()
}

// Reactively reposition tooltip on scroll/resize when visible
useGlobalListener('window', 'scroll', updatePosition, { capture: true, passive: true })
useGlobalListener('window', 'resize', updatePosition, { passive: true })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tooltip/index' as t;

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

  padding: g($t, 'content-padding');
  border-radius: g($t, 'content-border-radius');
  background-color: g($t, 'content-bg-color');
  color: g($t, 'content-color');
  white-space: nowrap;
  pointer-events: none;
  box-shadow: g($t, 'content-shadow');

  @include typescale(g($t, 'content-text-type'));
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
