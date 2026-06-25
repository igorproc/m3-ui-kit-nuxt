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
import { mNavigationRailItemProps } from './props'

defineProps(mNavigationRailItemProps)

defineEmits<{
  (e: 'select'): void
}>()
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/navigation-rail/index' as t;

.ui-navigation-rail-item {
  $t: material-map(t.$tokens, 'md-navigation-rail');

  position: relative;
  display: block;
  width: 100%;
  height: 72rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: g($t, 'item-color');
  transition: all var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

  @include typescale(g($t, 'item-typography'));

  &__indicator {
    position: absolute;
    top: 4rem;
    left: 50%;
    transform: translateX(-50%);
    width: 56rem;
    height: 32rem;
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'item-indicator-color');
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
    font-size: g($t, 'icon-size');
  }

  &__badge {
    position: absolute;
    top: g($t, 'badge-top');
    right: g($t, 'badge-right');
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
    color: g($t, 'item-hover-color');

    .ui-navigation-rail-item__indicator {
      opacity: g($t, 'item-indicator-hover-opacity');
      background-color: g($t, 'item-indicator-hover-color');
    }
  }

  &--active {
    color: g($t, 'item-active-color');
    font-weight: 700;

    .ui-navigation-rail-item__indicator {
      opacity: 1;
      background-color: g($t, 'item-indicator-color');
    }

    &:hover {
      color: g($t, 'item-active-color');

      .ui-navigation-rail-item__indicator {
        opacity: g($t, 'item-indicator-active-hover-opacity');
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

    // stylelint-disable-next-line selector-class-pattern -- fully-written descendant override (can't use `&__` here: `&` is `--expanded`)
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
