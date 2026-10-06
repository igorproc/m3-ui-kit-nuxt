<template>
  <section class="fixture-family">
    <h1>Button family — state matrix</h1>

    <h2>Icon button</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">
            State
          </th>
          <th
            v-for="variant in variants"
            :key="variant"
            scope="col"
          >
            {{ variant }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="state in states"
          :key="state.name"
        >
          <th scope="row">
            {{ state.name }}
          </th>
          <td
            v-for="variant in variants"
            :key="variant"
          >
            <MButtonIcon
              :variant="variant"
              v-bind="state.props"
              :aria-label="`Favourite, ${variant}`"
              :data-test="`icon-${state.name}-${variant}`"
            >
              <MIcon :name="ICONS.star" />
            </MButtonIcon>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>FAB</h2>
    <div class="fixture-row">
      <template
        v-for="state in states"
        :key="state.name"
      >
        <MButtonFab
          v-for="variant in fabVariants"
          :key="variant"
          :variant="variant"
          v-bind="state.props"
          :aria-label="`Compose, ${variant}`"
          :data-test="`fab-${state.name}-${variant}`"
        >
          <MIcon :name="ICONS.edit" />
        </MButtonFab>
      </template>
      <MButtonFab
        v-for="size in sizes"
        :key="size"
        :size="size"
        :aria-label="`Compose, ${size}`"
        :data-test="`fab-size-${size}`"
      >
        <MIcon :name="ICONS.edit" />
      </MButtonFab>
    </div>

    <h2>Extended FAB</h2>
    <div class="fixture-row">
      <template
        v-for="state in states"
        :key="state.name"
      >
        <MButtonExtendedFab
          v-for="variant in fabVariants"
          :key="variant"
          :variant="variant"
          v-bind="state.props"
          :data-test="`extended-${state.name}-${variant}`"
        >
          <template #prepend>
            <MIcon :name="ICONS.edit" />
          </template>
          Compose
        </MButtonExtendedFab>
      </template>
    </div>

    <h2>Segmented — single choice</h2>
    <MButtonSegmented
      v-model="period"
      :items="periods"
      aria-label="Period"
      data-test="segmented-single"
    />

    <h2>Segmented — multiple choice</h2>
    <MButtonSegmented
      v-model="filters"
      :items="filterItems"
      multiple
      aria-label="Filters"
      data-test="segmented-multiple"
    />

    <h2>Segmented — disabled, with a selection</h2>
    <MButtonSegmented
      :model-value="'week'"
      :items="periods"
      disabled
      aria-label="Period, disabled"
      data-test="segmented-disabled"
    />

    <h2>Segmented — icons only</h2>
    <MButtonSegmented
      v-model="layout"
      :items="layouts"
      aria-label="Layout"
      data-test="segmented-icons"
    />

    <h2>Split</h2>
    <div class="fixture-row">
      <MButtonSplit
        v-for="variant in variants"
        :key="variant"
        :variant="variant"
        :items="saveOptions"
        dropdown-aria-label="More save options"
        :data-test="`split-${variant}`"
        @click="lastEvent = 'save'"
        @select="item => lastEvent = `select:${item.value}`"
      >
        Save
      </MButtonSplit>
    </div>

    <output data-test="last-event">{{ lastEvent }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MButtonExtendedFab from '#kit/components/ui/button/extended-fab/index.vue'
import MButtonSegmented from '#kit/components/ui/button/segmented/index.vue'
import MButtonSplit from '#kit/components/ui/button/split/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MSize, MVariant } from '#kit/shared/types/props'

const variants: MVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text']
const fabVariants: MVariant[] = ['filled', 'tonal']
const sizes: MSize[] = ['sm', 'md', 'lg']
const states = [
  { name: 'enabled', props: {} },
  { name: 'disabled', props: { disabled: true } },
  { name: 'loading', props: { loading: true } },
]

const periods = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
  { label: 'Year', value: 'year' },
]
const filterItems = [
  { label: 'Unread', value: 'unread' },
  { label: 'Starred', value: 'starred' },
  { label: 'Archived', value: 'archived' },
]
const layouts = [
  { icon: ICONS.dashboard, ariaLabel: 'Grid', value: 'grid' },
  { icon: ICONS.menu, ariaLabel: 'List', value: 'list' },
]
const saveOptions = [
  { label: 'Save as draft', value: 'draft' },
  { label: 'Save and publish', value: 'publish' },
]

const period = ref('week')
const filters = ref<(string | number)[]>(['starred'])
const layout = ref('grid')
const lastEvent = ref('')
</script>

<style lang="scss">
.fixture-family {
  display: grid;
  gap: 16rem;
  justify-items: start;

  table {
    border-spacing: 12rem;
  }
}

.fixture-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rem;
}
</style>
