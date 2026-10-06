<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-dialog-pop'"
    :aria-labelledby="title ? headlineId : undefined"
    :aria-label="title ? undefined : 'Dialog'"
  >
    <div class="ui-dialog">
      <div class="ui-dialog__container">
        <!-- Icon -->
        <div
          v-if="$slots.icon"
          class="ui-dialog__icon"
        >
          <slot name="icon" />
        </div>

        <!-- Headline -->
        <h2
          v-if="title"
          :id="headlineId"
          class="ui-dialog__headline"
        >
          {{ title }}
        </h2>

        <!-- Supporting Text -->
        <div class="ui-dialog__content">
          <slot />
        </div>

        <!-- Actions -->
        <div
          v-if="$slots.actions"
          class="ui-dialog__actions"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { mModalLayerProps, pickModalLayerProps } from '#kit/components/ui/overlay/props'

const props = defineProps({
  title: { type: String, default: undefined },
  ...mModalLayerProps,
})

const modelValue = defineModel<boolean>({ default: false })

defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: unknown): void
}>()

// The native <dialog> root is the accessible dialog; the headline names it.
// Lifecycle events (`opened`, `closed`, …) fall through to <MOverlay>.
const headlineId = useId()
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dialog/index' as t;

.ui-dialog {
  $prefix: 'md-dialog';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  max-width: g($t, 'max-width');
  min-width: g($t, 'min-width');
  width: fit-content;
  border-radius: g($t, 'border-radius');
  background-color: g($t, 'bg-color');
  color: g($t, 'text-color');
  box-shadow: g($t, 'shadow');
  padding: g($t, 'padding');
  margin: g($t, 'margin');
  position: relative;
  overflow: hidden;
  transform-origin: center;

  @include forced-colors {
    border: 1px solid CanvasText;
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: g($t, 'container-gap');
  }

  &__icon {
    display: flex;
    justify-content: center;
    margin-bottom: g($t, 'icon-margin-bottom');
    color: g($t, 'icon-color');
    font-size: g($t, 'icon-size');
  }

  &__headline {
    margin: 0;
    color: g($t, 'headline-color');
    text-align: center;

    @include typescale(g($t, 'headline-text-type'));
  }

  &__icon + &__headline {
    text-align: center;
  }

  &__content {
    color: g($t, 'content-color');

    @include typescale(g($t, 'content-text-type'));
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: g($t, 'actions-gap');
    margin-top: g($t, 'actions-margin-top');
  }
}

// M3 basic-dialog motion: the <MOverlay> root fades the scrim (opacity) while
// the nested `.ui-dialog` scales — one transition, differentiated by targeting
// the child (mirrors the menu pattern). Enter decelerates, exit accelerates.
.ui-dialog-pop {
  $prefix: 'md-dialog';
  $t: material-map(t.$tokens, $prefix);

  &-enter-active {
    transition: opacity g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');

    .ui-dialog {
      transition: transform g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');
    }
  }

  &-leave-active {
    transition: opacity g($t, 'motion-exit-duration') g($t, 'motion-exit-easing');

    .ui-dialog {
      transition: transform g($t, 'motion-exit-duration') g($t, 'motion-exit-easing');
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .ui-dialog {
      transform: scale(g($t, 'motion-scale-from'));
    }
  }
}
</style>
