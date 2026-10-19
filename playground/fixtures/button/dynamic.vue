<template>
  <section class="fixture-dynamic">
    <h1>Button family — state changes on the fly</h1>

    <div class="fixture-dynamic__controls">
      <button
        type="button"
        data-test="toggle-loading"
        @click="loading = !loading"
      >
        Toggle loading
      </button>
      <button
        type="button"
        data-test="cycle-density"
        @click="density = densities[(densities.indexOf(density) + 1) % densities.length]!"
      >
        Next density
      </button>
      <button
        type="button"
        data-test="cycle-variant"
        @click="variant = variants[(variants.indexOf(variant) + 1) % variants.length]!"
      >
        Next variant
      </button>
      <output data-test="state">{{ loading }} {{ density }} {{ variant }}</output>
    </div>

    <div class="fixture-dynamic__row">
      <MButton
        :loading="loading"
        :density="density"
        :variant="variant"
        data-test="button"
      >
        Save changes
      </MButton>
      <MButton
        :loading="loading"
        :density="density"
        :variant="variant"
        data-test="button-icon"
      >
        <template #prepend>
          <MIcon :name="ICONS.add" />
        </template>
        Add item
      </MButton>
      <span data-test="neighbour">Neighbour</span>
    </div>

    <div class="fixture-dynamic__row">
      <MButtonSplit
        :loading="loading"
        :density="density"
        trailing-aria-label="More save options"
        data-test="split"
      >
        Save
        <template #menu="{ close }">
          <button
            type="button"
            class="ui-menu__item"
            @click="close()"
          >
            Save as draft
          </button>
        </template>
      </MButtonSplit>
      <MButtonFab
        :loading="loading"
        :density="density"
        aria-label="Compose"
        data-test="fab"
      >
        <MIcon :name="ICONS.edit" />
      </MButtonFab>
      <MButtonExtendedFab
        :loading="loading"
        :density="density"
        data-test="extended"
      >
        <template #prepend>
          <MIcon :name="ICONS.edit" />
        </template>
        Compose
      </MButtonExtendedFab>
    </div>

    <form
      class="fixture-dynamic__row"
      data-test="form"
      @submit.prevent="submits++"
    >
      <MButtonSplit
        trailing-aria-label="More send options"
        data-test="split-in-form"
      >
        Send
      </MButtonSplit>
      <MButtonGroup
        v-model="period"
        :items="periods"
        aria-label="Period in a form"
        data-test="group-in-form"
      />
      <MButtonSegmented
        v-model="period"
        :items="periods"
        aria-label="Period in a form, segmented"
        data-test="segmented-in-form"
      />
      <output data-test="submits">{{ submits }}</output>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MButtonSplit from '#kit/components/ui/button/split/index.vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MButtonExtendedFab from '#kit/components/ui/button/extended-fab/index.vue'
import MButtonGroup from '#kit/components/ui/button/group/index.vue'
import MButtonSegmented from '#kit/components/ui/button/segmented/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import type { MButtonDensity } from '#kit/components/ui/button/props'
import type { MButtonGroupModelValue } from '#kit/components/ui/button/group/props'
import type { MVariant } from '#kit/shared/types/props'

const densities: MButtonDensity[] = ['compact', 'default', 'comfortable']
const variants: Array<Extract<MVariant, 'filled' | 'tonal' | 'outlined' | 'elevated'>> = ['filled', 'tonal', 'outlined', 'elevated']

const loading = ref(false)
const density = ref<MButtonDensity>('default')
const variant = ref<typeof variants[number]>('filled')
const submits = ref(0)

const periods = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
]
const period = ref<MButtonGroupModelValue>('day')
</script>

<style lang="scss">
.fixture-dynamic {
  display: grid;
  gap: 24rem;
  justify-items: start;

  &__controls,
  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12rem;
  }
}
</style>
