<template>
  <section class="fixture-list">
    <h1>MList — matrix</h1>

    <h2>Lines × leading</h2>
    <MList
      class="fixture-list__panel"
      data-test="list-content"
    >
      <template
        v-for="lines in lineCounts"
        :key="lines"
      >
        <MListItem
          v-for="leading in leadings"
          :key="`${lines}-${leading}`"
          :headline="`${leading}, ${lines} line${lines > 1 ? 's' : ''}`"
          :overline="lines === 3 ? 'Overline' : ''"
          :supporting-text="lines > 1 ? 'Supporting text' : ''"
          :data-test="`content-${lines}-${leading}`"
        >
          <template #leading>
            <MIcon
              v-if="leading === 'icon'"
              :name="ICONS.person"
            />
            <MAvatar
              v-else-if="leading === 'avatar'"
              name="Ada Lovelace"
            />
            <img
              v-else-if="leading === 'image'"
              :src="thumbnail"
              alt=""
            >
            <video
              v-else
              :poster="thumbnail"
              muted
              aria-hidden="true"
            />
          </template>
        </MListItem>
      </template>
    </MList>

    <h2>Trailing</h2>
    <MList
      class="fixture-list__panel"
      data-test="list-trailing"
    >
      <MListItem
        headline="Trailing icon"
        :trailing-icon="ICONS.chevronRight"
      />
      <MListItem
        headline="Trailing text"
        trailing-supporting-text="100+"
      />
      <MListItem headline="Trailing checkbox">
        <template #trailing>
          <MCheckbox
            v-model="checked"
            aria-label="Trailing checkbox"
          />
        </template>
      </MListItem>
      <MListItem headline="Trailing switch">
        <template #trailing>
          <MSwitch
            v-model="switched"
            aria-label="Trailing switch"
          />
        </template>
      </MListItem>
    </MList>

    <h2>Element × state</h2>
    <div class="fixture-list__grid">
      <MList
        v-for="element in elements"
        :key="element.name"
        class="fixture-list__panel"
        :data-test="`list-${element.name}`"
      >
        <MListSubheader :title="element.name" />
        <MListItem
          v-for="state in states"
          :key="state.name"
          v-bind="element.props"
          :href="element.name === 'link' ? `#${element.name}-${state.name}` : undefined"
          :headline="`${element.name} ${state.name}`"
          supporting-text="Supporting text"
          :leading-icon="ICONS.email"
          :selected="element.name === 'static' ? undefined : state.selected"
          :disabled="state.disabled"
          :data-test="`${element.name}-${state.name}`"
        />
      </MList>
    </div>

    <h2>Density</h2>
    <div class="fixture-list__grid">
      <MList
        v-for="density in densities"
        :key="density"
        class="fixture-list__panel"
        :density="density"
        :data-test="`list-density-${density}`"
      >
        <MListItem
          :headline="`${density}, one line`"
          :leading-icon="ICONS.star"
          :data-test="`density-${density}-1`"
        />
        <MListItem
          :headline="`${density}, two lines`"
          supporting-text="Supporting text"
          :leading-icon="ICONS.star"
          :data-test="`density-${density}-2`"
        />
      </MList>
    </div>

    <h2>Subheaders and dividers</h2>
    <MList
      class="fixture-list__panel"
      data-test="list-sections"
    >
      <MListSubheader title="Today" />
      <MListItem
        headline="Inbox"
        :leading-icon="ICONS.email"
        data-test="sections-row"
      />
      <MDivider inset="center" />
      <MListItem
        headline="Starred"
        :leading-icon="ICONS.star"
      />
      <MDivider />
      <MListSubheader
        inset
        data-test="sections-inset"
      >
        <h3>Earlier</h3>
      </MListSubheader>
      <MListItem
        headline="Archive"
        :leading-icon="ICONS.history"
      />
    </MList>

    <h2>Explicit lines</h2>
    <MList
      class="fixture-list__panel"
      data-test="list-clamped"
    >
      <MListItem
        v-for="lines in lineCounts"
        :key="lines"
        :lines="lines"
        :headline="`Clamped to ${lines}: ${longText}`"
        :supporting-text="lines > 1 ? longText : ''"
        :data-test="`clamped-${lines}`"
      />
      <MListItem
        :headline="`Auto: ${longText}`"
        :supporting-text="longText"
        data-test="clamped-auto"
      />
    </MList>

    <button
      type="button"
      data-test="after"
    >
      After
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MAvatar from '#kit/components/ui/avatar/index.vue'
import MCheckbox from '#kit/components/ui/checkbox/index.vue'
import MDivider from '#kit/components/ui/divider/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MList from '#kit/components/ui/list/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'
import MListSubheader from '#kit/components/ui/list/subheader/index.vue'
import MSwitch from '#kit/components/ui/switch/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MListItemDensity, MListItemLines } from '#kit/components/ui/list/item/props'

const lineCounts: Exclude<MListItemLines, 'auto'>[] = [1, 2, 3]
const leadings = ['icon', 'avatar', 'image', 'video'] as const
const densities: MListItemDensity[] = ['compact', 'default', 'comfortable']

const elements = [
  { name: 'static', props: {} },
  { name: 'button', props: { tag: 'button' } },
  { name: 'emulated', props: { interactive: true } },
  { name: 'link', props: { tag: 'a' } },
] as const

const states = [
  { name: 'rest', selected: false, disabled: false },
  { name: 'selected', selected: true, disabled: false },
  { name: 'disabled', selected: false, disabled: true },
  { name: 'selected-disabled', selected: true, disabled: true },
] as const

const longText = 'A headline long enough to need more than one line in a narrow panel'

const thumbnail = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#7d5260"/></svg>')}`

const checked = ref(true)
const switched = ref(false)
</script>

<style lang="scss">
.fixture-list {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
  }

  &__panel {
    width: 360rem;
    max-width: 100%;
  }
}
</style>
