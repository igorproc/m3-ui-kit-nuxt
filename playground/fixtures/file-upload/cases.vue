<template>
  <section class="fixture-cases">
    <h1>MFileUpload — in a form</h1>

    <form
      class="fixture-cases__form"
      data-test="form"
      @submit.prevent="submits++"
    >
      <MFileUpload
        v-model="queue"
        label="Required, files from the model"
        :upload="upload"
        :messages="messages"
        required
        data-test="required"
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
import MFileUpload from '#kit/components/ui/file-upload/index.vue'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'

const messages: MFileUploadMessages = {
  drop: 'Drop files here',
  choose: 'Choose files',
  queue: 'Upload queue',
  status: { queued: 'Queued', uploading: 'Uploading', success: 'Uploaded', error: 'Failed', cancelled: 'Cancelled' },
  remove: 'Remove {name}',
}

const queue = ref<File[]>([new File(['%PDF'], 'contract.pdf', { type: 'application/pdf', lastModified: 1 })])
const submits = ref(0)

function upload() {
  return Promise.resolve()
}
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
