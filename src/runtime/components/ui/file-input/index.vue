<template>
  <div
    v-bind="rootAttrs()"
    class="ui-file-input"
  >
    <MTextField
      v-bind="controlAttrs()"
      :model-value="displayText"
      :focused="focusedModel"
      :label="label"
      :placeholder="placeholder"
      :helper-text="helperText"
      :variant="variant"
      :shape="shape"
      :label-placement="labelPlacement"
      :density="density"
      :disabled="disabled"
      :required="required"
      :autofocus="autofocus"
      :error="isError"
      :error-message="displayError"
      readonly
      @update:focused="focusedModel = $event"
    >
      <template
        v-if="$slots.prepend"
        #prepend
      >
        <slot name="prepend" />
      </template>

      <template #append>
        <div class="ui-file-input__actions">
          <slot
            v-if="$slots.actions"
            name="actions"
            :files="files"
            :open="open"
            :clear="clear"
            :disabled="actionsDisabled"
          />
          <template v-else>
            <slot
              name="browse"
              :props="browseButtonProps"
              :open="open"
            >
              <MButton
                v-if="browseLabel"
                v-bind="browseButtonProps"
                @focus="focusedModel = true"
                @blur="focusedModel = false"
                @click="open"
              >
                {{ browseLabel }}
              </MButton>

              <MButtonIcon
                v-else
                v-bind="browseButtonProps"
                :aria-label="label"
                @focus="focusedModel = true"
                @blur="focusedModel = false"
                @click="open"
              >
                <MIcon :name="ICONS.attachFile" />
              </MButtonIcon>
            </slot>

            <slot
              v-if="clearable && files.length > 0"
              name="clear"
              :props="clearButtonProps"
              :clear="clear"
            >
              <MButtonIcon
                v-bind="clearButtonProps"
                @click="clear"
              >
                <MIcon :name="ICONS.close" />
              </MButtonIcon>
            </slot>
          </template>
        </div>
      </template>
    </MTextField>

    <!-- Describes the browse button by the field it belongs to, so two of them
         on one page are told apart. Hidden content still names: a reference
         by id reads it. -->
    <span
      v-if="label"
      :id="labelEchoId"
      hidden
    >{{ label }}</span>

    <div
      v-if="$slots.selection"
      class="ui-file-input__selection"
    >
      <slot
        name="selection"
        :files="files"
        :text="displayText"
      />
    </div>

    <input
      ref="nativeInput"
      class="ui-file-input__native"
      type="file"
      :accept="accept"
      :multiple="multiple"
      v-bind="captureAttrs"
      :required="required"
      :name="name ?? path"
      :disabled="actionsDisabled"
      tabindex="-1"
      aria-hidden="true"
      @change="onNativeChange"
    >
  </div>
</template>

<script setup lang="ts">
import MTextField from '#kit/components/ui/text-field/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { mFileInputProps } from './props'
import { useFieldShape } from '#kit/components/ui/text-field/useFieldShape'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useField } from '#kit/composables/useField'
import { createFilePolicy, formatFileSize } from '#kit/shared/utils/file'
import type { FileRejection } from '#kit/shared/utils/file'
import type { InputHTMLAttributes } from 'vue'

interface BrowseButtonSlotProps {
  'type': 'button'
  'variant': 'text'
  'disabled': boolean
  'aria-describedby': string | undefined
}

interface ClearButtonSlotProps {
  type: 'button'
  disabled: boolean
  ariaLabel: string | undefined
}

// The root is a wrapper; aria-* and listeners belong on the field's input.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mFileInputProps)
const modelValue = defineModel<File | File[] | null>({ default: null })
const focusedModel = defineModel<boolean>('focused', { default: false })

const emit = defineEmits<{
  (event: 'reject', rejection: FileRejection): void
  (event: 'clear'): void
  (event: 'select', files: File[]): void
}>()

defineSlots<{
  prepend?(): unknown
  selection?(props: { files: File[], text: string }): unknown
  browse?(props: { props: BrowseButtonSlotProps, open: () => void }): unknown
  clear?(props: { props: ClearButtonSlotProps, clear: () => void }): unknown
  actions?(props: { files: File[], open: () => void, clear: () => void, disabled: boolean }): unknown
}>()

