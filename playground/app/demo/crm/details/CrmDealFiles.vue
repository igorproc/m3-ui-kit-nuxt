<template>
  <MFileUpload
    class="crm-deal-files"
    :model-value="files"
    label="Файлы сделки"
    hint="PDF, DOCX или PNG, до 10 МБ. Файлы больше 5 МБ сервер демо отклоняет."
    accept=".pdf,.docx,.png"
    :max-size="MAX_SIZE"
    :max-files="8"
    :queue="queue"
    auto-start
    :messages="MESSAGES"
    @update:model-value="list => store.setFiles(dealId, list)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'
import { useCrmStore } from '../composables/useCrmStore'

const props = defineProps<{
  dealId: string
  /** The deal's uploads, kept by the sheet so a tab switch sends nothing twice. */
  queue: FileUploadQueue
}>()

const MAX_SIZE = 10 * 1024 * 1024

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

const files = computed(() => store.files.value[props.dealId] ?? [])
</script>
