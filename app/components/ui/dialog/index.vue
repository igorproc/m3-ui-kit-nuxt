<template>
  <vue-final-modal
    v-bind="{ modelValue, ...themeAttrs }"
    class="ui-dialog-backdrop"
    content-class="ui-dialog"
    overlay-transition="vfm-fade"
    content-transition="vfm-fade"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    @update:model-value="emit('update:modelValue', $event)"
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

interface Props {
  title?: string
  modelValue?: boolean
  clickToClose?: boolean
  escToClose?: boolean
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  modelValue: undefined,
  clickToClose: true,
  escToClose: true,
})

const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)

const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
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
