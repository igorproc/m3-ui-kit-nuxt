<template>
  <component
    :is="semantic ? 'ul' : 'div'"
    class="ui-list"
  >
    <template v-if="items">
      <template
        v-for="(item, index) in items"
        :key="item.id"
      >
        <slot
          :item="item"
          :index="index"
        />
      </template>

      <component
        :is="semantic ? 'li' : 'div'"
        v-if="!items.length && $slots.empty"
        class="ui-list__empty"
      >
        <slot name="empty" />
      </component>
    </template>

    <slot v-else />
  </component>
</template>

<script setup lang="ts" generic="T extends { id: string | number }">
import { computed, toRef, useAttrs } from 'vue'
import { provideListContext } from './context'
import type { MListProps } from './types'

const props = withDefaults(defineProps<MListProps<T>>(), { density: 'default', surface: 'surface' })
defineSlots<{
  /** Called once per item when `items` is passed; holds the rows themselves otherwise. */
  default?: (props: { item: T, index: number } | Record<string, never>) => unknown
  /** Rendered when `items` is passed and empty. */
  empty?: () => unknown
}>()
const attrs = useAttrs()

// A list is a `ul` unless the consumer gave it a role: a listbox owns options,
// not list items, and its rows keep the attributes the listbox gives them.
const semantic = computed(() => attrs.role === undefined)

provideListContext({
  density: toRef(() => props.density),
  present: true,
  semantic,
  surface: toRef(() => props.surface),
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/list/index' as t;

.ui-list {
  $t: t.$tokens;

  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  margin: 0;
  padding-block: g($t, 'container.padding.block');
  padding-inline: g($t, 'container.padding.inline');
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');
  list-style: none;

  // Keeps the sticky subheader's local z-index inside the list (craft.md §12).
  isolation: isolate;

  // Tab must not park a row under a sticky subheader.
  &:has(> .ui-list-subheader--sticky) .ui-list-item {
    scroll-margin-block-start: g($t, 'sticky.scroll-margin');
  }
}
</style>
