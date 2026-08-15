<template>
  <div
    class="ui-otp-input"
    :class="{ 'ui-otp-input--focused': focused, 'ui-otp-input--error': error || errorMessage }"
  >
    <label
      :id="labelId"
      :for="inputId"
      class="ui-otp-input__label"
    >{{ label }}</label>
    <div class="ui-otp-input__visual">
      <OtpGroup
        v-for="(range, groupIndex) in ranges"
        :key="`${range.start}-${range.end}`"
      >
        <slot
          name="group"
          :start="range.start"
          :end="range.end"
          :index="groupIndex"
          :complete="model.length === safeLength"
        >
          <OtpField
            v-for="index in indexes(range)"
            :key="index"
            :index="index"
            :character="model[index] ?? ''"
            :active="focused && activeIndex === index"
            :error="error || Boolean(errorMessage)"
            :disabled="disabled"
            :readonly="readonly"
            :masked="Boolean(mask)"
            :mask-character="typeof mask === 'string' ? mask : '•'"
            @select="focusAt"
          >
            <template #default="state">
              <slot
                name="field"
                v-bind="state"
              >
                <slot
                  v-if="state.filled && mask"
                  name="mask"
                  v-bind="state"
                >
                  {{ typeof mask === 'string' ? mask : '•' }}
                </slot>
                <template v-else>
                  {{ state.character }}
                </template>
              </slot>
            </template>
          </OtpField>
        </slot>
        <OtpSeparator
          v-if="groupIndex < ranges.length - 1"
          :value="separator"
        >
          <slot
            v-if="$slots.separator"
            name="separator"
            :index="groupIndex"
          />
          <template v-else>
            {{ separator }}
          </template>
        </OtpSeparator>
      </OtpGroup>
      <input
        :id="inputId"
        ref="input"
        class="ui-otp-input__native"
        :value="model"
        :name="name ?? path"
        :disabled="disabled"
        :readonly="readonly"
        :autofocus="autofocus"
        :inputmode="mode === 'numeric' ? 'numeric' : 'text'"
        autocomplete="one-time-code"
        :maxlength="safeLength"
        :aria-labelledby="labelId"
        :aria-invalid="error || Boolean(errorMessage)"
        :aria-describedby="errorMessage ? messageId : undefined"
        @focus="focused = true"
        @blur="focused = false"
        @input="onInput"
        @click="syncCaret"
        @keyup="syncCaret"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
      >
    </div>
    <p
      v-if="errorMessage"
      :id="messageId"
      class="ui-otp-input__message"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import OtpField from '~/components/fragments/otp-input/Field.vue'
import OtpGroup from '~/components/fragments/otp-input/Group.vue'
import OtpSeparator from '~/components/fragments/otp-input/Separator.vue'
import { mOtpInputProps } from './props'

const props = defineProps(mOtpInputProps)
const model = defineModel<string>({ default: '' })
const focused = defineModel<boolean>('focused', { default: false })
const emit = defineEmits<{
  (event: 'complete', value: string): void
  (event: 'invalid', input: string, rejected: string[]): void
  (event: 'clear'): void
}>()

const input = ref<HTMLInputElement>()
const composing = ref(false)
const activeIndex = ref(0)
const inputId = useId()
const labelId = `${inputId}-label`
const messageId = `${inputId}-message`
const safeLength = computed(() => Math.max(1, Math.floor(props.length)))
const ranges = computed(() => {
  const valid = props.groups.filter(size => Number.isInteger(size) && size > 0)
  if (!valid.length || valid.reduce((sum, size) => sum + size, 0) !== safeLength.value) {
    return [{ start: 0, end: safeLength.value }]
  }
  let start = 0
  return valid.map((size) => {
    const range = { start, end: start + size }
    start += size
    return range
  })
})

const indexes = (range: { start: number, end: number }) => Array.from(
  { length: range.end - range.start },
  (_, offset) => range.start + offset,
)

function sanitize(raw: string) {
  const normalized = raw.normalize('NFKC')
    .replace(/[\u0660-\u0669]/g, char => String(char.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, char => String(char.charCodeAt(0) - 0x06F0))
  const allowed = props.mode === 'numeric' ? /\d/ : /[0-9a-z]/i
  const chars = Array.from(normalized)
  const rejected = chars.filter(char => !allowed.test(char))
  return { value: chars.filter(char => allowed.test(char)).join('').slice(0, safeLength.value), rejected }
}

function applyInput(target: HTMLInputElement) {
  const previousLength = model.value.length
  const raw = target.value
  const result = sanitize(raw)
  model.value = result.value
  target.value = result.value
  activeIndex.value = Math.min(target.selectionStart ?? result.value.length, safeLength.value - 1)
  if (result.rejected.length) emit('invalid', raw, result.rejected)
  if (previousLength < safeLength.value && result.value.length === safeLength.value) emit('complete', result.value)
  if (previousLength > 0 && result.value.length === 0) emit('clear')
}

function onInput(event: Event) {
  if (!composing.value) applyInput(event.target as HTMLInputElement)
}

function onCompositionEnd(event: CompositionEvent) {
  composing.value = false
  applyInput(event.target as HTMLInputElement)
}

function syncCaret() {
  activeIndex.value = Math.min(input.value?.selectionStart ?? model.value.length, safeLength.value - 1)
}

function focusAt(index: number) {
  if (props.disabled) return
  input.value?.focus()
  input.value?.setSelectionRange(index, index)
  activeIndex.value = index
}

watch(safeLength, (length) => {
  if (model.value.length > length) model.value = model.value.slice(0, length)
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/otp-input' as t;

.ui-otp-input {
  $t: material-map(t.$tokens, 'md-otp-input');

  display: inline-flex;
  flex-direction: column;

  &__label {
    margin-bottom: g($t, 'root-gap');
  }

  &__visual {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: g($t, 'root-gap');
  }

  &__group {
    display: inline-flex;
    gap: g($t, 'group-gap');
  }

  &__field {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'field-size');
    height: g($t, 'field-size');
    border: 1rem solid g($t, 'field-outline');
    border-radius: g($t, 'field-shape');
    color: g($t, 'field-color');
    cursor: text;

    @include typescale(g($t, 'field-typography'));

    &--filled {
      background: g($t, 'field-filled-container');
    }

    &--active {
      border-width: g($t, 'field-active-width');
      border-color: g($t, 'field-active-outline');
    }

    &--error {
      border-color: g($t, 'field-error-outline');
    }

    &--disabled {
      opacity: g($t, 'field-disabled-opacity');
      cursor: default;
    }
  }

  &__separator {
    color: g($t, 'separator-color');
  }

  &__native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: text;
  }

  &__message {
    margin: g($t, 'message-margin-top') 0 0;
    color: g($t, 'message-color');

    @include typescale(g($t, 'message-typography'));
  }
}
</style>
