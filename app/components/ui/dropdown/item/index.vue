<template>
  <m-list-item
    class="ui-dropdown-item"
    :class="{ 'ui-dropdown-item--selected': selected }"
    :interactive="true"
    v-bind="$attrs"
  >
    <template v-if="$slots.leading || selected" #leading>
      <slot name="leading">
        <m-loading
          v-if="selected"
          variant="expressive"
          size="small"
        />
      </slot>
    </template>

    <slot />

    <template v-if="$slots.trailing" #trailing>
      <slot name="trailing" />
    </template>
  </m-list-item>
</template>

<script setup lang="ts">
interface Props {
  selected?: boolean
}

defineProps<Props>()
</script>

<style lang="scss">
.ui-dropdown-item {
  position: relative;

  &--selected {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 15%;
      height: 70%;
      width: 4rem;
      background-color: var(--color-primary);
      border-radius: 0 4rem 4rem 0;
    }

    &:hover {
      background-color: color-mix(in srgb, var(--color-secondary-container) 92%, var(--color-on-secondary-container) 8%);
    }
  }
}
</style>
