<template>
  <vue-final-modal
    v-model="modelValue"
    v-bind="themeAttrs"
    class="ui-dialog-backdrop"
    content-class="ui-dialog"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
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
import { computed, inject } from 'vue'
import type { ComputedRef } from 'vue'
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

const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)
const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data?: any): void
}>()

// Register this modal in the Context API
const { close } = useModal({
  visible: modelValue,
  parent: props.parent,
})

defineExpose({
  close,
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/dialog' as v;

.ui-dialog {
  display: flex;
  flex-direction: column;
  max-width: v.$max-width;
  min-width: v.$min-width;
  width: fit-content;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
  color: v.$text-color;
  box-shadow: v.$shadow;
  padding: v.$padding;
  margin: v.$margin;
  position: relative;
  overflow: hidden;

  &__container {
    display: flex;
    flex-direction: column;
    gap: v.$container-gap;
  }

  &__icon {
    display: flex;
    justify-content: center;
    margin-bottom: v.$icon-margin-bottom;
    color: v.$icon-color;
    font-size: v.$icon-size;
  }

  &__headline {
    margin: 0;
    color: v.$headline-color;
    text-align: center;

    @include typescale(v.$headline-text-type);
  }

  &__icon + &__headline {
    text-align: center;
  }

  &__content {
    color: v.$content-color;

    @include typescale(v.$content-text-type);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: v.$actions-gap;
    margin-top: v.$actions-margin-top;
  }
}
</style>
