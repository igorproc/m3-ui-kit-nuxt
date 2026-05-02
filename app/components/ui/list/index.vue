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
interface Props {
  items?: T[]
}

defineProps<Props>()
</script>

<style lang="scss">
.ui-list {
  display: flex;
  flex-direction: column;
  padding-block: 8rem;
  padding-inline: 0;
  border-radius: var(--sys-shape-corner-medium);
  background-color: var(--color-surface);
}
</style>
