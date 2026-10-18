<template>
  <!-- A first-level zone of MLayout: the layout hides start zones in the
       compact range, where the modal drawer takes over. -->
  <MNavigationRail
    :model-value="section"
    :items="items"
    :expanded="expanded"
    aria-label="Разделы CRM"
    @update:model-value="onSelect"
  />
</template>

<script setup lang="ts">
import type { MNavigationRailItem } from '#kit/components/ui/navigation-rail/props'
import { isCrmSection } from '../data/crmTypes'
import type { CrmSection } from '../data/crmTypes'

defineProps<{
  section: CrmSection
  items: MNavigationRailItem[]
  /** Expanded window: the rail shows its labels beside the icons. */
  expanded: boolean
}>()

const emit = defineEmits<{
  (event: 'select', section: CrmSection): void
}>()

function onSelect(value: string | null) {
  if (isCrmSection(value)) emit('select', value)
}
</script>
