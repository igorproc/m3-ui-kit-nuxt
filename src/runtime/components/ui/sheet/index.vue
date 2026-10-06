<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-sheet-pop'"
  >
    <div class="ui-sheet">
      <div class="ui-sheet__container">
        <div class="ui-sheet__drag-handle" />

        <div class="ui-sheet__content">
          <slot />
        </div>
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { mSheetProps } from './props'

const props = defineProps(mSheetProps)

const modelValue = defineModel<boolean>({ default: false })

defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: unknown): void
}>()

// Stacking, scrim, scroll lock, focus and swipe-to-dismiss come from <MOverlay>;
// lifecycle events (`opened`, `closed`, …) fall through to it.
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/sheet/index' as t;

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
