<template>
  <section class="fixture-rating">
    <h1>MRating — state matrix</h1>

    <div data-test="whole">
      <MRating
        v-model="whole"
        aria-label="Delivery rating"
        :value-text="(value: number, length: number) => `${value} of ${length}`"
      />
    </div>

    <div data-test="half">
      <MRating
        v-model="half"
        :step="0.5"
        aria-label="Half-star rating"
      />
    </div>

    <div data-test="readonly">
      <MRating
        :model-value="4"
        readonly
        aria-label="Average rating"
      />
    </div>

    <div data-test="disabled">
      <MRating
        :model-value="2"
        disabled
        aria-label="Disabled rating"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const whole = ref(3)
const half = ref(2.5)
</script>

<style lang="scss">
.fixture-rating {
  display: flex;
  flex-direction: column;
  gap: 16rem;
}
</style>
