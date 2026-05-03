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
@use '~/assets/stylesheet/components/expansion-panel' as v;

.ui-expansion-panel {
  display: flex;
  flex-direction: column;
  background-color: v.$bg-color-default;
  border-radius: v.$border-radius;
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
    gap: v.$header-gap;
    width: 100%;
    min-height: v.$header-min-height;
    padding: v.$header-padding;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: v.$header-text-color;
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:disabled {
      cursor: default;
      opacity: v.$disabled-opacity;
    }

    &:hover:not(:disabled) {
      background-color: v.$header-hover-bg;
    }

    &:active:not(:disabled) {
      background-color: v.$header-active-bg;
    }
  }

  &__header-content {
    display: flex;
    flex-direction: column;
    gap: v.$header-content-gap;
    flex: 1;
  }

  &__title {
    color: v.$header-text-color;

    @include typescale(v.$title-text-type);
  }

  &__description {
    color: v.$description-text-color;

    @include typescale(v.$description-text-type);
  }

  &__trailing {
    display: flex;
    align-items: center;
    justify-content: center;
    color: v.$trailing-color-default;
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    font-size: v.$trailing-icon-size;
  }

  // Content Animation using Grid Trick
  &__content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  }

  &__content {
    overflow: hidden;
    color: v.$content-text-color;
    padding: 0 v.$content-padding-inline;
    opacity: 0;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      padding-bottom var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

    @include typescale(v.$content-text-type);
  }

  &--expanded {
    background-color: v.$bg-color-expanded;
    box-shadow: v.$expanded-shadow;

    .ui-expansion-panel__trailing {
      transform: rotate(180deg);
      color: v.$trailing-color-active;
    }

    .ui-expansion-panel__content {
      opacity: 1;
      padding-bottom: v.$content-padding-bottom;

      &-wrapper {
        grid-template-rows: 1fr;
      }
    }
  }
}
</style>