const shape = useFieldShape('m-file-input', props)
const labelEchoId = useId()
const nativeInput = ref<HTMLInputElement>()

const files = computed<File[]>(() => {
  if (Array.isArray(modelValue.value)) return modelValue.value
  return modelValue.value ? [modelValue.value] : []
})

// Validation binds the files, not the summary text the field displays.
const field = useField<File | File[] | null>({ path: props.path, model: modelValue })

// A refused file is reported until the next choice or a clear: the error says
// which file and why, not only that something went wrong.
const rejection = ref<FileRejection>()
const rejectionText = computed(() => {
  if (!rejection.value) return undefined
  const reasons = rejection.value.reasons.map(reason => props.rejectMessages?.[reason]).filter(Boolean)
  return reasons.length ? `${rejection.value.file.name}: ${reasons.join(', ')}` : rejection.value.file.name
})

const isError = computed(() => props.error || Boolean(props.errorMessage) || field.hasError.value || Boolean(rejection.value))
const displayError = computed(() => field.errorMessage.value ?? props.errorMessage ?? rejectionText.value)

const actionsDisabled = computed(() => props.disabled || props.readonly)
const policy = computed(() => createFilePolicy({
  accept: props.accept,
  maxFiles: props.multiple ? props.maxFiles : 1,
  maxSize: props.maxSize,
}))
// `capture` is not a Vue boolean attribute: `true` would render as capture="true".
const captureAttrs = computed(() => props.capture
  ? { capture: (props.capture === true ? '' : props.capture) as InputHTMLAttributes['capture'] }
  : {})

// Names alone: a count past the first three is a number, not a phrase, so the
// summary needs no copy of the kit's own.
const SUMMARY_NAMES = 3
const displayText = computed(() => {
  if (files.value.length === 0) return ''
  if (files.value.length === 1) {
    const file = files.value[0]!
    return props.showSize ? `${file.name} (${formatFileSize(file.size)})` : file.name
  }
  const names = files.value.slice(0, SUMMARY_NAMES).map(file => file.name).join(', ')
  const rest = files.value.length - SUMMARY_NAMES
  return rest > 0 ? `${names} +${rest}` : names
})

const browseButtonProps = computed<BrowseButtonSlotProps>(() => ({
  'type': 'button' as const,
  'variant': 'text' as const,
  'disabled': actionsDisabled.value,
  'aria-describedby': props.label ? labelEchoId : undefined,
}))
const clearButtonProps = computed<ClearButtonSlotProps>(() => ({
  type: 'button' as const,
  disabled: actionsDisabled.value,
  ariaLabel: props.clearLabel,
}))

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.browseLabel) {
      console.warn('[m-file-input] no `browse-label`: the browse button falls back to an icon named after the field label.')
    }
    if (props.clearable && files.value.length > 0 && !props.clearLabel) {
      console.warn('[m-file-input] the clear button has no accessible name: pass `clear-label`.')
    }
  })
}

function open() {
  if (actionsDisabled.value || !nativeInput.value) return
  nativeInput.value.value = ''
  nativeInput.value.click()
}

function clear() {
  if (actionsDisabled.value) return
  modelValue.value = props.multiple ? [] : null
  rejection.value = undefined
  if (nativeInput.value) nativeInput.value.value = ''
  emit('clear')
}

function onNativeChange(event: Event) {
  const input = event.target as HTMLInputElement
  const result = policy.value.evaluate(input.files ?? [])

  rejection.value = result.rejected[0]
  for (const refused of result.rejected) emit('reject', refused)
  if (result.accepted.length === 0) return

  modelValue.value = props.multiple ? result.accepted : result.accepted[0]!
  emit('select', result.accepted)
}

defineExpose({ open, clear })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/file-input' as t;

.ui-file-input {
  $t: material-map(t.$tokens, 'm-file-input');

  min-width: 0;

  &__actions {
    display: flex;
    align-items: center;
    gap: g($t, 'actions.gap');
  }

  &__selection {
    margin-top: g($t, 'selection.margin.top');
    color: g($t, 'selection.color');

    @include typescale(g($t, 'selection.typography'));
  }

  &__native {
    @include sr-only;
  }
}
</style>
