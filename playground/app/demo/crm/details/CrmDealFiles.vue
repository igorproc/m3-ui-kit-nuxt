<template>
  <MFileUpload
    class="crm-deal-files"
    :model-value="files"
    label="Файлы сделки"
    hint="PDF, DOCX или PNG, до 10 МБ. Файлы больше 5 МБ сервер демо отклоняет."
    accept=".pdf,.docx,.png"
    :max-size="MAX_SIZE"
    :max-files="8"
    :upload="upload"
    auto-start
    :messages="MESSAGES"
    @update:model-value="list => store.setFiles(dealId, list)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileUploadTaskContext } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'
import { useCrmDelay } from '../composables/useCrmDelay'
import { useCrmStore } from '../composables/useCrmStore'

const props = defineProps<{
  dealId: string
}>()

const MAX_SIZE = 10 * 1024 * 1024
const SERVER_LIMIT = 5 * 1024 * 1024
const PROGRESS_STEPS = 5

const MESSAGES: MFileUploadMessages = {
  drop: 'Перетащите файлы сюда',
  choose: 'Выбрать файлы',
  queue: 'Файлы сделки',
  empty: 'Файлов пока нет',
  status: {
    queued: 'в очереди',
    uploading: 'загружается',
    success: 'загружен',
    error: 'ошибка',
    cancelled: 'отменён',
  },
  reject: {
    type: 'этот тип файла не принимается',
    size: 'файл больше 10 МБ',
    count: 'не больше 8 файлов',
  },
  error: () => 'Сервер отклонил файл: превышена квота 5 МБ',
  start: 'Загрузить {name}',
  cancel: 'Отменить загрузку {name}',
  retry: 'Повторить загрузку {name}',
  remove: 'Удалить {name}',
}

const store = useCrmStore()
const { wait } = useCrmDelay()

const files = computed(() => store.files.value[props.dealId] ?? [])

async function upload(file: File, { signal, reportProgress }: FileUploadTaskContext) {
  for (let step = 1; step <= PROGRESS_STEPS; step += 1) {
    await wait(250, signal)
    reportProgress((step / PROGRESS_STEPS) * 100)
  }

  if (file.size > SERVER_LIMIT) throw new Error('quota')
  return { id: `${props.dealId}-${file.name}` }
}
</script>
