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
import { useEventListener } from '@vueuse/core'

interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '',
})

const visible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

const position = ref({ top: 0, left: 0 })

const tooltipStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  position: 'fixed' as const,
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
  await nextTick()
  updatePosition()
}

function onLeave() {
  visible.value = false
}

// Reactively reposition tooltip on scroll/resize when visible
if (import.meta.client) {
  useEventListener('scroll', updatePosition, { capture: true, passive: true })
  useEventListener('resize', updatePosition, { passive: true })
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tooltip' as v;

.ui-tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }
}

// Teleported content
.ui-tooltip__content {
  z-index: v.$z-index;
  padding: v.$content-padding;
  border-radius: v.$content-border-radius;
  background-color: v.$content-bg-color;
  color: v.$content-color;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: v.$content-shadow;

  @include typescale(v.$content-text-type);
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
