<template>
  <MTimeline
    class="crm-deal-activity"
    density="compact"
    aria-label="История сделки"
  >
    <MTimelineItem
      v-for="event in events"
      :key="event.id"
      :title="event.title"
      :text="event.text"
      :time="formatShortDate(event.at)"
      :datetime="event.at"
      :icon="event.icon"
      :color="event.color"
      :status="event.status"
    />
  </MTimeline>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatShortDate } from '../data/crmFormat'
import { useCrmStore } from '../composables/useCrmStore'

const props = defineProps<{
  dealId: string
}>()

const store = useCrmStore()
const events = computed(() => store.activityFor(props.dealId))
</script>
