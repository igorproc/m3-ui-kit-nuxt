<template>
  <MChip
    v-for="(entry, index) in entries"
    :id="chipId(index)"
    :key="entry.key"
    type="input"
    tabindex="-1"
    :class="[`${block}__chip`, { [`${block}__chip--active`]: focus === index }]"
    :disabled="disabled || entry.itemDisabled"
    :removal="readonly ? 'none' : 'whole'"
    :remove-label="removeLabel?.replace('{title}', entry.title)"
    @mousedown.prevent
    @click.stop
    @remove="emit('remove', entry)"
  >
    <slot
      :item="entry.item"
      :value="entry.value"
      :title="entry.title"
      :index="index"
      :remove="() => emit('remove', entry)"
    >
      {{ entry.title }}
    </slot>
  </MChip>
</template>

<script setup lang="ts" generic="TEntry extends DropdownResolvedItem<unknown, unknown>">
/**
 * The chips of a multiple selection inside the field. They are not tab stops:
 * the keyboard reaches them from the input with the arrows, as the virtual
 * focus of the combobox (`aria-activedescendant`), never with Tab.
 *
 * Each chip is one button that removes its value (`removal="whole"`), named
 * by the app's phrase. Read-only chips show the value in full ink and offer
 * no removal.
 */
import type { DropdownResolvedItem } from '#kit/composables/dropdown/types'
import MChip from '#kit/components/ui/chip/index.vue'

defineProps<{
  entries: TEntry[]
  /** BEM block of the owning field, `ui-dropdown` or `ui-autocomplete`. */
  block: string
  chipId: (index: number) => string
  /** Index of the chip under the keyboard. */
  focus: number | null
  disabled: boolean
  readonly: boolean
  /** Name of a chip's removal; `{title}` is replaced with the value's title. */
  removeLabel?: string
}>()

const emit = defineEmits<{
  (event: 'remove', entry: TEntry): void
}>()
</script>
