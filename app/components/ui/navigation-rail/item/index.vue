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
        v-if="badge != null && badge > 0"
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

.ui-navigation-rail-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: v.$item-gap;
  padding: v.$item-padding;
  border: none;
  background: transparent;
  cursor: pointer;
  color: v.$item-color;
  width: 100%;
  min-height: 56rem;
  transition: all var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(v.$item-text-type);

  &__indicator {
    position: absolute;
    top: calc(#{v.$item-padding-y} / 2);
    left: 50%;
    transform: translate(-50%, 0);
    width: 56rem;
    height: 32rem;
    border-radius: var(--sys-shape-corner-full);
    opacity: 0;
    transition:
        opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
        width var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
        left var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard),
        transform var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
    z-index: 0;
  }

  &__icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
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
    text-align: center;
    z-index: 1;
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
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
    }

    &:hover {
      color: v.$item-color;

      .ui-navigation-rail-item__indicator {
        opacity: 0.08;
      }
    }
  }

  // When the rail is expanded
  &--expanded {
    flex-direction: row;
    justify-content: flex-start;
    padding: 0 16rem;
    gap: 12rem;

    .ui-navigation-rail-item__indicator {
      padding: v.$indicator-padding;
      top: 50%;
      left: calc(#{v.$indicator-padding} / 2);
      transform: translateY(-50%);
      width: calc(100% - 24rem);
    }
  }
}
</style>
