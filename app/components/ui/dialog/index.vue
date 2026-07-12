<template>
  <MOverlay
    v-model="modelValue"
    mode="modal"
    :close-on-outside="clickToClose"
    :close-on-escape="escToClose"
    transition="ui-dialog-pop"
  >
    <div
      class="ui-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="title ? headlineId : undefined"
      :aria-label="title ? undefined : 'Dialog'"
    >
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
import { useId } from 'vue'
import MOverlay from '~/components/ui/overlay/index.vue'
import { useModal } from '~/composables/modal/useModal'
import type { M3ModalContext } from '~/composables/modal/useModal'

interface Props {
  title?: string
  clickToClose?: boolean
  escToClose?: boolean
  parent?: M3ModalContext | null
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  clickToClose: true,
  escToClose: true,
  parent: undefined,
})

const modelValue = defineModel<boolean>({ default: false })

// Supplies the dialog's accessible name (MDialog now owns role="dialog" +
// aria-modal; stacking, scrim, scroll lock and focus come from <MOverlay>).
const headlineId = useId()

defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: unknown): void
}>()

// Register in the modal Context API for programmatic ($modals) close cascades.
const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

defineExpose({
  close,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/dialog/index' as t;

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
