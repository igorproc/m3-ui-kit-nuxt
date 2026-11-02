<template>
  <section class="fixture-slider-stress">
    <h1>MSlider — stress content</h1>

    <div data-test="huge">
      <MSlider
        v-model="budget"
        :max="1000000"
        :step="0.01"
        label="Budget"
        show-value
        :format-value="rubles"
      />
    </div>

    <div data-test="huge-range">
      <MSlider
        v-model="span"
        :max="1000000"
        :step="0.01"
        range
        label="Price range"
        aria-label-start="Minimum price"
        aria-label-end="Maximum price"
        show-value
        :format-value="rubles"
      />
    </div>

    <div
      class="fixture-slider-stress__narrow"
      data-test="long-label"
    >
      <MSlider
        v-model="volume"
        label="How loud the notification sound plays when a message arrives while the window is in the background"
        helper-text="The level is kept per device and does not follow you to the other ones you sign in on"
        show-value
      />
    </div>

    <div
      class="fixture-slider-stress__narrow"
      data-test="many-ticks"
    >
      <MSlider
        v-model="ticks"
        :max="100"
        discrete
        label="Every step marked"
      />
    </div>

    <div data-test="tiny-step">
      <MSlider
        v-model="ratio"
        :max="1"
        :step="0.001"
        label="Ratio"
        show-value
      />
    </div>

    <h2>A range given an origin (warns in development)</h2>
    <div data-test="range-origin">
      <MSlider
        v-model="centeredRange"
        :min="-50"
        :max="50"
        range
        origin="center"
        label="Offset"
        aria-label-start="Lowest offset"
        aria-label-end="Highest offset"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MSlider from '#kit/components/ui/slider/index.vue'

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 })
const rubles = (value: number) => money.format(value)

const budget = ref(625000)
const span = ref([125000.5, 875000.25])
const volume = ref(40)
const ticks = ref(37)
const ratio = ref(0.5)
const centeredRange = ref([-20, 30])
</script>

<style lang="scss">
.fixture-slider-stress {
  display: grid;
  gap: 24rem;

  &__narrow {
    inline-size: 200rem;
    max-inline-size: 100%;
  }
}
</style>
