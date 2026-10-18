<template>
  <MTextField
    v-model="draft"
    v-model:focused="focused"
    class="ui-color-input"
    :label="label"
    :placeholder="placeholder"
    :helper-text="helperText"
    :variant="variant"
    :shape="shape"
    :label-placement="labelPlacement"
    :density="density"
    :name="name"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :autofocus="autofocus"
    :error="error || invalid"
    :error-message="displayError"
    :path="path"
    autocomplete="off"
    :input-attrs="colorInputAttrs"
    @keydown.enter.prevent="commitDraft"
    @keydown.esc="onEscape"
  >
    <template #append>
      <span class="ui-color-input__trigger-wrap">
        <MButtonIcon
          ref="trigger"
          type="button"
          class="ui-color-input__trigger"
          :disabled="disabled || readonly"
          aria-haspopup="dialog"
          :aria-expanded="open"
          :aria-label="pickerLabel"
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
          :origin="origin"
        >
          <!-- The picker is a set of controls, not a menu: its arrows, Home and
               End belong to its sliders and fields, so they stop here instead
               of reaching the menu's item navigation. -->
          <div
            class="ui-color-input__picker"
            @keydown="isolateKeys"
          >
            <MColorPicker
              v-model="pickerModel"
              v-model:format="pickerFormat"
              :formats="formats"
              :swatches="swatches"
              :disabled="disabled"
              :label="pickerLabel"
              :messages="pickerMessages"
              @change="onPickerChange"
            />
          </div>
        </MMenu>
      </span>
    </template>
  </MTextField>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import type { UiMenuOrigin } from '#kit/components/ui/menu/types'
import MColorPicker from '#kit/components/ui/color-picker/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import { formatColor, parseColor, toCssColor } from '#kit/shared/utils/color'
import type { ColorFormat, ColorParseError } from '#kit/shared/utils/color'
import { mColorInputProps } from './props'
import { useFieldShape } from '#kit/components/ui/text-field/useFieldShape'

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

const shape = useFieldShape('m-color-input', props)
const displayError = computed(() => props.errorMessage ?? (invalid.value ? props.formatHint : undefined))
const colorInputAttrs = {
  spellcheck: false,
  autocapitalize: 'none',
}

if (import.meta.dev && props.picker && !props.pickerLabel) {
  console.warn('[m-color-input] the swatch button has no accessible name: pass `picker-label`.')
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

// Escape rolls an edit back; with nothing to roll back it belongs to whatever
// is around the field — a dialog closing on it, for one.
function onEscape(event: KeyboardEvent) {
  if (draft.value === displayValue.value && !invalid.value) return
  event.preventDefault()
  revertDraft()
}

const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'])

function isolateKeys(event: KeyboardEvent) {
  if (NAVIGATION_KEYS.has(event.key)) event.stopPropagation()
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

const trigger = ref<{ $el: HTMLElement } | null>(null)
const origin = ref<UiMenuOrigin>('bottom right')

function togglePicker() {
  if (props.disabled || props.readonly || !props.picker) return
  // The trigger stands at the inline end, so the panel hangs from that edge;
  // placement is physical, so the side is read from the direction at open time.
  const el = trigger.value?.$el
  if (!open.value && el) origin.value = getComputedStyle(el).direction === 'rtl' ? 'bottom left' : 'bottom right'
  open.value = !open.value
}

watch(open, (isOpen) => {
  emit(isOpen ? 'open' : 'close')
  if (isOpen) return

  // Closing returns focus to the swatch button that opened the picker — not to
  // the wrapper the menu falls back to, and not to the page.
  nextTick(() => {
    const el = trigger.value?.$el
    const active = document.activeElement
    if (el && (!active || active === document.body || el.parentElement?.contains(active))) el.focus()
  })
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-input' as t;

.ui-color-input {
  $t: material-map(t.$tokens, 'm-color-input');

  &__trigger-wrap {
    position: relative;
    display: inline-flex;
  }

  &__trigger {
    padding: g($t, 'trigger.padding');
  }

  &__swatch {
    display: block;
    width: g($t, 'swatch.size');
    height: g($t, 'swatch.size');
    border-radius: g($t, 'swatch.shape');
    border: g($t, 'swatch.outline-width') solid g($t, 'swatch.outline');
    background:
      linear-gradient(var(--swatch-color), var(--swatch-color)),
      conic-gradient(g($t, 'checker.a') 0 25%, g($t, 'checker.b') 0 50%, g($t, 'checker.a') 0 75%, g($t, 'checker.b') 0) 0 0 / #{g($t, 'checker.size')} #{g($t, 'checker.size')};

    // The swatch is the value itself: forcing would paint every colour Canvas.
    // Its edge takes the system text colour, so it stays visible.
    @include forced-colors {
      border-color: CanvasText;
      forced-color-adjust: none;
    }
  }

  &__picker {
    display: contents;
  }
}
</style>
