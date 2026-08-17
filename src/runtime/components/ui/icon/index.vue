<template>
  <span class="ui-icon">
    <icon
      :name="resolvedName"
      aria-hidden="true"
    />
  </span>
</template>

<script setup lang="ts">
import { mIconProps } from './props'

const props = defineProps(mIconProps)

const resolvedName = computed(() => {
  if (!props.name) {
    return ''
  }

  if (props.name.includes(':')) {
    return props.name
  }

  return `ic:${props.name}`
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/icon/index' as t;

$prefix: 'md-icon';

.ui-icon {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;

  .iconify {
    font-size: inherit;
  }

  :deep(svg) {
    width: 1em;
    height: 1em;
    fill: g($t, 'fill');
  }
}
</style>
