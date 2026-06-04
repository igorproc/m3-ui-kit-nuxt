<template>
  <div class="ui-dropdown__chips">
    <!-- Whole-area override; defaults to a chip per selected item. -->
    <slot
      name="selected"
      :items="ctx.selectedItems.value"
      :remove="ctx.remove"
    >
      <template
        v-for="(item, index) in ctx.selectedItems.value"
        :key="keyOf(item, index)"
      >
        <!-- Per-item wrapper; falls back to an input chip with a remove affordance. -->
        <slot
          name="chip"
          :item="item"
          :index="index"
          :remove="() => ctx.remove(item)"
        >
          <m-chip
            variant="input"
            class="ui-dropdown__chip"
            @click.stop
          >
            {{ labelOf(item) }}
            <template #trailing>
              <m-icon
                :name="ICONS.close"
                @click.stop="ctx.remove(item)"
              />
            </template>
          </m-chip>
        </slot>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'
import { useDropdownContext } from '../context'
import type { DropdownEntry, DropdownItem, DropdownOption } from '../types'
import MChip from '~/components/ui/chip/index.vue'
import MIcon from '~/components/ui/icon/index.vue'

const ctx = useDropdownContext()

const labelOf = (item: DropdownEntry): string => (item as DropdownItem).label ?? ''

const keyOf = (item: DropdownEntry, index: number): string | number => {
  const entry = item as DropdownOption & DropdownItem
  return (entry.value as string | number | undefined) ?? entry.id ?? index
}
</script>
