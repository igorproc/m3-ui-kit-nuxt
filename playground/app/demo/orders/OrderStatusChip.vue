<template>
  <MChip
    type="assist"
    :aria-label="`${meta.label} — показать только этот статус`"
    @click="emit('filter', status)"
  >
    <!--
      The kit has no passive status tag (MChip is always a button, MBadge is a
      live region), so the status chip earns its button: it narrows the list.
    -->
    <template #icon>
      <MIcon :name="meta.icon" />
    </template>
    {{ meta.label }}
  </MChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_META } from './data/model'
import type { OrderStatus } from './data/model'

const props = defineProps<{
  status: OrderStatus
}>()

const emit = defineEmits<{
  (event: 'filter', status: OrderStatus): void
}>()

const meta = computed(() => STATUS_META[props.status])
</script>
