<template>
  <vue-final-modal
    v-model="modelValue"
    class="ui-sheet-backdrop"
    content-class="ui-sheet"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
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
import { useModal } from '~/composables/modal/useModal'
import type { M3ModalContext } from '~/composables/modal/useModal'

interface Props {
  clickToClose?: boolean
  escToClose?: boolean
  parent?: M3ModalContext | null
}

const props = withDefaults(defineProps<Props>(), {
  clickToClose: true,
  escToClose: true,
  parent: undefined,
})

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: any): void
}>()

const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

defineExpose({
  close,
})

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
