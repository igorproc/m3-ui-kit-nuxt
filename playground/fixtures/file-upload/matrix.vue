<template>
  <section class="fixture-upload">
    <h1>MFileUpload — state matrix</h1>

    <div class="fixture-upload__case">
      <MFileUpload
        v-model="queue"
        label="Attachments"
        hint="PDF or PNG, up to 1 KB"
        accept="application/pdf,image/png"
        :max-size="1024"
        :upload="upload"
        :messages="messages"
        required
        data-test="enabled"
      />
    </div>

    <div class="fixture-upload__case">
      <MFileUpload
        v-model="autoQueue"
        label="Uploaded on arrival"
        :upload="upload"
        :messages="messages"
        auto-start
        data-test="auto"
      />
    </div>

    <div class="fixture-upload__case">
      <MFileUpload
        v-model="frozen"
        label="Disabled attachments"
        :upload="upload"
        :messages="messages"
        disabled
        data-test="disabled"
      />
    </div>

    <button
      type="button"
      data-test="reset"
      @click="queue = []"
    >
      Reset the queue from outside
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MFileUpload from '#kit/components/ui/file-upload/index.vue'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'

const pdf = (name: string) => new File(['%PDF'], name, { type: 'application/pdf', lastModified: 1 })

const messages: MFileUploadMessages = {
  drop: 'Drop files here',
  choose: 'Choose files',
  queue: 'Upload queue',
  empty: 'Nothing chosen yet',
  startAll: 'Start uploads',
  status: { queued: 'Queued', uploading: 'Uploading', success: 'Uploaded', error: 'Failed', cancelled: 'Cancelled' },
  reject: { type: 'type not allowed', size: 'larger than 1 KB', count: 'too many files' },
  error: error => (error as Error).message === 'network' ? 'network error' : undefined,
  start: 'Start {name}',
  cancel: 'Cancel {name}',
  retry: 'Retry {name}',
  remove: 'Remove {name}',
}

// One file hangs, one fails with a network error, the rest succeed at once.
function upload(file: File) {
  if (file.name.startsWith('hang')) return new Promise<void>(() => {})
  if (file.name.startsWith('fail')) return Promise.reject(new Error('network'))
  return Promise.resolve()
}

const queue = ref<File[]>([pdf('contract.pdf'), pdf('a_very_long_file_name_that_will_not_fit_on_one_line_2026_10_07.pdf')])
const autoQueue = ref<File[]>([pdf('hang-scan.pdf'), pdf('fail-scan.pdf'), pdf('done.pdf')])
const frozen = ref<File[]>([pdf('locked.pdf')])
</script>

<style lang="scss">
.fixture-upload {
  display: grid;
  gap: 24rem;

  &__case {
    max-width: 480rem;
  }
}
</style>
