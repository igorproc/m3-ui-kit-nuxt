<template>
  <span class="ui-icon">
    <icon
      :name="resolvedName"
      aria-hidden="true"
    />
  </span>
</template>

<script setup lang="ts">
interface Props {
  name: string
}

const props = defineProps<Props>()

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
.ui-icon {
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
    fill: currentcolor;
  }
}
</style>
