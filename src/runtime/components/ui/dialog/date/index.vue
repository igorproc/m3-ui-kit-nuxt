<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="{ ...themeAttrs, ...layerProps }"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-date-dialog-fade'"
    :aria-label="currentMode === 'input' ? inputTitle : label"
    @before-open="onBeforeOpen"
    @opened="focusInitial"
  >
    <div class="ui-date-dialog">
      <MDatePicker
        ref="picker"
        v-model="draft"
        v-model:mode="currentMode"
        v-bind="pickerProps"
      >
        <template
          v-if="$slots.label"
          #label
        >
          <slot name="label" />
        </template>
        <template
          v-if="$slots.headline"
          #headline="scope"
        >
          <slot
            name="headline"
            v-bind="scope"
          />
        </template>
        <template
          v-if="$slots.day"
          #day="scope"
        >
          <slot
            name="day"
            v-bind="scope"
          />
        </template>
        <template
          v-if="$slots.year"
          #year="scope"
        >
          <slot
            name="year"
            v-bind="scope"
          />
        </template>

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
 * with Cancel and OK. The picker edits a draft; OK writes it to `v-model:date`
 * in the type the model came in, Cancel, Escape and the scrim drop it and say
 * so with `cancel`.
 */
import { computed, inject, ref, useTemplateRef, watch } from 'vue'
import type { ComputedRef } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDatePicker from '#kit/components/ui/date-picker/index.vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { provideDatePickerHosted } from '#kit/components/ui/date-picker/context'
import type { MDatePickerMode, MDatePickerValue } from '#kit/components/ui/date-picker/props'
import type { DateGridCell } from '#kit/composables/date/useDateGridControl'
import { toDate, toModelValue } from '#kit/utils/date/value'
import { DIALOG_PICKER_KEYS, mDialogDateProps } from './props'

const props = defineProps(mDialogDateProps)

const modelValue = defineModel<boolean>('modelValue', { default: false })
const date = defineModel<MDatePickerValue | null>('date', { default: null })

const emit = defineEmits<{
  (e: 'update:mode', mode: MDatePickerMode): void
  (e: 'cancel'): void
  /** The chosen day, as a `Date`, whatever type `v-model:date` holds. */
  (e: 'confirm', date: Date | null): void
}>()

defineSlots<{
  label?: () => unknown
  headline?: (props: { date: Date | null }) => unknown
  day?: (props: { day: DateGridCell }) => unknown
  year?: (props: { year: number }) => unknown
}>()

// The dialog is the surface; the picker inside draws none of its own.
provideDatePickerHosted(true)

const pickerProps = computed(() => Object.fromEntries(DIALOG_PICKER_KEYS.map(key => [key, props[key]])))
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')
const picker = useTemplateRef<InstanceType<typeof MDatePicker>>('picker')
const injectedThemeAttrs = inject<ComputedRef<Record<string, string | undefined>> | null>('theme-attrs', null)
const themeAttrs = computed(() => injectedThemeAttrs?.value ?? {})

const draft = ref<Date | null>(null)
const currentMode = ref<MDatePickerMode>(props.mode ?? props.initialMode)
// Set on OK, so the close that follows is not read as a cancel.
let confirmed = false
// A press during the closing animation does nothing.
let closing = false

watch(() => props.mode, (next) => {
  if (next) currentMode.value = next
})
watch(currentMode, next => emit('update:mode', next))

function onBeforeOpen() {
  draft.value = toDate(date.value)
  // Without `v-model:mode` every opening starts where `initialMode` says.
  currentMode.value = props.mode ?? props.initialMode
  confirmed = false
  closing = false
}

// The overlay's root is a fragment (activator slot + teleport), so its `$el`
// is an anchor, not the dialog; the picker's own root holds the parts. The
// calendar takes its tab stop (the chosen day, or today); a typed date, its
// field.
function focusInitial() {
  const root = picker.value?.$el as HTMLElement | undefined
  const target = currentMode.value === 'input' ? 'input' : '[role="gridcell"][tabindex="0"]'
  root?.querySelector<HTMLElement>(target)?.focus()
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
  // Emitted from the value just made: with `v-model:date` the model reads the
  // old value back until the parent re-renders.
  const chosen = draft.value
  date.value = toModelValue(chosen, date.value)
  emit('confirm', chosen)
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

$t: material-map(t.$tokens, 'm-date-picker');

.ui-date-dialog {
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

// Outside the block on purpose: the overlay applies the transition to its own
// content element, which holds `.ui-date-dialog`.
.ui-date-dialog-fade-enter-active,
.ui-date-dialog-fade-leave-active {
  transition: opacity g($t, 'motion.duration') g($t, 'motion.easing');
}

.ui-date-dialog-fade-enter-from,
.ui-date-dialog-fade-leave-to {
  opacity: 0;
}
</style>
