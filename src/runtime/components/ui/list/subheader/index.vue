<template>
  <component
    :is="resolvedTag"
    class="ui-list-subheader"
    :class="{
      'ui-list-subheader--sticky': sticky,
      'ui-list-subheader--inset': inset,
      [`ui-list-subheader--${list.surface.value}`]: sticky,
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
import { computed, useSlots, watchEffect } from 'vue'
import { mListSubheaderProps } from './props'
import { useListContext } from '../context'

const props = defineProps(mListSubheaderProps)
const slots = useSlots()
const list = useListContext()

// A direct child of a `ul` has to be an `li`. It carries no role: axe's `list`
// rule rejects any other role on a list's child, so the label is read in order
// as one more item.
const resolvedTag = computed(() => props.tag ?? (list.semantic.value ? 'li' : 'div'))

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.title && !slots.default) console.warn('[m-list-subheader] renders without a label')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/list/subheader/index' as t;

.ui-list-subheader {
  $t: t.$tokens;

  display: flex;
  align-items: center;
  min-height: g($t, 'min.height');
  margin: 0;
  padding-block: g($t, 'padding.block');
  padding-inline: g($t, 'padding.inline');
  color: g($t, 'color');

  @include apply-typography(g($t, 'typography'));

  // Logical padding keeps RTL alignment correct without direction branches.
  &--inset {
    padding-inline-start: g($t, 'inset.padding.inline');
  }

  // The local z-index stays inside the list's isolated root (craft.md §12).
  &--sticky {
    position: sticky;
    inset-block-start: 0;
    z-index: g($t, 'sticky.z');
  }

  // Rows scroll under the label, so it is filled with the surface the list
  // declared it sits on.
  @each $surface, $color in g($t, 'sticky.container.color') {
    &--sticky.ui-list-subheader--#{$surface} {
      background-color: $color;
    }
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
