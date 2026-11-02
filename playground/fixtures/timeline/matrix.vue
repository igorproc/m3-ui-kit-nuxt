<template>
  <section class="fixture-timeline">
    <h1>MTimeline — matrix</h1>

    <div class="fixture-timeline__grid">
      <div
        v-for="side in sides"
        :key="side"
        class="fixture-timeline__frame"
      >
        <h2>side {{ side }}</h2>
        <MTimeline
          :side="side"
          :data-test="`side-${side}`"
        >
          <MTimelineItem
            v-for="event in events"
            :key="event.title"
            v-bind="event"
          />
        </MTimeline>
      </div>
    </div>

    <div class="fixture-timeline__grid">
      <div
        v-for="line in lines"
        :key="line"
        class="fixture-timeline__frame"
      >
        <h2>line {{ line }}</h2>
        <MTimeline
          :line="line"
          :data-test="`line-${line}`"
        >
          <MTimelineItem
            v-for="event in events"
            :key="event.title"
            v-bind="event"
          />
        </MTimeline>
      </div>
    </div>

    <div class="fixture-timeline__grid">
      <div
        v-for="density in densities"
        :key="density"
        class="fixture-timeline__frame"
      >
        <h2>density {{ density }}, no times</h2>
        <MTimeline
          :density="density"
          :data-test="`density-${density}`"
        >
          <MTimelineItem
            v-for="event in events"
            :key="event.title"
            :title="event.title"
            :text="event.text"
            :color="event.color"
            :icon="event.icon"
            :status="event.status"
          />
        </MTimeline>
      </div>
    </div>

    <div class="fixture-timeline__grid">
      <div class="fixture-timeline__frame">
        <h2>Content surfaces, a hidden dot</h2>
        <MTimeline data-test="variants">
          <MTimelineItem
            title="Filled"
            text="Content on a filled surface."
            variant="filled"
            data-test="variant-filled"
          />
          <MTimelineItem
            title="Outlined"
            text="Content on an outlined surface."
            variant="outlined"
            content-tag="article"
            data-test="variant-outlined"
          />
          <MTimelineItem
            text="A body alone on a filled surface."
            time="09:40"
            datetime="2026-07-12T09:40"
            variant="filled"
            data-test="variant-untitled"
          />
          <MTimelineItem
            title="No dot"
            text="The line runs on through its place."
            hide-dot
            data-test="no-dot"
          />
          <MTimelineItem
            title="Elevated"
            text="Content on an elevated surface."
            variant="elevated"
            data-test="variant-elevated"
          />
        </MTimeline>
      </div>

      <div class="fixture-timeline__frame">
        <h2>Every colour role</h2>
        <MTimeline data-test="roles">
          <MTimelineItem
            v-for="role in roles"
            :key="role.color"
            v-bind="role"
            :data-test="`role-${role.color}`"
          />
        </MTimeline>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import MTimeline from '#kit/components/ui/timeline/index.vue'
import MTimelineItem from '#kit/components/ui/timeline/item/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MTimelineDensity, MTimelineLine, MTimelineSide } from '#kit/components/ui/timeline/props'
import type { MColor } from '#kit/shared/types/props'
import type { MIconName } from '#kit/components/ui/icon/props'

const sides: MTimelineSide[] = ['end', 'start', 'alternate']
const lines: MTimelineLine[] = ['solid', 'dashed', 'none']
const densities: MTimelineDensity[] = ['compact', 'default', 'comfortable']

interface TimelineEvent {
  title: string
  text?: string
  time: string
  datetime: string
  color?: MColor
  icon?: MIconName
  status?: string
}

const events: TimelineEvent[] = [
  { title: 'Order placed', text: 'Paid by card', time: '09:12', datetime: '2026-10-07T09:12' },
  { title: 'Packed', text: 'Warehouse north', time: '11:40', datetime: '2026-10-07T11:40', color: 'tertiary', icon: ICONS.check, status: 'Done' },
  { title: 'Delivery failed', text: 'Nobody at the address', time: '17:05', datetime: '2026-10-07T17:05', color: 'error', icon: ICONS.error, status: 'Failed' },
  { title: 'Delivered', time: 'Next day', datetime: '2026-10-08' },
]

interface TimelineRole {
  title: string
  color: MColor
  icon?: MIconName
  status?: string
}

const roles: TimelineRole[] = [
  { title: 'Primary', color: 'primary' },
  { title: 'Secondary', color: 'secondary' },
  { title: 'Tertiary', color: 'tertiary' },
  { title: 'Error', color: 'error', icon: ICONS.error, status: 'Failed' },
  { title: 'Info', color: 'info', icon: ICONS.info, status: 'Note' },
  { title: 'Success', color: 'success', icon: ICONS.checkCircle, status: 'Done' },
  { title: 'Warning', color: 'warning', icon: ICONS.warning, status: 'Delayed' },
]
</script>

<style lang="scss">
.fixture-timeline {
  display: grid;
  gap: 16rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
  }

  &__frame {
    width: 400rem;
    max-width: 100%;
  }
}
</style>
