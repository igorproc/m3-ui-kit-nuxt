<template>
  <div
    class="ui-responsive"
    :style="styles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
// Обёртка с фиксированными пропорциями (аналог v-responsive):
// нативный CSS aspect-ratio, контент обрезается по контейнеру
interface Props {
  /** Например 16/9, "4/3" или "1" */
  aspectRatio?: number | string
}

const props = defineProps<Props>()

const styles = computed(() =>
  props.aspectRatio != null ? { aspectRatio: String(props.aspectRatio) } : {},
)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/responsive/index' as t;

.ui-responsive {
  $t: material-map(t.$tokens, 'md-responsive');

  position: relative;
  width: 100%;
  min-block-size: 0;
  overflow: clip;
  overflow-clip-margin: g($t, 'clip.margin');
}
</style>
