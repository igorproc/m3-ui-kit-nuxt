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
            v-for="variant in iconVariants"
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
            v-for="variant in iconVariants"
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

    <h2>Icon button — density × width</h2>
    <div
      v-for="density in densities"
      :key="density"
      class="fixture-row fixture-row--spaced"
    >
      <MButtonIcon
        v-for="width in widths"
        :key="width"
        :density="density"
        :width="width"
        variant="tonal"
        :aria-label="`Favourite, ${density} ${width}`"
        :data-test="`icon-${density}-${width}`"
      >
        <MIcon :name="ICONS.star" />
      </MButtonIcon>
      <MButtonIcon
        :density="density"
        shape="square"
        variant="tonal"
        :aria-label="`Favourite, ${density} square`"
        :data-test="`icon-${density}-square`"
      >
        <MIcon :name="ICONS.star" />
      </MButtonIcon>
    </div>

    <h2>Icon button — toggle</h2>
    <table>
      <tbody>
        <tr
          v-for="shape in shapes"
          :key="shape"
        >
          <th scope="row">
            {{ shape }}
          </th>
          <td
            v-for="variant in iconVariants"
            :key="variant"
          >
            <MButtonIcon
              v-model:selected="iconToggles[`${shape}-${variant}`]"
              :variant="variant"
              :shape="shape"
              :aria-label="`Add to list, ${shape} ${variant}`"
              :data-test="`icon-toggle-${shape}-${variant}`"
            >
              <template #default="{ selected }">
                <MIcon :name="selected ? ICONS.check : ICONS.add" />
              </template>
            </MButtonIcon>
          </td>
          <td>
            <MButtonIcon
              :shape="shape"
              variant="filled"
              selected
              disabled
              :aria-label="`Add to list, ${shape} selected disabled`"
              :data-test="`icon-selected-disabled-${shape}`"
            >
              <MIcon :name="ICONS.star" />
            </MButtonIcon>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Icon button — content colour</h2>
    <div
      class="fixture-row fixture-tinted"
      data-test="icon-tint-host"
    >
      <MButtonIcon
        aria-label="Inherits"
        data-test="icon-tint-inherit"
      >
        <MIcon :name="ICONS.star" />
      </MButtonIcon>
      <MButtonIcon
        color="error"
        aria-label="Error role"
        data-test="icon-tint-role"
      >
        <MIcon :name="ICONS.star" />
      </MButtonIcon>
    </div>

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
        v-for="density in densities"
        :key="density"
        :density="density"
        :aria-label="`Compose, ${density}`"
        :data-test="`fab-density-${density}`"
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
    <div class="fixture-row">
      <MButtonExtendedFab
        v-for="density in densities"
        :key="density"
        :density="density"
        :data-test="`extended-density-${density}`"
      >
        <template #prepend>
          <MIcon :name="ICONS.edit" />
        </template>
        Compose
      </MButtonExtendedFab>
      <MButtonExtendedFab
        :expanded="extendedExpanded"
        data-test="extended-fold"
        @click="extendedExpanded = !extendedExpanded"
      >
        <template #prepend>
          <MIcon :name="ICONS.edit" />
        </template>
        Compose
      </MButtonExtendedFab>
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
        v-for="variant in splitVariants"
        :key="variant"
        :variant="variant"
        trailing-aria-label="More save options"
        :data-test="`split-${variant}`"
        @click="lastEvent = 'save'"
      >
        Save
        <template #menu="{ close }">
          <button
            v-for="option in saveOptions"
            :key="option.value"
            type="button"
            class="ui-menu__item"
            @click="lastEvent = `select:${option.value}`; close()"
          >
            {{ option.label }}
          </button>
        </template>
      </MButtonSplit>
    </div>
    <div class="fixture-row fixture-row--spaced">
      <MButtonSplit
        v-for="density in densities"
        :key="density"
        :density="density"
        trailing-aria-label="More save options"
        :data-test="`split-density-${density}`"
      >
        <template #prepend>
          <MIcon :name="ICONS.edit" />
        </template>
        Save
      </MButtonSplit>
      <MButtonSplit
        trailing-aria-label="Edit before sending"
        data-test="split-action"
        @trailing="lastEvent = 'trailing'"
      >
        Send
        <template #trailing>
          <MIcon :name="ICONS.edit" />
        </template>
      </MButtonSplit>
      <MButtonSplit
        loading
        trailing-aria-label="More save options"
        data-test="split-loading"
      >
        Save
      </MButtonSplit>
    </div>

    <output data-test="last-event">{{ lastEvent }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MButtonExtendedFab from '#kit/components/ui/button/extended-fab/index.vue'
import MButtonSegmented from '#kit/components/ui/button/segmented/index.vue'
import MButtonSplit from '#kit/components/ui/button/split/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MButtonDensity, MButtonShape, MIconButtonVariant, MIconButtonWidth } from '#kit/components/ui/button/props'
import type { MFabVariant } from '#kit/components/ui/button/fab/props'
import type { MSplitButtonVariant } from '#kit/components/ui/button/split/props'
import type { MVariant } from '#kit/shared/types/props'

const variants: MVariant[] = ['elevated', 'filled', 'tonal', 'outlined', 'text']
const iconVariants: MIconButtonVariant[] = ['filled', 'tonal', 'outlined', 'text']
const densities: MButtonDensity[] = ['compact', 'default', 'comfortable']
const widths: MIconButtonWidth[] = ['narrow', 'default', 'wide']
const shapes: MButtonShape[] = ['round', 'square']
const iconToggles = reactive<Record<string, boolean>>(Object.fromEntries(
  shapes.flatMap(shape => iconVariants.map(variant => [`${shape}-${variant}`, false])),
))
const fabVariants: MFabVariant[] = ['tonal', 'filled']
const splitVariants: MSplitButtonVariant[] = ['elevated', 'filled', 'tonal', 'outlined']
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
const extendedExpanded = ref(true)
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

  // Room above and below for the pointer-target probe.
  &--spaced {
    padding-block: 24rem;
  }
}

.fixture-tinted {
  color: var(--md-sys-color-tertiary);
}
</style>
