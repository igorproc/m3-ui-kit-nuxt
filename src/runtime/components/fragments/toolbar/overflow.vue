<template>
  <span class="ui-toolbar__overflow">
    <MMenu
      v-model="open"
      :placement="placement"
      @click-outside="open = false"
    >
      <template #activator="{ props: menuTrigger }">
        <MButtonIcon
          v-bind="menuTrigger"
          :aria-label="label"
        >
          <MIcon name="round-more-vert" />
        </MButtonIcon>
      </template>

      <MMenuItem
        v-for="item in items"
        :key="item.id"
        class="ui-toolbar__menu-item"
        :role="roleOf(item)"
        :selected="isSelected(item)"
        :disabled="item.disabled"
        :leading-icon="item.icon"
        :label="item.label ?? item.ariaLabel"
        @select="choose(item)"
      />
    </MMenu>
  </span>
</template>

<script setup lang="ts">
/**
 * Private "more" menu of `<MToolbar>`: the items past `maxVisible`, as menu
 * items. A toggle in the bar (`aria-pressed`) is a checkable item here, so its
 * state still reads without colour.
 */
import { ref } from 'vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MMenuItem from '#kit/components/ui/menu/item/index.vue'
import type { MMenuPlacement } from '#kit/components/ui/menu/types'
import type { MToolbarItem } from '#kit/components/ui/toolbar/props'
import type { ToolbarMenuRole } from './types'

defineProps<{
  items: MToolbarItem[]
  label?: string
  placement: MMenuPlacement
  roleOf: (item: MToolbarItem) => ToolbarMenuRole
  isSelected: (item: MToolbarItem) => boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: MToolbarItem): void
}>()

const open = ref(false)

function choose(item: MToolbarItem) {
  emit('select', item)
  open.value = false
}
</script>

<style lang="scss">
.ui-toolbar__overflow {
  display: inline-flex;
}
</style>
