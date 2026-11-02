<template>
  <section class="fixture-slider">
    <h1>MSlider — state matrix</h1>

    <div data-test="single">
      <MSlider
        v-model="volume"
        label="Volume"
        show-value
      />
    </div>

    <div data-test="formatted">
      <MSlider
        v-model="price"
        :max="1000"
        :step="10"
        label="Price"
        show-value
        :format-value="(value: number) => `$${value}`"
      />
    </div>

    <div data-test="range">
      <MSlider
        v-model="span"
        range
        label="Price range"
        aria-label-start="Minimum price"
        aria-label-end="Maximum price"
      />
    </div>

    <div data-test="centered">
      <MSlider
        v-model="balance"
        :min="-50"
        :max="50"
        origin="center"
        label="Balance"
      />
    </div>

    <div data-test="comfortable">
      <MSlider
        v-model="brightness"
        density="comfortable"
        label="Brightness"
        helper-text="Applies to every screen"
      >
        <template #icon>
          <MIcon name="ic:outline-light-mode" />
        </template>
      </MSlider>
    </div>

    <div data-test="discrete">
      <MSlider
        v-model="steps"
        :step="10"
        discrete
        show-value
        label="Steps"
      />
    </div>

    <div data-test="invalid">
      <MSlider
        :model-value="90"
        label="Volume"
        error-message="Too loud for the night mode"
      />
    </div>

    <div data-test="disabled">
      <MSlider
        :model-value="30"
        label="Disabled"
        disabled
      />
    </div>

    <div
      class="fixture-slider__vertical"
      data-test="vertical"
    >
      <MSlider
        v-model="level"
        orientation="vertical"
        label="Level"
      />
    </div>

    <div class="fixture-slider__spacer" />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const volume = ref(40)
const price = ref(350)
const span = ref([20, 80])
const level = ref(50)
const balance = ref(20)
const brightness = ref(60)
const steps = ref(40)
</script>

<style lang="scss">
.fixture-slider {
  display: flex;
  flex-direction: column;
  gap: 24rem;
  max-width: 480rem;

  &__vertical {
    height: 200rem;
  }

  // Room below the controls, so a touch swipe has a page to scroll.
  &__spacer {
    height: 2000rem;
  }
}
</style>
