<template>
  <section class="fixture-choice">
    <h1>MRadio — state matrix</h1>

    <p id="delivery-label">
      Delivery
    </p>
    <MRadioGroup
      v-model="delivery"
      data-test="group"
      aria-labelledby="delivery-label"
      helper-text="Arrives in two days"
    >
      <MRadio
        value="standard"
        label="Standard"
      />
      <MRadio
        value="express"
        label="Express"
      />
      <MRadio
        value="pickup"
        label="Pickup"
        disabled
      />
    </MRadioGroup>

    <p id="plan-label">
      Plan
    </p>
    <MRadioGroup
      v-model="plan"
      data-test="invalid-group"
      aria-labelledby="plan-label"
      error-message="Choose a plan"
    >
      <MRadio
        value="free"
        label="Free"
      />
      <MRadio
        value="pro"
        label="Pro"
      />
    </MRadioGroup>

    <h2>Standalone</h2>
    <div
      class="fixture-choice__case"
      data-test="standalone"
    >
      <MRadio
        v-model="single"
        value="yes"
        name="single"
        label="Standalone, with a hint"
        helper-text="Only one option"
      />
    </div>
    <div
      class="fixture-choice__case"
      data-test="disabled-checked"
    >
      <MRadio
        model-value="on"
        value="on"
        name="disabled"
        label="Disabled, checked"
        disabled
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const delivery = ref('standard')
const plan = ref<string>()
const single = ref<string>()
</script>

<style lang="scss">
.fixture-choice {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__case {
    display: flex;
  }
}
</style>
