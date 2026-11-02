<template>
  <MDialog
    v-model="open"
    role="alertdialog"
    :title="title"
    :persistent="persistent || pending"
    @confirm="emit('answer', true)"
    @cancel="emit('answer', false)"
  >
    <template v-if="text">
      {{ text }}
    </template>

    <template #actions="{ confirm, cancel }">
      <MButton
        v-if="kind === 'confirm'"
        variant="text"
        class="ui-modal-preset__cancel"
        :disabled="pending"
        @click="cancel"
      >
        {{ cancelLabel }}
      </MButton>
      <MButton
        variant="text"
        class="ui-modal-preset__confirm"
        :color="color"
        :loading="pending"
        @click="accept(confirm)"
      >
        {{ confirmLabel }}
      </MButton>
    </template>
  </MDialog>
</template>

<script setup lang="ts">
/**
 * Private: the dialog behind `$material.modal.confirm()` / `.alert()` — an
 * `alertdialog` with its text as the description, one or two text buttons.
 * An async `onConfirm` keeps the dialog open and the button busy until it
 * settles; a rejection leaves the dialog open for another try.
 */
import { shallowRef } from 'vue'
import type { PropType } from 'vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import type { MColor } from '#kit/shared/types/props'

const props = defineProps({
  kind: { type: String as PropType<'confirm' | 'alert'>, required: true },
  title: { type: String, required: true },
  text: { type: String, default: undefined },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, default: undefined },
  color: { type: String as PropType<Extract<MColor, 'error'>>, default: undefined },
  persistent: { type: Boolean, default: false },
  onConfirm: { type: Function as PropType<() => unknown>, default: undefined },
})

const emit = defineEmits<{
  (e: 'answer', accepted: boolean): void
}>()

const open = defineModel<boolean>({ default: false })
const pending = shallowRef(false)

async function accept(confirm: () => void) {
  if (pending.value) return
  pending.value = true
  try {
    await props.onConfirm?.()
    confirm()
  } catch {
    // The caller's action failed: the question stays open, its error is the caller's to show.
  } finally {
    pending.value = false
  }
}
</script>
