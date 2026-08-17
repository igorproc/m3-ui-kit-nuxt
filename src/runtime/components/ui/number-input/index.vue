<template>
  <FieldRoot
    class-prefix="ui-number-input"
    :field-id="fieldId"
    :variant="variant"
    :label="label"
    :focused="focusedModel"
    :populated="draft !== ''"
    :error="isError"
    :disabled="disabled"
    :message="displayMessage"
    :message-id="messageId"
  >
    <input
      :id="fieldId"
      v-model="draft"
      class="ui-field__input ui-number-input__input"
      type="text"
      :inputmode="inputMode"
      :name="name ?? path"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      role="spinbutton"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue ?? undefined"
      :aria-valuetext="modelValue === null ? undefined : codec.format(modelValue)"
      :aria-invalid="!field.meta.valid || isError"
      :aria-describedby="describedBy"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
      @keydown="onKeydown"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
    >

    <template
      v-if="controls === 'split' || $slots.prepend"
      #prepend
    >
      <slot name="prepend" />
      <slot
        v-if="controls === 'split'"
        name="decrement"
        :props="decrementButtonProps"
        :value="modelValue"
        :next-value="nextDecrement"
        :step="decrement"
      >
        <MButtonIcon
          v-bind="decrementButtonProps"
          @click="decrement"
        >
          <MIcon name="round-remove" />
        </MButtonIcon>
      </slot>
    </template>

    <template
      v-if="controls !== false || $slots.append"
      #append
    >
      <slot
        v-if="controls === 'split'"
        name="increment"
        :props="incrementButtonProps"
        :value="modelValue"
        :next-value="nextIncrement"
        :step="increment"
      >
        <MButtonIcon
          v-bind="incrementButtonProps"
          @click="increment"
        >
          <MIcon name="round-add" />
        </MButtonIcon>
      </slot>
      <span
        v-else-if="controls === 'stacked'"
        class="ui-number-input__stacked"
      >
        <slot
          name="increment"
          :props="incrementButtonProps"
          :value="modelValue"
          :next-value="nextIncrement"
          :step="increment"
        >
          <MButtonIcon
            v-bind="incrementButtonProps"
            @click="increment"
          ><MIcon name="round-keyboard-arrow-up" /></MButtonIcon>
        </slot>
        <slot
          name="decrement"
          :props="decrementButtonProps"
          :value="modelValue"
          :next-value="nextDecrement"
          :step="decrement"
        >
          <MButtonIcon
            v-bind="decrementButtonProps"
            @click="decrement"
          ><MIcon name="round-keyboard-arrow-down" /></MButtonIcon>
        </slot>
      </span>
      <slot name="append" />
    </template>
  </FieldRoot>
</template>

<script setup lang="ts">
import FieldRoot from '#kit/components/fragments/field/root.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { useField } from '#kit/composables/useField'
import { mNumberInputProps } from './props'
import {
  clampNumber,
  createNumberCodec,
  precisionFromStep,
  roundDecimal,
} from '#kit/shared/utils/number'
import type { NumberInputInvalidReason } from '#kit/shared/utils/number'

const props = defineProps(mNumberInputProps)
const modelValue = defineModel<number | null>({ default: null })
const focusedModel = defineModel<boolean>('focused', { default: false })

const emit = defineEmits<{
  (event: 'increment' | 'decrement', value: number): void
  (event: 'invalid', draft: string, reason: NumberInputInvalidReason): void
}>()

const fieldId = useId()
const field = useField({ path: props.path, model: modelValue })
const composing = ref(false)
const dirty = ref(false)
const safeStep = computed(() => props.step > 0 ? props.step : 1)
const resolvedPrecision = computed(() => props.precision ?? precisionFromStep(safeStep.value))
const codec = computed(() => createNumberCodec({
  locale: props.locale,
  useGrouping: props.useGrouping,
  precision: resolvedPrecision.value,
}))
const draft = ref(codec.value.format(modelValue.value))
const isError = computed(() => props.error || Boolean(props.errorMessage) || field.hasError.value)
const displayMessage = computed(() => field.errorMessage.value || props.errorMessage || props.helperText)
const messageId = computed(() => isError.value ? `${fieldId}-error` : `${fieldId}-helper`)
const describedBy = computed(() => displayMessage.value ? messageId.value : undefined)
const inputMode = computed(() => resolvedPrecision.value > 0 ? 'decimal' : 'numeric')

