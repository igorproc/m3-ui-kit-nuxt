<template>
  <TransitionGroup
    v-if="ctx.entries.value.length"
    ref="list"
    tag="ul"
    name="ui-file-upload-row"
    class="ui-file-upload__list"
    :aria-label="ctx.messages.value.queue"
  >
    <slot
      v-for="(entry, index) in ctx.entries.value"
      :key="entry.id"
      name="item"
      :entry="entry"
      :start="() => ctx.start(entry.id)"
      :cancel="() => ctx.cancel(entry.id)"
      :retry="() => ctx.retry(entry.id)"
      :remove="() => remove(index)"
    >
      <FileUploadItem
        :entry="entry"
        :can-upload="canUpload"
        @remove="remove(index)"
      />
    </slot>
  </TransitionGroup>

  <slot
    v-else
    name="empty"
  >
    <p
      v-if="ctx.messages.value.empty"
      class="ui-file-upload__empty"
    >
      {{ ctx.messages.value.empty }}
    </p>
  </slot>
</template>

<script setup lang="ts">
/**
 * The upload queue as a list. Removing a row moves focus to the row that takes
 * its place — or, when the queue empties, to the dropzone's button — instead
 * of letting it fall to the page with the button that held it.
 */
import { TransitionGroup } from 'vue'
import FileUploadItem from './Item.vue'
import { useFileUploadContext } from '#kit/composables/file-upload/context'

defineProps<{ canUpload: boolean }>()

const ctx = useFileUploadContext()
const list = ref<{ $el: HTMLElement } | null>(null)

function focusTarget(host: HTMLElement | null | undefined, index: number) {
  // A removed row is still in the DOM while it leaves; it is not a target.
  const rows = host ? [...host.querySelectorAll<HTMLElement>('.ui-file-upload__item:not(.ui-file-upload-row-leave-active)')] : []
  const row = rows[Math.min(index, rows.length - 1)]
  const action = row?.querySelector<HTMLElement>('.ui-file-upload__item-actions button:not(:disabled)')
  return action ?? host?.closest('.ui-file-upload')?.querySelector<HTMLElement>('.ui-file-upload__choose')
}

function remove(index: number) {
  const entry = ctx.entries.value[index]
  if (!entry) return

  const host = list.value?.$el
  const component = host?.closest<HTMLElement>('.ui-file-upload')
  const hadFocus = host?.contains(document.activeElement) ?? false
  ctx.remove(entry.id)
  if (!hadFocus) return

  nextTick(() => {
    const target = focusTarget(list.value?.$el, index) ?? component?.querySelector<HTMLElement>('.ui-file-upload__choose')
    target?.focus()
  })
}
</script>
