<template>
  <section class="fixture-tooltip">
    <h1>MTooltip — matrix</h1>

    <div
      v-for="variant in variants"
      :key="variant"
      class="fixture-tooltip__row"
    >
      <MTooltip
        v-for="placement in placements"
        :key="placement"
        :variant="variant"
        :placement="placement"
        :subhead="variant === 'rich' ? 'Archive' : undefined"
        :text="`Moves the message out of the inbox (${placement})`"
      >
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            :data-test="`${variant}-${placement}`"
          >
            {{ variant }} {{ placement }}
          </MButton>
        </template>
      </MTooltip>
    </div>

    <div class="fixture-tooltip__row">
      <MTooltip
        text="Linked without the slot props"
      >
        <MButton
          variant="outlined"
          data-test="auto-link"
        >
          Auto link
        </MButton>
      </MTooltip>

      <MTooltip
        text="Never shown"
        disabled
      >
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="disabled"
          >
            Disabled tooltip
          </MButton>
        </template>
      </MTooltip>

      <MTooltip
        v-model:open="controlled"
        text="Opened from outside"
      >
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="controlled"
          >
            Controlled
          </MButton>
        </template>
      </MTooltip>

      <MButton
        variant="text"
        data-test="toggle-controlled"
        @click="controlled = !controlled"
      >
        Toggle the controlled tooltip
      </MButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import type { PopoverPlacement } from '#kit/composables/popover/placement'

const variants = ['plain', 'rich'] as const
const placements: PopoverPlacement[] = ['top', 'bottom', 'start', 'end']
const controlled = ref(false)
</script>

<style lang="scss">
.fixture-tooltip {
  display: grid;
  gap: 48rem;
  justify-items: start;
  padding-block: 48rem;
  padding-inline: 96rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 96rem;
  }
}
</style>
