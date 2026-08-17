<template>
  <MTextField
    v-model="draft"
    v-model:focused="focused"
    class="ui-color-input"
    :label="label"
    :placeholder="placeholder"
    :helper-text="helperText"
    :variant="variant"
    :disabled="disabled"
    :readonly="readonly"
    :error="error || invalid"
    :error-message="errorMessage"
    :path="path"
    autocomplete="off"
    :input-attrs="colorInputAttrs"
    @keydown.enter.prevent="commitDraft"
    @keydown.esc.prevent="revertDraft"
  >
    <template #append>
      <span class="ui-color-input__trigger-wrap">
        <MButtonIcon
          type="button"
          class="ui-color-input__trigger"
          :disabled="disabled || readonly"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-label="`Open color picker${swatchLabel ? `, current ${swatchLabel}` : ''}`"
          @click="togglePicker"
        >
          <span
            class="ui-color-input__swatch"
            :style="{ '--swatch-color': swatchCss }"
          />
        </MButtonIcon>

        <MMenu
          v-if="picker"
          v-model="open"
          absolute
          origin="bottom right"
        >
          <div class="ui-color-input__picker">
            <MColorPicker
              v-model="pickerModel"
              v-model:format="pickerFormat"
              :formats="formats"
              :swatches="swatches"
              :disabled="disabled"
              @change="onPickerChange"
            />
          </div>
        </MMenu>
      </span>
    </template>
  </MTextField>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MColorPicker from '#kit/components/ui/color-picker/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import { formatColor, parseColor, toCssColor } from '#kit/shared/utils/color'
import type { ColorFormat, ColorParseError } from '#kit/shared/utils/color'
import { mColorInputProps } from './props'

const props = defineProps(mColorInputProps)

const model = defineModel<string | null>({ default: null })
const open = defineModel<boolean>('open', { default: false })
const focused = defineModel<boolean>('focused', { default: false })

const emit = defineEmits<{
  (event: 'invalid', draft: string, reason: ColorParseError): void
  (event: 'change', value: string | null): void
  (event: 'clear' | 'open' | 'close'): void
}>()

const draft = ref('')
const invalid = ref(false)
const detectedFormat = ref<ColorFormat>('hex')

const resolvedFormat = computed<ColorFormat>(() =>
  props.format === 'auto' ? detectedFormat.value : props.format,
)

const displayValue = computed(() => {
  const parsed = parseColor(model.value)
  return parsed.ok ? formatColor(parsed.rgba, resolvedFormat.value) : (model.value ?? '')
})

const swatchCss = computed(() => {
  const parsed = parseColor(model.value)
  return parsed.ok ? toCssColor(parsed.rgba) : 'transparent'
})

const swatchLabel = computed(() => model.value ?? '')
const colorInputAttrs = {
  spellcheck: false,
  autocapitalize: 'none',
}

// Keep the draft aligned with the committed value while the field is idle.
watch([() => model.value, resolvedFormat, focused], () => {
  if (!focused.value) draft.value = displayValue.value
}, { immediate: true })

// Blur commits (focused true → false).
watch(focused, (isFocused, wasFocused) => {
  if (wasFocused && !isFocused) commitDraft()
})

// `commit: 'input'` — update the model on every fully valid draft.
watch(draft, (value) => {
  if (props.commit !== 'input' || !focused.value) return
  const parsed = parseColor(value)
  if (parsed.ok) applyParsed(value)
})

function detectFamily(raw: string): ColorFormat | null {
  const value = raw.trim().toLowerCase()
  if (value.startsWith('hsl')) return value.startsWith('hsla') ? 'hsla' : 'hsl'
  if (value.startsWith('rgb')) return value.startsWith('rgba') ? 'rgba' : 'rgb'
  if (value.startsWith('#') || /^[0-9a-f]{3,8}$/.test(value)) {
    return value.replace('#', '').length === 8 || value.replace('#', '').length === 4 ? 'hexa' : 'hex'
  }
  return null
}

function applyParsed(raw: string) {
  if (props.format === 'auto') {
    const family = detectFamily(raw)
    if (family) detectedFormat.value = family
  }
  const parsed = parseColor(raw)
  if (!parsed.ok) return
  const formatted = formatColor(parsed.rgba, resolvedFormat.value)
  invalid.value = false
  if (model.value !== formatted) {
    model.value = formatted
    emit('change', formatted)
  }
}

function commitDraft() {
  const raw = draft.value.trim()

  if (raw === '') {
    if (props.clearable) {
      if (model.value !== null) {
        model.value = null
        emit('change', null)
      }
      emit('clear')
    } else {
      draft.value = displayValue.value
    }
    invalid.value = false
    return
  }

  const parsed = parseColor(raw)
  if (!parsed.ok) {
    invalid.value = true
    emit('invalid', draft.value, parsed.error)
    return
  }

  applyParsed(raw)
  draft.value = displayValue.value
}

function revertDraft() {
  draft.value = displayValue.value
  invalid.value = false
}

// Picker <-> field bridge.
const pickerModel = computed<string | null>({
  get: () => model.value,
  set: (value) => {
    model.value = value
  },
})

const pickerFormat = ref<ColorFormat>(resolvedFormat.value)
watch(resolvedFormat, (value) => {
  pickerFormat.value = value
})

function onPickerChange(value: string | null) {
  emit('change', value)
}

function togglePicker() {
  if (props.disabled || props.readonly || !props.picker) return
  open.value = !open.value
}

watch(open, (isOpen) => {
  emit(isOpen ? 'open' : 'close')
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-input' as t;

.ui-color-input {
  $t: material-map(t.$tokens, 'md-color-input');

  &__trigger-wrap {
    position: relative;
    display: inline-flex;
  }

  &__trigger {
    padding: g($t, 'trigger-padding');
  }

  &__swatch {
    display: block;
    width: g($t, 'swatch-size');
    height: g($t, 'swatch-size');
    border-radius: g($t, 'swatch-shape');
    box-shadow: inset 0 0 0 g($t, 'swatch-outline-width') g($t, 'swatch-outline');
    background:
      linear-gradient(var(--swatch-color), var(--swatch-color)),
      conic-gradient(g($t, 'checker-a') 0 25%, g($t, 'checker-b') 0 50%, g($t, 'checker-a') 0 75%, g($t, 'checker-b') 0) 0 0 / #{g($t, 'checker-size')} #{g($t, 'checker-size')};
  }

  &__picker {
    display: contents;
  }
}
</style>
