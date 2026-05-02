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
.ui-snackbar {
  position: fixed;
  inset-inline: 0;
  bottom: 16rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 60;

  &__surface {
    pointer-events: auto;
    max-width: 560rem;
    margin-inline: 16rem;
    padding: 12rem 16rem;
    border-radius: var(--sys-shape-corner-large);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
    box-shadow:
      0 2rem 4rem rgb(0 0 0 / 16%),
      0 6rem 12rem rgb(0 0 0 / 12%);
    display: flex;
    align-items: center;
    gap: 16rem;
  }

  &__label {
    margin: 0;

    @include typescale('body-medium');
  }

  &__action {
    border: none;
    background: transparent;
    padding: 8rem 12rem;
    border-radius: var(--sys-shape-corner-small);
    cursor: pointer;

    @include typescale('label-large');

    color: var(--color-primary);

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-primary) 8%,
        transparent
      );
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
