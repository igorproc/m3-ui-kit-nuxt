<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="{ ...themeAttrs, ...layerProps }"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-date-dialog-fade'"
    :aria-label="title"
    @before-open="onBeforeOpen"
    @opened="focusDay"
  >
    <div class="ui-date-dialog">
      <MDatePicker
        ref="picker"
        v-model="draft"
        v-model:mode="mode"
        :label="title"
        :input-title="inputTitle"
        :min-date="minDate"
        :max-date="maxDate"
        :locale="locale"
      >
        <template #actions>
          <MButton
            variant="text"
            @click="cancel"
          >
            {{ cancelLabel }}
          </MButton>
          <MButton
            variant="text"
            @click="confirm"
          >
            {{ confirmLabel }}
          </MButton>
        </template>
      </MDatePicker>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
/**
 * `<MDialogDate>` — the modal date picker of M3: `<MDatePicker>` in a dialog,
 * with Cancel and OK. The picker edits a draft; OK writes it to `v-model:date`,
 * Cancel, Escape and the scrim drop it and say so with `cancel`.
 */
import { computed, inject, ref, useTemplateRef, watch } from 'vue'
import type { ComputedRef, PropType } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDatePicker from '#kit/components/ui/date-picker/index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { mModalLayerProps, pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { provideDatePickerHosted } from '#kit/components/ui/date-picker/context'
import type { MDatePickerMode, MDatePickerValue } from '#kit/components/ui/date-picker/props'
import { useRetiredPropWarning } from '#kit/composables/button/useRetiredValueWarning'
import { MESSAGES } from '#kit/shared/constants/messages'

const props = defineProps({
  /** Title over the date while picking on the calendar. */
  label: { type: String, default: MESSAGES.dateTitle },
  /** Title over the date while typing it. */
  inputTitle: { type: String, default: MESSAGES.dateInputTitle },
  /** @deprecated Retired: use `label`. Still shown for one release, with a dev warning. */
  headline: { type: String, default: undefined },
  /** How the picker opens: on the calendar or on a typed date. */
  initialMode: { type: String as PropType<MDatePickerMode>, default: 'picker' },
  minDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  maxDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  locale: { type: String, default: 'en-US' },
  cancelLabel: { type: String, default: MESSAGES.dateCancel },
  confirmLabel: { type: String, default: MESSAGES.dateConfirm },
  ...mModalLayerProps,
})

const modelValue = defineModel<boolean>('modelValue', { default: false })
const date = defineModel<MDatePickerValue | null>('date', { default: null })
const mode = defineModel<MDatePickerMode>('mode')

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', date: Date | null): void
}>()

useRetiredPropWarning('m-dialog-date', 'headline', () => props.headline, '`label`')

// The dialog is the surface; the picker inside draws none of its own.
provideDatePickerHosted(true)

const title = computed(() => props.headline ?? props.label)
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')
const picker = useTemplateRef<InstanceType<typeof MDatePicker>>('picker')
const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)
const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const draft = ref<MDatePickerValue | null>(null)
// Set on OK, so the close that follows is not read as a cancel.
let confirmed = false
// A press during the closing animation does nothing.
let closing = false

function onBeforeOpen() {
  draft.value = date.value ? new Date(date.value) : null
  mode.value ??= props.initialMode
  confirmed = false
  closing = false
}

// The overlay's root is a fragment (activator slot + teleport), so its `$el`
// is an anchor, not the dialog; the picker's own root holds the day cells.
function focusDay() {
  const root = picker.value?.$el as HTMLElement | undefined
  root?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus()
}

function cancel() {
  if (closing) return
  closing = true
  modelValue.value = false
}

function confirm() {
  // A refused typed date keeps the dialog open, its error showing.
  if (closing || picker.value?.validate() === false) return
  closing = true
  confirmed = true
  date.value = draft.value === null ? null : new Date(draft.value)
  emit('confirm', date.value as Date | null)
  modelValue.value = false
}

// Escape and the scrim close the dialog through the model, like Cancel does:
// every way out that is not OK is a cancel.
watch(modelValue, (open) => {
  if (open || confirmed) return
  closing = true
  emit('cancel')
})

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/date-picker' as t;

.ui-date-dialog {
  $t: material-map(t.$tokens, 'm-date-picker');

  width: g($t, 'container.width');
  max-width: 100%;

  // On a short landscape screen the dialog scrolls, so OK and Cancel stay
  // reachable.
  max-height: 100dvh;
  overflow-y: auto;
  border-radius: g($t, 'dialog.shape');
  background-color: g($t, 'container.color');
  box-shadow: g($t, 'dialog.elevation');

  @include forced-colors {
    border: 1px solid CanvasText;
  }
}

.ui-date-dialog-fade-enter-active,
.ui-date-dialog-fade-leave-active {
  transition: opacity var(--sys-motion-duration-short-4) var(--sys-motion-easing-standard);
}

.ui-date-dialog-fade-enter-from,
.ui-date-dialog-fade-leave-to {
  opacity: 0;
}
</style>
