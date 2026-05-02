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
.ui-dialog {
  display: flex;
  flex-direction: column;
  max-width: 560rem;
  min-width: 280rem;
  width: fit-content;
  border-radius: 28rem;
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
  padding: 24rem;
  margin: 16rem; // Margin from screen edges
  position: relative;
  overflow: hidden;

  &__container {
    display: flex;
    flex-direction: column;
    gap: 16rem;
  }

  &__icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16rem;
    color: var(--color-secondary, #625b71);
    font-size: 24rem;
  }

  &__headline {
    margin: 0;
    color: var(--color-on-surface, #1d1b20);
    text-align: center; // Default center, but can be left aligned based on content

    // Typography: Headline Small
    @include typescale('headline-small');
  }

  &__icon + &__headline {
    text-align: center;
  }

  &__content {
    color: var(--color-on-surface-variant, #49454f);

    // Typography: Body Medium
    @include typescale('body-medium');
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8rem;
    margin-top: 24rem;
  }
}
</style>
