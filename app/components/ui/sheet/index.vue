<template>
  <vue-final-modal
    v-bind="{ modelValue }"
    class="ui-sheet-backdrop"
    content-class="ui-sheet"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      class="ui-sheet__container"
      :style="sheetTransformStyle"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    >
      <div class="ui-sheet__drag-handle" />

      <div class="ui-sheet__content">
        <slot />
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'

interface Props {
  modelValue?: boolean
  clickToClose?: boolean
  escToClose?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  clickToClose: true,
  escToClose: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dragState = reactive({
  startY: 0,
  currentY: 0,
  isDragging: false,
})

const sheetTransformStyle = computed(() => {
  if (!dragState.isDragging) {
    return {}
  }

  const delta = Math.max(0, dragState.currentY - dragState.startY)

  return {
    transform: `translateY(${delta}px)`,
  }
})

function onTouchEnd() {
  if (!dragState.isDragging) {
    return
  }

  const delta = dragState.currentY - dragState.startY

  dragState.isDragging = false
  dragState.startY = 0
  dragState.currentY = 0

  if (delta > 80) {
    emit('update:modelValue', false)
  }
}

function onTouchCancel() {
  dragState.isDragging = false
  dragState.startY = 0
  dragState.currentY = 0
}
</script>

<style lang="scss">
.ui-sheet {
  width: 100%;
  max-width: 720rem;
  margin-inline: auto;
  border-radius: var(--sys-shape-corner-extra-large-top);
  background-color: var(--color-sheet-surface);
  box-shadow:
    0 -4rem 8rem 3rem rgb(0 0 0 / 15%),
    0 -1rem 3rem rgb(0 0 0 / 30%);
  overflow: hidden;

  &__container {
    display: flex;
    flex-direction: column;
    gap: 8rem;
    padding: 16rem 16rem 24rem;
    transition: transform var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);
  }

  &__drag-handle {
    align-self: center;
    width: 32rem;
    height: 4rem;
    border-radius: 999rem;
    background-color: var(--color-outline-variant);
    margin-bottom: 8rem;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16rem;
    color: var(--color-on-surface);
  }
}
</style>
