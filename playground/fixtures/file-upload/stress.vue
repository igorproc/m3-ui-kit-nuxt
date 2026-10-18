<template>
  <section class="fixture-stress">
    <h1>MFileUpload — stress content</h1>

    <div class="fixture-stress__narrow">
      <MFileUpload
        v-model="many"
        label="A hundred files"
        :messages="messages"
        data-test="many"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MFileUpload
        v-model="none"
        label="Nothing, and nothing said"
        data-test="silent"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MFileUpload from '#kit/components/ui/file-upload/index.vue'

const messages = {
  choose: 'Choose files',
  queue: 'Upload queue',
  remove: 'Remove {name}',
  start: 'Start {name}',
}

const many = ref<File[]>(Array.from({ length: 100 }, (_, index) =>
  new File(['x'], `scan_${String(index).padStart(3, '0')}_without_any_break_in_its_long_name.pdf`, { type: 'application/pdf', lastModified: index })))
const none = ref<File[]>([])
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__narrow {
    width: min(320rem, 100%);
  }
}
</style>
