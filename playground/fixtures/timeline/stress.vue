<template>
  <section class="fixture-timeline-stress">
    <h1>MTimeline — stress content</h1>

    <h2>Alternate in a narrow column</h2>
    <div
      class="fixture-timeline-stress__narrow"
      data-test="narrow"
    >
      <MTimeline
        side="alternate"
        data-test="narrow-alternate"
      >
        <MTimelineItem
          v-for="index in 4"
          :key="index"
          :title="`Event ${index}`"
          :text="index === 2 ? longWord : 'A short note about what happened.'"
          :time="`0${index}:00`"
          :datetime="`2026-10-07T0${index}:00`"
        />
      </MTimeline>
    </div>

    <h2>Alternate with room</h2>
    <MTimeline
      side="alternate"
      class="fixture-timeline-stress__wide"
      data-test="wide-alternate"
    >
      <MTimelineItem
        v-for="index in 3"
        :key="index"
        :title="`Event ${index}`"
        :time="`0${index}:00`"
        :datetime="`2026-10-07T0${index}:00`"
      />
    </MTimeline>

    <h2>Long unbroken values</h2>
    <MTimeline data-test="long">
      <MTimelineItem
        :title="longWord"
        :text="longWord"
        :time="longWord"
        datetime="2026-10-07"
        data-test="long-item"
      />
      <MTimelineItem
        title="After"
        text="Short"
      />
    </MTimeline>

    <h2>Some items with a time</h2>
    <MTimeline data-test="mixed-time">
      <MTimelineItem
        title="With a time"
        time="10:00"
        datetime="2026-10-07T10:00"
      />
      <MTimelineItem title="Without one" />
    </MTimeline>

    <h2>A side override keeps both columns</h2>
    <MTimeline data-test="override">
      <MTimelineItem title="End" />
      <MTimelineItem
        title="Start"
        side="start"
      />
    </MTimeline>

    <h2>Many events</h2>
    <MTimeline
      density="compact"
      data-test="many"
    >
      <MTimelineItem
        v-for="index in 30"
        :key="index"
        :title="`Event ${index}`"
        :color="index % 7 === 0 ? 'error' : 'primary'"
      />
    </MTimeline>

    <h2>Without a title</h2>
    <MTimeline data-test="no-title">
      <MTimelineItem
        title="With a title"
        text="The dot sits on the title line."
        data-test="no-title-titled"
      />
      <MTimelineItem
        text="Only body text, no title."
        data-test="no-title-text"
      />
      <MTimelineItem
        text="Body text with a time."
        time="10:00"
        datetime="2026-10-07T10:00"
        data-test="no-title-time"
      />
    </MTimeline>

    <h2>Insert into an alternate timeline</h2>
    <button
      type="button"
      data-test="insert-second"
      @click="insertSecond"
    >
      Insert second
    </button>
    <MTimeline
      side="alternate"
      class="fixture-timeline-stress__wide"
      data-test="insert-alternate"
    >
      <MTimelineItem
        v-for="index in inserted"
        :key="index"
        :title="`Event ${index}`"
        :time="`0${index}:00`"
        :datetime="`2026-10-07T0${index}:00`"
        :data-test="`insert-${index}`"
      />
    </MTimeline>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MTimeline from '#kit/components/ui/timeline/index.vue'
import MTimelineItem from '#kit/components/ui/timeline/item/index.vue'

const longWord = 'WH-NORTH-0000-1111-2222-3333-4444-5555-6666-7777-8888-9999-AAAA-BBBB'

const inserted = reactive([1, 2, 3])
const insertSecond = () => inserted.splice(1, 0, Math.max(...inserted) + 1)
</script>

<style lang="scss">
.fixture-timeline-stress {
  display: grid;

  // A fixed-width child must not size the page's one column.
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  &__narrow {
    width: 360rem;
    max-width: 100%;
    outline: 1px dashed var(--md-sys-color-outline);
  }

  // Wider than the collapse threshold at a desktop width, so alternate holds.
  &__wide {
    width: 1000px;
    max-width: 100%;
  }
}
</style>
