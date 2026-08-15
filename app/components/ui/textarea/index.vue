<template>
  <FieldRoot
    class-prefix="ui-textarea"
    :field-id="fieldId"
    :variant="variant"
    :label="label"
    :focused="focusedModel"
    :populated="!!modelValue"
    :error="isError"
    :disabled="disabled"
    :message="displayMessage"
    :message-id="messageId"
  >
    <textarea
      :id="fieldId"
      ref="textarea"
      v-model="modelValue"
      class="ui-field__input ui-textarea__input"
      :class="resizeClass"
      :name="name ?? path"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      :wrap="wrap"
      :aria-invalid="!meta.valid || isError"
      :aria-describedby="describedBy"
      @focus="onFocus"
      @blur="onBlur"
    />

    <template
      v-if="$slots.prepend"
      #prepend
    >
      <slot name="prepend" />
    </template>

    <template
      v-if="$slots.append"
      #append
    >
      <slot name="append" />
    </template>

    <template
      v-if="$slots.helper"
      #helper="scope"
    >
      <slot
        name="helper"
        v-bind="scope"
      />
    </template>

    <template
      v-if="$slots.error"
      #error="scope"
    >
      <slot
        name="error"
        v-bind="scope"
      />
    </template>

    <template
      v-if="showCounter"
      #supporting
    >
      <div
        :id="counterId"
        class="ui-textarea__counter"
      >
        <slot
          name="counter"
          :length="modelValue.length"
          :maxlength="counterLimit"
          :remaining="remaining"
        >
          {{ counterText }}
        </slot>
      </div>
    </template>
  </FieldRoot>
</template>

<script setup lang="ts">
import FieldRoot from '~/components/fragments/field/root.vue'
import { mTextareaProps } from './props'

const props = defineProps(mTextareaProps)

const modelValue = defineModel<string>({ default: '' })
const focusedModel = defineModel<boolean>('focused', { default: false })
const fieldId = useId()
const textarea = ref<HTMLTextAreaElement>()

const { errorMessage, isError, meta, onFocus, onBlur } = useTextField({
  path: props.path,
  model: modelValue,
  focused: focusedModel,
  error: () => props.error,
  externalError: () => props.errorMessage,
})

const displayMessage = computed(() => errorMessage.value || props.helperText)
const messageId = computed(() => isError.value ? `${fieldId}-error` : `${fieldId}-helper`)
const counterId = `${fieldId}-counter`
const showCounter = computed(() => props.counter !== false)
const counterLimit = computed(() => typeof props.counter === 'number' ? props.counter : props.maxlength)
const remaining = computed(() => counterLimit.value === undefined ? undefined : counterLimit.value - modelValue.value.length)
const counterText = computed(() => counterLimit.value === undefined
  ? String(modelValue.value.length)
  : `${modelValue.value.length} / ${counterLimit.value}`)
const describedBy = computed(() => [
  displayMessage.value ? messageId.value : undefined,
  showCounter.value ? counterId : undefined,
].filter(Boolean).join(' ') || undefined)
const resizeClass = computed(() => `ui-textarea__input--resize-${props.autoGrow ? 'none' : (props.resize ?? 'none')}`)

function resizeTextarea() {
  if (!props.autoGrow || !textarea.value || !import.meta.client) return

  const element = textarea.value
  const style = window.getComputedStyle(element)
  const numericStyle = (value: string) => Number.parseFloat(value) || 0
  const lineHeight = numericStyle(style.lineHeight) || 20
  const chrome = numericStyle(style.paddingTop)
    + numericStyle(style.paddingBottom)
    + numericStyle(style.borderTopWidth)
    + numericStyle(style.borderBottomWidth)
  const minHeight = lineHeight * Math.max(props.rows, 1) + chrome
  const maxHeight = props.maxRows === undefined
    ? Number.POSITIVE_INFINITY
    : lineHeight * Math.max(props.maxRows, props.rows) + chrome

  element.style.height = 'auto'
  const contentHeight = Math.max(element.scrollHeight, minHeight)
  element.style.height = `${Math.min(contentHeight, maxHeight)}px`
  element.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'
}

watch(
  () => [modelValue.value, props.rows, props.maxRows, props.autoGrow],
  () => nextTick(resizeTextarea),
  { immediate: true },
)

if (import.meta.dev) {
  watch(
    () => [props.autoGrow, props.resize, props.rows, props.maxRows] as const,
    ([autoGrow, resize, rows, maxRows]) => {
      if (autoGrow && resize) {
        console.warn('[m-textarea] resize is ignored while autoGrow is enabled')
      }
      if (rows < 1 || (maxRows !== undefined && maxRows < rows)) {
        console.warn('[m-textarea] rows must be >= 1 and maxRows must be >= rows')
      }
    },
    { immediate: true },
  )
}

useWindowEventListener('resize', resizeTextarea, { passive: true })
onMounted(resizeTextarea)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/textarea' as t;

.ui-textarea {
  $t: material-map(t.$tokens, 'md-textarea');

  .ui-field__control {
    align-items: stretch;
    min-height: g($t, 'container-min-height');
  }

  &__input {
    min-height: g($t, 'input-min-height');
    padding-block: g($t, 'input-padding-block');
    line-height: g($t, 'input-line-height');
    field-sizing: content;

    &--resize-none {
      resize: g($t, 'input-resize-none');
    }

    &--resize-vertical {
      resize: g($t, 'input-resize-vertical');
    }

    &--resize-horizontal {
      resize: g($t, 'input-resize-horizontal');
    }

    &--resize-both {
      resize: g($t, 'input-resize-both');
    }
  }

  &__counter {
    flex: 0 0 auto;
    padding-inline: g($t, 'counter-padding-inline');
    margin-top: g($t, 'counter-margin-top');
    color: g($t, 'counter-color');

    @include typescale(g($t, 'counter-typography'));
  }
}
</style>
