<template>
  <div class="ui-file-input">
    <MTextField
      :model-value="displayText"
      :focused="focusedModel"
      :label="label"
      :placeholder="placeholder"
      :helper-text="helperText"
      :variant="variant"
      :disabled="disabled"
      :error="error"
      :error-message="errorMessage"
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
                v-bind="browseButtonProps"
                @focus="focusedModel = true"
                @blur="focusedModel = false"
                @click="open"
              >
                Browse
              </MButton>
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
                <MIcon name="round-close" />
              </MButtonIcon>
            </slot>
          </template>
        </div>
      </template>
    </MTextField>

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
      :capture="captureAttribute"
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
import MTextField from '~/components/ui/text-field/index.vue'
import MButton from '~/components/ui/button/index.vue'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import { mFileInputProps } from './props'
import { createFilePolicy, formatFileSize } from '~~/shared/utils/file'
import type { FileRejection } from '~~/shared/utils/file'

interface BrowseButtonSlotProps {
  type: 'button'
  variant: 'text'
  disabled: boolean
}

interface ClearButtonSlotProps {
  type: 'button'
  disabled: boolean
  ariaLabel: string
}

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

const nativeInput = ref<HTMLInputElement>()
const files = computed<File[]>(() => {
  if (Array.isArray(modelValue.value)) return modelValue.value
  return modelValue.value ? [modelValue.value] : []
})
const actionsDisabled = computed(() => props.disabled || props.readonly)
const policy = computed(() => createFilePolicy({
  accept: props.accept,
  maxFiles: props.multiple ? props.maxFiles : 1,
  maxSize: props.maxSize,
}))
const captureAttribute = computed(() => props.capture === true ? '' : props.capture || undefined)
const displayText = computed(() => {
  if (files.value.length === 0) return ''
  if (files.value.length === 1) {
    const file = files.value[0]!
    return props.showSize ? `${file.name} (${formatFileSize(file.size)})` : file.name
  }
  if (files.value.length <= 3) return files.value.map(file => file.name).join(', ')
  return `Selected files: ${files.value.length}`
})
const browseButtonProps = computed<BrowseButtonSlotProps>(() => ({
  type: 'button' as const,
  variant: 'text' as const,
  disabled: actionsDisabled.value,
}))
const clearButtonProps = computed<ClearButtonSlotProps>(() => ({
  type: 'button' as const,
  disabled: actionsDisabled.value,
  ariaLabel: 'Clear selected files',
}))

function open() {
  if (actionsDisabled.value || !nativeInput.value) return
  nativeInput.value.value = ''
  nativeInput.value.click()
}

function clear() {
  if (actionsDisabled.value) return
  modelValue.value = props.multiple ? [] : null
  if (nativeInput.value) nativeInput.value.value = ''
  emit('clear')
}

function onNativeChange(event: Event) {
  const input = event.target as HTMLInputElement
  const result = policy.value.evaluate(input.files ?? [])

  for (const rejection of result.rejected) emit('reject', rejection)
  if (result.accepted.length === 0) return

  modelValue.value = props.multiple ? result.accepted : result.accepted[0]!
  emit('select', result.accepted)
}

defineExpose({ open, clear })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/file-input' as t;

.ui-file-input {
  $t: material-map(t.$tokens, 'md-file-input');

  &__actions {
    display: flex;
    align-items: center;
    gap: g($t, 'actions-gap');
  }

  &__selection {
    margin-top: g($t, 'selection-margin-top');
    color: g($t, 'selection-color');

    @include typescale(g($t, 'selection-typography'));
  }

  &__native {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
