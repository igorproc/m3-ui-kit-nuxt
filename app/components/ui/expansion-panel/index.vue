<template>
  <div
    class="ui-expansion-panel"
    :class="{
      'ui-expansion-panel--expanded': isOpen,
      'ui-expansion-panel--disabled': disabled,
    }"
  >
    <button
      type="button"
      class="ui-expansion-panel__header"
      :aria-expanded="isOpen"
      :disabled="disabled"
      @click="toggle"
    >
      <div class="ui-expansion-panel__header-content">
        <slot name="header">
          <span class="ui-expansion-panel__title">{{ title }}</span>
          <span
            v-if="description"
            class="ui-expansion-panel__description"
          >
            {{ description }}
          </span>
        </slot>
      </div>

      <div class="ui-expansion-panel__trailing">
        <ui-icon name="baseline-keyboard-arrow-down" />
      </div>
    </button>

    <div
      class="ui-expansion-panel__content-wrapper"
      :aria-hidden="!isOpen"
    >
      <div class="ui-expansion-panel__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  disabled: false,
})

const isOpen = defineModel<boolean>({ default: false })

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}
</script>

<style lang="scss">
.ui-expansion-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border-radius: var(--sys-shape-corner-medium);
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    margin var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-radius var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rem;
    width: 100%;
    min-height: 56rem;
    padding: 12rem 24rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--color-on-surface);
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:disabled {
      cursor: default;
      opacity: 0.38;
    }

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
    }

    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    }
  }

  &__header-content {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    flex: 1;
  }

  &__title {
    color: var(--color-on-surface);

    @include typescale('body-large');
  }

  &__description {
    color: var(--color-on-surface-variant);

    @include typescale('body-medium');
  }

  &__trailing {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-on-surface-variant);
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    font-size: 24rem;
  }

  // Content Animation using Grid Trick
  &__content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  }

  &__content {
    overflow: hidden;
    color: var(--color-on-surface-variant);
    padding: 0 24rem;
    opacity: 0;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      padding-bottom var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

    @include typescale('body-medium');
  }

  &--expanded {
    background-color: var(--color-surface-container-low);
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);

    .ui-expansion-panel__trailing {
      transform: rotate(180deg);
      color: var(--color-primary);
    }

    .ui-expansion-panel__content {
      opacity: 1;
      padding-bottom: 24rem;

      &-wrapper {
        grid-template-rows: 1fr;
      }
    }
  }
}
</style>
