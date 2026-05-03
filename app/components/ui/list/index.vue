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
@use '~/assets/stylesheet/components/list' as v;

.ui-list {
  display: flex;
  flex-direction: column;
  padding-block: v.$padding-block;
  padding-inline: v.$padding-inline;
  border-radius: v.$border-radius;
  background-color: v.$bg-color;
}
</style>
