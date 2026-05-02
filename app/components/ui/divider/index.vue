<template>
  <div
    class="ui-divider"
    :class="dividerClasses"
    role="separator"
    :aria-orientation="orientation"
  />
</template>

<script setup lang="ts">
type DividerOrientation = 'horizontal' | 'vertical'
type DividerVariant = 'full' | 'inset'

interface Props {
  orientation?: DividerOrientation
  variant?: DividerVariant
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  variant: 'full',
})

const dividerClasses = computed(() => [
  `ui-divider--${props.orientation}`,
  `ui-divider--${props.variant}`,
])
</script>

<style lang="scss">
.ui-divider {
  background-color: var(--color-outline-variant);

  &--horizontal {
    width: 100%;
    height: 1rem;
  }

  &--vertical {
    width: 1rem;
    height: 100%;
  }

  &--inset.ui-divider--horizontal {
    margin-inline-start: 16rem;
  }
}
</style>
