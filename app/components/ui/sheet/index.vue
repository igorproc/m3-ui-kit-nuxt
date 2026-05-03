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
@use '~/assets/stylesheet/components/sheet' as v;

.ui-sheet {
  width: 100%;
  max-width: v.$max-width;
  margin-inline: v.$margin-inline;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  box-shadow: v.$shadow;
  overflow: hidden;

  &__container {
    display: flex;
    flex-direction: column;
    gap: v.$container-gap;
    padding: v.$container-padding;
    transition: transform var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);
  }

  &__drag-handle {
    align-self: center;
    width: v.$drag-handle-width;
    height: v.$drag-handle-height;
    border-radius: v.$drag-handle-radius;
    background-color: v.$drag-handle-color;
    margin-bottom: v.$drag-handle-margin-bottom;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: v.$content-gap;
    color: v.$content-color;
  }
}
</style>
