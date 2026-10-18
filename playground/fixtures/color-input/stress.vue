<template>
  <section class="fixture-stress">
    <h1>MColorInput — stress content</h1>

    <div class="fixture-stress__narrow">
      <MColorInput
        v-model="long"
        label="The accent colour every heading and button of the workspace uses"
        picker-label="Pick a colour"
        format="auto"
        data-test="long"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MColorInput from '#kit/components/ui/color-input/index.vue'

const long = ref<string | null>('hsla(258, 34%, 48%, 0.5)')
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: min(200rem, 100%);
  }
}
</style>
