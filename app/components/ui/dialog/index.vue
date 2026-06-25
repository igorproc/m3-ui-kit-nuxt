<template>
  <vue-final-modal
    v-model="modelValue"
    v-bind="themeAttrs"
    class="ui-dialog-backdrop"
    content-class="ui-dialog"
    overlay-transition="vfm-fade"
    content-transition="ui-dialog-pop"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    :z-index-fn="zIndexFn"
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
  </vue-final-modal>
</template>

<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import { computed, inject, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useModal } from '~/composables/modal/useModal'
import type { M3ModalContext } from '~/composables/modal/useModal'
import { useStack } from '~/composables/useStack'

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

// Associate the headline with the dialog root (vue-final-modal already emits
// role="dialog" + aria-modal="true"; this supplies its accessible name).
const headlineId = useId()

const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)
const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: unknown): void
}>()

// Register this modal in the Context API
const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

// Unified overlay stacking — drive vfm's z-index through the global stack.
const stackTicket = useStack().register({
  onDismiss: () => close(),
  blocking: !props.clickToClose,
})

watch(
  modelValue,
  (open) => {
    if (open) stackTicket.select()
    else stackTicket.unselect()
  },
  { immediate: true },
)

const zIndexFn = () => stackTicket.zIndex.value

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

// M3 basic-dialog motion: fade + scale. Enter decelerates, exit accelerates.
.ui-dialog-pop {
  $prefix: 'md-dialog';
  $t: material-map(t.$tokens, $prefix);

  &-enter-active {
    transition:
      opacity g($t, 'motion-enter-duration') g($t, 'motion-enter-easing'),
      transform g($t, 'motion-enter-duration') g($t, 'motion-enter-easing');
  }

  &-leave-active {
    transition:
      opacity g($t, 'motion-exit-duration') g($t, 'motion-exit-easing'),
      transform g($t, 'motion-exit-duration') g($t, 'motion-exit-easing');
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: scale(g($t, 'motion-scale-from'));
  }
}
</style>
