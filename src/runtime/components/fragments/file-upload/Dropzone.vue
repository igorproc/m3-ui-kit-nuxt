<template>
  <div
    class="ui-file-upload__dropzone"
    :class="{
      'ui-file-upload__dropzone--accepting': drag === 'accepting',
      'ui-file-upload__dropzone--refusing': drag === 'refusing',
      'ui-file-upload__dropzone--disabled': ctx.disabled.value,
    }"
    @dragenter.prevent="enter"
    @dragover.prevent
    @dragleave.prevent="leave"
    @drop.prevent="drop"
  >
    <slot
      :is-dragging="drag !== null"
      :can-drop="!inactive"
      :disabled="ctx.disabled.value"
      :readonly="ctx.readonly.value"
      :accept="ctx.accept.value"
      :open-picker="ctx.openPicker"
    >
      <MIcon
        :name="drag === 'refusing' ? ICONS.error : ICONS.uploadFile"
        class="ui-file-upload__dropzone-icon"
        aria-hidden="true"
      />

      <!-- A refused type is said in words, not only in the error colour. -->
      <span
        v-if="text"
        class="ui-file-upload__dropzone-text"
      >{{ text }}</span>

      <MButton
        v-if="messages.choose"
        type="button"
        variant="outlined"
        class="ui-file-upload__choose"
        :disabled="inactive"
        :aria-describedby="ctx.hintId.value"
        @click="ctx.openPicker"
      >
        {{ messages.choose }}
      </MButton>

      <MButtonIcon
        v-else
        type="button"
        variant="outlined"
        class="ui-file-upload__choose"
        :aria-label="ctx.label.value"
        :disabled="inactive"
        :aria-describedby="ctx.hintId.value"
        @click="ctx.openPicker"
      >
        <MIcon :name="ICONS.upload" />
      </MButtonIcon>

      <span
        v-if="ctx.hint.value"
        :id="ctx.hintId.value"
        class="ui-file-upload__hint"
      >{{ ctx.hint.value }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
/**
 * The drop target of `<MFileUpload>`. Dropping is an enhancement: the one
 * interactive element is the button, which opens the same picker from the
 * keyboard.
 */
import MButton from '#kit/components/ui/button/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useFileUploadContext } from '#kit/composables/file-upload/context'
import { dragRefused } from './upload'

const ctx = useFileUploadContext()
const drag = ref<'accepting' | 'refusing' | null>(null)
// `dragenter`/`dragleave` fire for every child crossed; the depth counts them
// so the zone only lets go when the pointer has left it entirely.
const depth = ref(0)

const messages = computed(() => ctx.messages.value)
const inactive = computed(() => ctx.disabled.value || ctx.readonly.value)
const text = computed(() => drag.value === 'refusing' ? messages.value.reject?.type : messages.value.drop)

function enter(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer?.types.includes('Files')) return

  depth.value++
  if (inactive.value) return

  const types = [...transfer.items].filter(item => item.kind === 'file').map(item => item.type)
  drag.value = dragRefused(ctx.accept.value, types) ? 'refusing' : 'accepting'
}

function leave() {
  depth.value = Math.max(0, depth.value - 1)
  if (!depth.value) drag.value = null
}

function drop(event: DragEvent) {
  depth.value = 0
  drag.value = null
  if (inactive.value) return

  ctx.addFiles(Array.from(event.dataTransfer?.files ?? []), 'drop')
}
</script>
