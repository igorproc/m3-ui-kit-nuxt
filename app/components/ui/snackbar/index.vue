<template>
  <Teleport to="body">
    <transition name="ui-snackbar-fade">
      <div
        v-if="modelValue"
        class="ui-snackbar"
        role="status"
        aria-live="polite"
        :style="{ zIndex: ticket.zIndex.value }"
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
import { watch } from 'vue'
import { useStack } from '~/composables/useStack'
import { mSnackbarProps } from './props'

defineProps(mSnackbarProps)

const emit = defineEmits<{
  (e: 'action'): void
}>()

const modelValue = defineModel<boolean>({ default: false })

// Overlay stacking: derive z-index from activation order instead of a magic number.
const ticket = useStack().register()

watch(modelValue, (val) => {
  if (val) {
    ticket.select()
  } else {
    ticket.unselect()
  }
}, { immediate: true })

function onAction() {
  emit('action')
  modelValue.value = false
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/snackbar/index' as t;

.ui-snackbar {
  $t: material-map(t.$tokens, 'md-snackbar');

  position: fixed;
  inset-inline: 0;
  bottom: g($t, 'bottom-offset');
  display: flex;
  justify-content: center;
  pointer-events: none;

  &__surface {
    pointer-events: auto;
    max-width: g($t, 'surface-max-width');
    margin-inline: g($t, 'surface-margin-inline');
    padding: g($t, 'surface-padding');
    border-radius: g($t, 'surface-border-radius');
    background-color: g($t, 'surface-bg-color');
    color: g($t, 'surface-color');
    box-shadow: g($t, 'surface-shadow');
    display: flex;
    align-items: center;
    gap: g($t, 'surface-gap');
  }

  &__label {
    margin: 0;

    @include typescale(g($t, 'label-text-type'));
  }

  &__action {
    border: none;
    background: transparent;
    padding: g($t, 'action-padding');
    border-radius: g($t, 'action-border-radius');
    cursor: pointer;

    @include typescale(g($t, 'action-text-type'));

    color: g($t, 'action-color');

    &:hover {
      background-color: g($t, 'action-hover-bg');
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
