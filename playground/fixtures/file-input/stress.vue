<template>
  <section class="fixture-stress">
    <h1>MFileInput — stress content</h1>

    <div class="fixture-stress__narrow">
      <MFileInput
        v-model="long"
        label="Signed contract, scanned, both sides, every page"
        browse-label="Browse"
        clear-label="Remove the files"
        show-size
        data-test="long"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MFileInput
        v-model="many"
        multiple
        label="Attachments"
        browse-label="Browse"
        clear-label="Remove the files"
        data-test="many"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MFileInput from '#kit/components/ui/file-input/index.vue'

const long = ref<File | null>(new File(['x'], 'a_very_long_file_name_without_any_break_2026_10_07_final_final.pdf', { type: 'application/pdf' }))
const many = ref<File[]>(['one', 'two', 'three', 'four', 'five'].map(name => new File(['x'], `${name}.txt`)))
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: min(280rem, 100%);
  }
}
</style>
