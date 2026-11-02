<template>
  <div
    class="ui-navigation-rail__content"
    :class="{ 'ui-navigation-rail__content--expanded': expanded }"
  >
    <div
      v-if="$slots.header"
      class="ui-navigation-rail__header"
    >
      <slot name="header" />
    </div>

    <div
      :id="listId"
      class="ui-navigation-rail__list"
    >
      <NavigationItem
        v-for="item in items"
        :key="item.id"
        class="ui-navigation-rail__item"
        host="rail"
        :placement="expanded ? 'start' : 'top'"
        :label="item.label"
        :icon="item.icon"
        :active-icon="item.activeIcon"
        :badge="item.badge"
        :badge-label="item.badgeLabel"
        :disabled="item.disabled"
        :active="item.id === selectedValue"
        :fade-label="fadeLabel"
        @select="emit('select', item.id, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Private body of `<MNavigationRail>`: the header and the scrolling list of
 * destinations. The rail draws it in the grid and, in its off-grid modes,
 * once more inside the modal surface.
 */
import NavigationItem from '#kit/components/fragments/navigation-item/index.vue'
import type { NavigationDestination } from '#kit/components/fragments/navigation-item/types'

defineProps<{
  items: readonly NavigationDestination[]
  selectedValue: string | null
  expanded: boolean
  listId?: string
  fadeLabel?: boolean
}>()

const emit = defineEmits<{
  (event: 'select', id: string, nativeEvent: MouseEvent): void
}>()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-rail/index' as t;

.ui-navigation-rail__content {
  $t: material-map(t.$tokens, 'md-navigation-rail');

  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  padding-block: g($t, 'container.padding.block');
  gap: g($t, 'header.gap');

  .ui-navigation-rail__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: g($t, 'header.items.gap');
  }

  .ui-navigation-rail__list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: g($t, 'list.gap');
    min-height: 0;
    margin-block: g($t, 'list.ring.margin');
    padding-block: g($t, 'list.ring.padding');
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &--expanded {
    // stylelint-disable-next-line selector-class-pattern -- the element of the rail block under the content's modifier
    .ui-navigation-rail__header {
      align-items: flex-start;
      padding-inline: g($t, 'item.padding.inline');
    }

    // stylelint-disable-next-line selector-class-pattern -- as above
    .ui-navigation-rail__list {
      align-items: flex-start;
      gap: g($t, 'list.expanded.gap');
      padding-inline: g($t, 'item.padding.inline');
    }
  }
}
</style>
