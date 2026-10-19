<template>
  <section class="fixture-family">
    <h1>Field family — adornments beside an overlaid label</h1>

    <h2>Text field: prepend and append</h2>
    <div
      v-for="placement in overlayPlacements"
      :key="placement"
      class="fixture-family__row"
    >
      <MTextField
        v-for="variant in textVariants"
        :key="variant"
        v-model="text[`${variant}-${placement}`]"
        :variant="variant"
        :label-placement="placement"
        :label="`Icons ${variant} ${placement}`"
        :data-test="`tf-icons-${variant}-${placement}`"
      >
        <template #prepend>
          <MIcon name="search" />
        </template>
        <template #append>
          <MIcon name="info" />
        </template>
      </MTextField>
    </div>

    <h2>Text field: a long label between two icons, narrow</h2>
    <div class="fixture-family__narrow">
      <MTextField
        v-for="variant in textVariants"
        :key="variant"
        v-model="text[`${variant}-long`]"
        :variant="variant"
        label="Billing address as it appears on the statement of your card"
        :data-test="`tf-long-${variant}`"
      >
        <template #prepend>
          <MIcon name="search" />
        </template>
        <template #append>
          <MIcon name="info" />
        </template>
      </MTextField>
    </div>

    <h2>Textarea: prepend and append</h2>
    <div class="fixture-family__row">
      <MTextarea
        v-for="item in areaCases"
        :key="item.key"
        v-model="area[item.key]"
        :variant="item.variant"
        :label-placement="item.placement"
        :rows="2"
        :label="`Icons ${item.key}`"
        :data-test="`ta-icons-${item.key}`"
      >
        <template #prepend>
          <MIcon name="search" />
        </template>
        <template #append>
          <MIcon name="info" />
        </template>
      </MTextarea>
      <MTextarea
        v-model="area['readonly-resizable']"
        readonly
        resizable
        resize-label="Resize notes"
        :rows="2"
        label="Read-only resizable"
        data-test="ta-readonly-resizable"
      />
    </div>

    <h2>Number input: prepend, and the zones under an inset label</h2>
    <div class="fixture-family__row">
      <MNumberInput
        v-for="item in numberCases"
        :key="item.key"
        :model-value="42"
        :variant="item.variant"
        :controls="item.controls"
        :label-placement="item.placement"
        :label="`Number ${item.key}`"
        :data-test="`ni-${item.key}`"
      >
        <template
          v-if="item.prepend"
          #prepend
        >
          <MIcon name="search" />
        </template>
      </MNumberInput>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MNumberInput from '#kit/components/ui/number-input/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import MTextarea from '#kit/components/ui/textarea/index.vue'
import type { MNumberInputControls, MNumberInputVariant } from '#kit/components/ui/number-input/props'
import type { MFieldLabelPlacement, MTextFieldVariant } from '#kit/components/ui/text-field/props'
import type { MTextareaVariant } from '#kit/components/ui/textarea/props'

const textVariants: MTextFieldVariant[] = ['filled', 'outlined', 'underline']
const overlayPlacements: MFieldLabelPlacement[] = ['float', 'inset']

const areaCases: { key: string, variant: MTextareaVariant, placement: MFieldLabelPlacement }[] = [
  { key: 'filled-top', variant: 'filled', placement: 'top' },
  { key: 'filled-float', variant: 'filled', placement: 'float' },
  { key: 'outlined-float', variant: 'outlined', placement: 'float' },
  { key: 'outlined-inset', variant: 'outlined', placement: 'inset' },
]

const numberCases: { key: string, variant: MNumberInputVariant, controls: MNumberInputControls, placement: MFieldLabelPlacement, prepend: boolean }[] = [
  { key: 'prepend-filled-none', variant: 'filled', controls: false, placement: 'float', prepend: true },
  { key: 'prepend-outlined-none', variant: 'outlined', controls: false, placement: 'float', prepend: true },
  { key: 'prepend-filled-split', variant: 'filled', controls: 'split', placement: 'float', prepend: true },
  { key: 'scrub-inset-filled', variant: 'filled', controls: 'scrub', placement: 'inset', prepend: false },
  { key: 'scrub-inset-outlined', variant: 'outlined', controls: 'scrub', placement: 'inset', prepend: false },
  { key: 'stacked-inset-filled', variant: 'filled', controls: 'stacked', placement: 'inset', prepend: false },
  { key: 'stacked-inset-outlined', variant: 'outlined', controls: 'stacked', placement: 'inset', prepend: false },
  { key: 'split-inset-outlined', variant: 'outlined', controls: 'split', placement: 'inset', prepend: false },
]

const text = reactive<Record<string, string>>({})
for (const variant of textVariants) {
  for (const placement of [...overlayPlacements, 'long']) text[`${variant}-${placement}`] = 'Ada Lovelace'
}

const area = reactive<Record<string, string>>({})
for (const key of [...areaCases.map(item => item.key), 'readonly-resizable']) area[key] = 'Shipped the new release notes.'
</script>

<style lang="scss">
.fixture-family {
  display: grid;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12rem;
  }

  &__narrow {
    display: grid;
    gap: 8rem;
    width: min(240rem, 100%);
  }
}
</style>
