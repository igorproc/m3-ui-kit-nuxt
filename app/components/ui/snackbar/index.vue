<template>
  <Teleport to="body">
    <transition name="ui-snackbar-fade">
      <div
        v-if="modelValue"
        class="ui-snackbar"
        role="status"
        aria-live="polite"
      >
        <div class="ui-snackbar__surface">
          <p class="ui-snackbar__label">
            <slot>
              {{ label }}
            </slot>
          </p>

          <button
            v-if="actionLabel"
            type="button"
            class="ui-snackbar__action"
            @click="onAction"
          >
            {{ actionLabel }}
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  actionLabel?: string
}

withDefaults(defineProps<Props>(), {
  label: '',
  actionLabel: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'action'): void
}>()

const modelValue = defineModel<boolean>({ default: false })

function onAction() {
  emit('action')
  emit('update:modelValue', false)
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/snackbar' as v;

.ui-snackbar {
  position: fixed;
  inset-inline: 0;
  bottom: v.$bottom-offset;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: v.$z-index;

  &__surface {
    pointer-events: auto;
    max-width: v.$surface-max-width;
    margin-inline: v.$surface-margin-inline;
    padding: v.$surface-padding;
    border-radius: v.$surface-border-radius;
    background-color: v.$surface-bg-color;
    color: v.$surface-color;
    box-shadow: v.$surface-shadow;
    display: flex;
    align-items: center;
    gap: v.$surface-gap;
  }

  &__label {
    margin: 0;

    @include typescale(v.$label-text-type);
  }

  &__action {
    border: none;
    background: transparent;
    padding: v.$action-padding;
    border-radius: v.$action-border-radius;
    cursor: pointer;

    @include typescale(v.$action-text-type);

    color: v.$action-color;

    &:hover {
      background-color: v.$action-hover-bg;
    }
  }
}

.ui-snackbar-fade-enter-active,
.ui-snackbar-fade-leave-active {
  transition:
    opacity var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);
}

.ui-snackbar-fade-enter-from,
.ui-snackbar-fade-leave-to {
  opacity: 0;
  transform: translateY(12rem);
}
</style>
