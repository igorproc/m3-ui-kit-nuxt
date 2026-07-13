<template>
  <div
    class="ui-file-upload__dropzone"
    :class="{ 'ui-file-upload__dropzone--dragging': dragging }"
    @dragenter.prevent="enter"
    @dragover.prevent
    @dragleave.prevent="leave"
    @drop.prevent="drop"
  >
    <slot
      :is-dragging="dragging"
      :can-drop="!ctx.disabled.value && !ctx.readonly.value"
      :disabled="ctx.disabled.value"
      :readonly="ctx.readonly.value"
      :accept="ctx.accept.value"
      :open-picker="ctx.openPicker"
    >
      <MIcon name="round-upload-file" />
      <span>Drop files here or choose files</span>
      <MButton
        type="button"
        variant="outlined"
        :disabled="ctx.disabled.value || ctx.readonly.value"
        @click="ctx.openPicker"
      >
        Choose files
      </MButton>
    </slot>
  </div>
</template>

<script setup lang="ts">
import MButton from '~/components/ui/button/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import { useFileUploadContext } from '~/composables/file-upload/context'

const ctx = useFileUploadContext()
const dragging = ref(false)
let depth = 0

function enter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return
  depth++
  dragging.value = !ctx.disabled.value && !ctx.readonly.value
}

function leave() {
  depth = Math.max(0, depth - 1)
  if (!depth) dragging.value = false
}

function drop(event: DragEvent) {
  depth = 0
  dragging.value = false
  if (ctx.disabled.value || ctx.readonly.value) return
  ctx.addFiles(Array.from(event.dataTransfer?.files ?? []), 'drop')
}
</script>
