<template>
  <section class="fixture-group">
    <h1>MButtonGroup — connected</h1>

    <h2>Single choice × variant</h2>
    <MButtonGroup
      v-for="variant in variants"
      :key="variant"
      v-model="periods[variant]"
      :variant="variant"
      :items="periodItems"
      :aria-label="`Period, ${variant}`"
      :data-test="`group-${variant}`"
    />

    <h2>Multiple choice</h2>
    <MButtonGroup
      v-model="filters"
      :items="filterItems"
      variant="tonal"
      multiple
      aria-label="Filters"
      data-test="group-multiple"
    />
    <output data-test="filters">{{ filters.join(',') }}</output>

    <h2>Icons only</h2>
    <MButtonGroup
      v-model="layout"
      :items="layoutItems"
      variant="outlined"
      aria-label="Layout"
      data-test="group-icons"
    />

    <h2>Density</h2>
    <MButtonGroup
      v-for="density in densities"
      :key="density"
      v-model="period"
      :density="density"
      :items="periodItems"
      :aria-label="`Period, ${density}`"
      :data-test="`group-density-${density}`"
    />

    <h2>Disabled, with a selection</h2>
    <MButtonGroup
      model-value="week"
      :items="periodItems"
      disabled
      aria-label="Period, disabled"
      data-test="group-disabled"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButtonGroup from '#kit/components/ui/button/group/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MButtonDensity } from '#kit/components/ui/button/props'
import type { MButtonGroupItem, MButtonGroupModelValue, MButtonGroupVariant } from '#kit/components/ui/button/group/props'

const variants: MButtonGroupVariant[] = ['filled', 'tonal', 'elevated', 'outlined']
const densities: MButtonDensity[] = ['compact', 'default', 'comfortable']

const periodItems: MButtonGroupItem[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month', disabled: true },
  { label: 'Year', value: 'year' },
]
const filterItems: MButtonGroupItem[] = [
  { label: 'Unread', value: 'unread', icon: ICONS.email },
  { label: 'Starred', value: 'starred', icon: ICONS.star },
  { label: 'Archived', value: 'archived', icon: ICONS.download },
]
const layoutItems: MButtonGroupItem[] = [
  { icon: ICONS.dashboard, ariaLabel: 'Grid', value: 'grid' },
  { icon: ICONS.menu, ariaLabel: 'List', value: 'list' },
  { icon: ICONS.article, ariaLabel: 'Detail', value: 'detail' },
]

const periods = reactive<Record<string, MButtonGroupModelValue>>(Object.fromEntries(variants.map(variant => [variant, 'week'])))
const filters = ref<(string | number)[]>(['starred'])
const layout = ref<MButtonGroupModelValue>('grid')
const period = ref<MButtonGroupModelValue>('day')
</script>

<style lang="scss">
.fixture-group {
  display: grid;
  justify-items: start;
  gap: 16rem;
}
</style>
