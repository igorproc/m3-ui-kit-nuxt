<template>
  <component
    :is="tag"
    class="ui-list-subheader"
    :class="{
      'ui-list-subheader--sticky': sticky,
      'ui-list-subheader--inset': inset,
    }"
  >
    <slot>{{ title }}</slot>
  </component>
</template>

<script setup lang="ts">
/**
 * A passive section label for lists.
 *
 * The label renders as text rather than a hardcoded `h2`/`h3`: the component
 * cannot infer the document outline level. Consumers who need a real heading
 * pass one through the default slot, and the slotted heading is normalized so
 * its geometry matches the text-prop rendering.
 */
import { mListSubheaderProps } from './props'

const props = defineProps(mListSubheaderProps)
const slots = useSlots()

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.title && !slots.default) console.warn('[m-list-subheader] renders without a label')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/list/subheader/index' as t;

.ui-list-subheader {
  $t: material-map(t.$tokens, 'md-list-subheader');

  display: flex;
  align-items: center;
  min-height: g($t, 'min-height');
  margin: 0;
  padding-block: g($t, 'padding-block');
  padding-inline: g($t, 'padding-inline');
  color: g($t, 'color');

  @include apply-typography(g($t, 'typography'));

  // Logical padding keeps RTL alignment correct without direction branches.
  &--inset {
    padding-inline-start: g($t, 'inset-padding-inline');
  }

  &--sticky {
    position: sticky;
    inset-block-start: 0;
    z-index: g($t, 'sticky-z');
    background-color: g($t, 'sticky-container-color');
  }

  // A slotted heading must not bring the UA's margins or type scale with it.
  :where(h1, h2, h3, h4, h5, h6, p) {
    margin: 0;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
  }
}
</style>
