<template>
  <m-list-item
    class="ui-dropdown-item"
    :class="{ 'ui-dropdown-item--selected': selected }"
    :interactive="true"
    v-bind="$attrs"
  >
    <template
      v-if="$slots.leading || selected"
      #leading
    >
      <slot name="leading">
        <m-loading
          v-if="selected"
          variant="expressive"
          size="small"
        />
      </slot>
    </template>

    <slot />

    <template
      v-if="$slots.trailing"
      #trailing
    >
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
@use '~/assets/stylesheet/components/dropdown/item' as *;

.ui-dropdown-item {
  $prefix: 'm-dropdown-item';
  $t: material-map($tokens, $prefix);

  position: relative;
  height: g($t, 'height');
  padding-inline: g($t, 'padding-inline');
  color: g($t, 'color');

  @include typescale(g($t, 'typography'));

  &--selected {
    background-color: g($t, 'selected-bg');
    color: g($t, 'selected-color');

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 15%;
      height: 70%;
      width: 4rem;
      background-color: g($t, 'selected-indicator');
      border-radius: 0 4rem 4rem 0;
    }

    &:hover {
      background-color: g($t, 'hover-selected-bg');
    }
  }
}
</style>
