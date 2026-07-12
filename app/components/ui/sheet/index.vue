<template>
  <MOverlay
    v-model="modelValue"
    mode="modal"
    :close-on-outside="clickToClose"
    :close-on-escape="escToClose"
    transition="ui-sheet-pop"
  >
    <div
      class="ui-sheet"
      :style="dragContentStyle"
    >
      <div
        ref="containerRef"
        class="ui-sheet__container"
      >
        <div class="ui-sheet__drag-handle" />

        <div class="ui-sheet__content">
          <slot />
        </div>
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import MOverlay from '~/components/ui/overlay/index.vue'
import { useModal } from '~/composables/modal/useModal'
import { useDrag } from '~/composables/useDrag'
import { mSheetProps } from './props'

const props = defineProps(mSheetProps)

const modelValue = defineModel<boolean>({ default: false })

defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: unknown): void
}>()

// Stacking, scrim, scroll lock and focus come from <MOverlay>; keep the modal
// Context registration for programmatic ($modals) close cascades.
const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

defineExpose({ close })

// Drag-to-dismiss — vertical, downward only.
const containerRef = ref<HTMLElement | null>(null)
const dragOffset = shallowRef(0)

const DISMISS_THRESHOLD = 80

const { isDragging } = useDrag(containerRef, {
  axis: 'y',
  onMove: (state) => {
    dragOffset.value = Math.max(0, state.dy)
  },
  onEnd: (state) => {
    if (state.dy > DISMISS_THRESHOLD) {
      modelValue.value = false
    }
    dragOffset.value = 0
  },
})

// Apply the drag offset to the actual sheet (vfm content element), not the
// inner content — so the whole modal follows the finger. While dragging we
// kill the transition for 1:1 tracking; on release the base transition on
// `.ui-sheet` animates the snap-back.
const dragContentStyle = computed(() => {
  if (!isDragging.value || dragOffset.value === 0) {
    return {}
  }

  return {
    transform: `translateY(${dragOffset.value}px)`,
    transition: 'none',
  }
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/sheet/index' as t;

.ui-sheet {
  $prefix: 'md-sheet';
  $t: material-map(t.$tokens, $prefix);

  // Bottom-align inside the centered <MOverlay> panel.
  align-self: flex-end;
  width: 100%;
  max-width: g($t, 'max-width');
  margin-inline: g($t, 'margin-inline');
  border-radius: g($t, 'border-radius');
  background-color: g($t, 'bg-color');
  box-shadow: g($t, 'shadow');
  overflow: hidden;

  // Base transition drives the drag snap-back; suppressed inline while dragging.
  transition: transform g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');

  &__container {
    display: flex;
    flex-direction: column;
    gap: g($t, 'container-gap');
    padding: g($t, 'container-padding');
  }

  &__drag-handle {
    align-self: center;
    width: g($t, 'drag-handle-width');
    height: g($t, 'drag-handle-height');
    border-radius: g($t, 'drag-handle-radius');
    background-color: g($t, 'drag-handle-color');
    margin-bottom: g($t, 'drag-handle-margin-bottom');
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: g($t, 'content-gap');
    color: g($t, 'content-color');
  }
}

// Slide-up enter / slide-down exit: the <MOverlay> root fades the scrim while
// the nested `.ui-sheet` translates (one transition, child-targeted).
.ui-sheet-pop {
  $prefix: 'md-sheet';
  $t: material-map(t.$tokens, $prefix);

  &-enter-active {
    transition: opacity g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');

    .ui-sheet {
      transition: transform g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');
    }
  }

  &-leave-active {
    transition: opacity g($t, 'motion-exit-duration') g($t, 'motion-exit-easing');

    .ui-sheet {
      transition: transform g($t, 'motion-exit-duration') g($t, 'motion-exit-easing');
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .ui-sheet {
      transform: translateY(100%);
    }
  }
}
</style>
