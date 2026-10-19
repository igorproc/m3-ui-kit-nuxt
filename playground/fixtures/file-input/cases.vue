<template>
  <section class="fixture-cases">
    <h1>MFileInput — in a form</h1>

    <form
      class="fixture-cases__form"
      data-test="form"
      @submit.prevent="submits++"
    >
      <MFileInput
        v-model="given"
        label="Required, value from the model"
        browse-label="Browse"
        clear-label="Remove the file"
        name="given"
        required
        data-test="given"
      />

      <MFileInput
        v-model="empty"
        label="Required, empty"
        browse-label="Browse"
        clear-label="Remove the file"
        name="empty"
        required
        data-test="empty"
      />

      <button
        type="submit"
        data-test="submit"
      >
        Send
      </button>
    </form>

    <output data-test="submits">{{ submits }}</output>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MFileInput from '#kit/components/ui/file-input/index.vue'

const given = ref<File | null>(new File(['%PDF'], 'given.pdf', { type: 'application/pdf' }))
const empty = ref<File | null>(null)
const submits = ref(0)
</script>

<style lang="scss">
.fixture-cases {
  display: grid;
  gap: 16rem;

  &__form {
    display: grid;
    gap: 16rem;
    max-width: 480rem;
  }
}
</style>