const nextDecrement = computed(() => stepValue(-1))
const nextIncrement = computed(() => stepValue(1))
const currentValue = computed(() => modelValue.value ?? props.min ?? 0)
const decrementDisabled = computed(() => props.disabled || props.readonly
  || (props.min !== undefined && currentValue.value <= props.min))
const incrementDisabled = computed(() => props.disabled || props.readonly
  || (props.max !== undefined && currentValue.value >= props.max))
const decrementButtonProps = computed(() => ({
  type: 'button' as const,
  disabled: decrementDisabled.value,
  ariaLabel: 'Decrease value',
}))
const incrementButtonProps = computed(() => ({
  type: 'button' as const,
  disabled: incrementDisabled.value,
  ariaLabel: 'Increase value',
}))

function normalize(value: number, clamp = props.clamp) {
  const rounded = roundDecimal(value, resolvedPrecision.value)
  return clamp ? clampNumber(rounded, props.min, props.max) : rounded
}

function stepValue(direction: -1 | 1, multiplier = 1) {
  return normalize(currentValue.value + direction * safeStep.value * multiplier, true)
}

function applyStep(direction: -1 | 1, multiplier = 1) {
  if (props.disabled || props.readonly) return
  const next = stepValue(direction, multiplier)
  modelValue.value = next
  draft.value = codec.value.format(next, focusedModel.value ? 'edit' : 'display')
  dirty.value = false
  emit(direction > 0 ? 'increment' : 'decrement', next)
}

function decrement() {
  applyStep(-1)
}

function increment() {
  applyStep(1)
}

function onFocus() {
  focusedModel.value = true
  draft.value = codec.value.format(modelValue.value, 'edit')
  dirty.value = false
}

function onBlur() {
  commit(true)
  focusedModel.value = false
}

function onInput() {
  dirty.value = true
  if (composing.value) return
  const parsed = codec.value.parse(draft.value)
  if (parsed.ok) modelValue.value = normalize(parsed.value, false)
}

function onCompositionEnd() {
  composing.value = false
  onInput()
}

function commit(display = false) {
  const parsed = codec.value.parse(draft.value)

  if (!parsed.ok && parsed.reason === 'empty') {
    modelValue.value = null
    draft.value = ''
    dirty.value = false
    return
  }

  if (!parsed.ok) {
    emit('invalid', draft.value, parsed.reason)
    restore(display)
    return
  }

  const next = normalize(parsed.value)
  modelValue.value = next
  draft.value = codec.value.format(next, display ? 'display' : 'edit')
  dirty.value = false
}

function restore(display = false) {
  draft.value = codec.value.format(modelValue.value, display ? 'display' : 'edit')
  dirty.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (composing.value) return

  const actions: Partial<Record<string, () => void>> = {
    ArrowUp: () => applyStep(1),
    ArrowDown: () => applyStep(-1),
    PageUp: () => applyStep(1, 10),
    PageDown: () => applyStep(-1, 10),
    Home: () => {
      if (props.min === undefined) return
      modelValue.value = props.min
      restore()
    },
    End: () => {
      if (props.max === undefined) return
      modelValue.value = props.max
      restore()
    },
    Enter: () => commit(),
    Escape: () => restore(),
  }

  const action = actions[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

watch(modelValue, (value) => {
  if (focusedModel.value && dirty.value) return
  draft.value = codec.value.format(value, focusedModel.value ? 'edit' : 'display')
})

watch(codec, () => restore(!focusedModel.value))

if (import.meta.dev) {
  watch(() => props.step, (step) => {
    if (!(step > 0)) console.warn('[m-number-input] step must be greater than zero')
  }, { immediate: true })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/number-input' as t;

.ui-number-input {
  $t: material-map(t.$tokens, 'md-number-input');

  &__input {
    min-width: 0;
  }

  .ui-field__icon--prepend,
  .ui-field__icon--append {
    gap: g($t, 'controls-gap');
  }

  &__stacked {
    display: inline-flex;
    flex-direction: column;
    gap: g($t, 'controls-stacked-gap');
  }
}
</style>
