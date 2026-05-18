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
@use 'sass:map';
@use '~/assets/stylesheet/components/list/index' as t;

.ui-list {
  $prefix: 'md-list';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  padding-block: g($t, 'container-padding-block');
  padding-inline: g($t, 'container-padding-inline');
  border-radius: g($t, 'container-shape');
  background-color: g($t, 'container-color');
}
</style>
