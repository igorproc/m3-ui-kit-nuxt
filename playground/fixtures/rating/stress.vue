<template>
  <section class="fixture-rating-stress">
    <h1>MRating — stress content</h1>

    <div
      class="fixture-rating-stress__column"
      data-test="ten"
    >
      <MRating
        v-model="ten"
        :length="10"
        label="Ten-point score"
        helper-text="The column is narrower than the scale: it scrolls instead of squeezing the 48 cells"
      />
    </div>

    <div
      class="fixture-rating-stress__column"
      data-test="twenty"
    >
      <MRating
        v-model="twenty"
        :length="20"
        :step="0.5"
        label="Twenty-point score with halves"
      />
    </div>

    <div
      class="fixture-rating-stress__column"
      data-test="long-label"
    >
      <MRating
        v-model="five"
        label="How likely are you to recommend the delivery service to a friend or a colleague who orders often"
        error-message="Rate the delivery before you send the review, even if it was not your first order"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MRating from '#kit/components/ui/rating/index.vue'

const ten = ref(7)
const twenty = ref(12.5)
const five = ref(0)
</script>

<style lang="scss">
.fixture-rating-stress {
  display: grid;
  gap: 24rem;

  &__column {
    inline-size: 320rem;
    max-inline-size: 100%;
    overflow-x: auto;
  }
}
</style>
