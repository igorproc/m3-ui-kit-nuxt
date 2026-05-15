<template>
  <button
    type="button"
    class="ui-navigation-rail-item"
    :class="{
      'ui-navigation-rail-item--active': active,
      'ui-navigation-rail-item--expanded': expanded,
    }"
    @click="$emit('select')"
  >
    <div class="ui-navigation-rail-item__indicator" />

    <span class="ui-navigation-rail-item__icon-wrapper">
      <m-icon
        class="ui-navigation-rail-item__icon"
        :name="icon"
        aria-hidden="true"
      />

      <m-badge
        v-if="badge"
        class="ui-navigation-rail-item__badge"
        :value="badge"
      />
    </span>

    <span class="ui-navigation-rail-item__label">
      {{ label }}
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  active?: boolean
  expanded?: boolean
  icon: string
  label: string
  badge?: number
}

withDefaults(defineProps<Props>(), {
  active: false,
  expanded: false,
  badge: 0,
})

defineEmits<{
  (e: 'select'): void
}>()
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-rail' as v;

%active-indicator {
  .ui-navigation-rail-item__indicator {
    opacity: 0.08;
    background-color: var(--color-on-surface);
  }
}

.ui-navigation-rail-item {
  position: relative;
  display: block;
  width: 100%;
  height: 72rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: v.$item-color;
  transition: all var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  @include typescale(v.$item-text-type);

  &__indicator {
    position: absolute;
    top: 4rem;
    left: 50%;
    transform: translateX(-50%);
    width: 56rem;
    height: 32rem;
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-secondary-container);
    opacity: 0;
    transition: all var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
    z-index: 0;
  }

  &__icon-wrapper {
    position: absolute;
    top: 20rem;
    left: 50%;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    transition: all var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  }

  &__icon {
    font-size: v.$icon-size;
  }

  &__badge {
    position: absolute;
    top: v.$badge-top;
    right: v.$badge-right;
  }

  &__label {
    position: absolute;
    top: 54rem;
    left: 50%;
    transform: translate(-50%, -50%);
    width: max-content;
    text-align: center;
    z-index: 1;
    transition: all var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  }

  &:hover {
    color: var(--color-surface-contrast);

    .ui-navigation-rail-item__indicator {
      opacity: 0.08;
      background-color: var(--color-on-surface);
    }
  }

  &--active {
    color: v.$item-active-color;
    font-weight: 700;

    .ui-navigation-rail-item__indicator {
      opacity: 1;
      background-color: var(--color-secondary-container);
    }

    &:hover {
      color: v.$item-active-color;

      .ui-navigation-rail-item__indicator {
        opacity: 0.12;
      }
    }
  }

  // When the rail is expanded
  &--expanded {
    height: 56rem;

    .ui-navigation-rail-item__indicator {
      top: 0;
      left: 12rem;
      transform: translateX(0);
      width: calc(100% - 24rem);
      height: 56rem;
    }

    .ui-navigation-rail-item__icon-wrapper {
      top: 28rem;
      left: 40rem;
    }

    .ui-navigation-rail-item__label {
      top: 28rem;
      left: 72rem;
      transform: translate(0, -50%);
      text-align: left;
    }
  }
}
</style>
