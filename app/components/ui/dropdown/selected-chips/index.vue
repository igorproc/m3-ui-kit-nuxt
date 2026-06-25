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
            type="input"
            class="ui-dropdown__chip"
            @click.stop
          >
            {{ labelOf(item) }}
            <template #trailing>
              <button
                type="button"
                class="ui-dropdown__remove"
                :aria-label="removeLabel(item)"
                @click.stop="ctx.remove(item)"
                @keydown.enter.stop
                @keydown.space.stop
              >
                <m-icon :name="ICONS.close" />
              </button>
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

const removeLabel = (item: DropdownEntry): string => {
  const label = labelOf(item)
  return label ? `Remove ${label}` : 'Remove'
}

const keyOf = (item: DropdownEntry, index: number): string | number => {
  const entry = item as DropdownOption & DropdownItem
  return (entry.value as string | number | undefined) ?? entry.id ?? index
}
</script>

<style lang="scss">
@use 'sass:map';

.ui-dropdown__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: map.get($theme-shape-link, full);
  outline: none;

  &:focus-visible {
    outline: 2rem solid map.get($theme-color-link, secondary);
    outline-offset: 2rem;
  }
}
</style>
