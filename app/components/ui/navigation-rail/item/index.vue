<template>
  <button
    type="button"
    class="ui-navigation-rail__item"
    :class="{
      'ui-navigation-rail__item--active': active,
      'ui-navigation-rail__item--expanded': expanded,
    }"
    @click="$emit('select')"
  >
    <div class="ui-navigation-rail__indicator" />

    <span class="ui-navigation-rail__icon-wrapper">
      <m-icon
        class="ui-navigation-rail__icon"
        :name="icon"
        aria-hidden="true"
      />

      <m-badge
        v-if="badge != null && badge > 0"
        class="ui-navigation-rail__badge"
        :value="badge"
      />
    </span>

    <span class="ui-navigation-rail__label">
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

.ui-navigation-rail__item {
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

  &:hover {
    color: var(--color-surface-contrast);
    .ui-navigation-rail__indicator {
      opacity: 0.08;
      background-color: var(--color-on-surface);
    }
  }

  &--active {
    color: v.$item-active-color;
    font-weight: 700;

    .ui-navigation-rail__indicator {
      opacity: 1;
      background-color: var(--color-secondary-container);
    }

    &:hover .ui-navigation-rail__indicator {
      opacity: 0.8;
    }
  }
}

.ui-navigation-rail__indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
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

.ui-navigation-rail__icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.ui-navigation-rail__icon {
  font-size: v.$icon-size;
}

.ui-navigation-rail__badge {
  position: absolute;
  top: v.$badge-top;
  right: v.$badge-right;
}

.ui-navigation-rail__label {
  text-align: center;
  z-index: 1;
  transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
}

// When the rail is expanded
.ui-navigation-rail__item--expanded {
  flex-direction: row;
  justify-content: flex-start;
  padding: 0 16rem;
  gap: 12rem;

  .ui-navigation-rail__indicator {
    left: 12rem;
    transform: translateY(-50%);
    width: calc(100% - 24rem);
  }
}
</style>
