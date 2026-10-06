<template>
  <div class="ui-list">
    <template v-if="items?.length">
      <slot
        v-for="(item, index) in items"
        :key="item.id"
        :item="item"
        :index="index"
      />
    </template>

    <slot v-else />
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string | number }">
import { toRef } from 'vue'
import { provideListContext } from './context'
import type { MListItemDensity } from './item/props'

export interface Props {
  items?: T[]
  /** Vertical scale inherited by every row that does not set its own. */
  density?: MListItemDensity
}

const props = withDefaults(defineProps<Props>(), { density: 'default' })

provideListContext({ density: toRef(() => props.density) })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/list/index' as t;

.ui-list {
  $t: t.$tokens;

  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  padding-block: g($t, 'container.padding.block');
  padding-inline: g($t, 'container.padding.inline');
  border-radius: g($t, 'container.shape');
  background-color: g($t, 'container.color');
}
</style>
