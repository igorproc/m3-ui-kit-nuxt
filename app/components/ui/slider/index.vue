<template>
  <SliderRoot
    :orientation="orientation"
    :is-dragging="draggingIndex !== null"
    :disabled="disabled"
    :readonly="readonly"
    class="ui-slider"
  >
    <label
      v-if="label"
      class="ui-slider__label"
    >
      {{ label }}
    </label>

    <div class="ui-slider__wrapper">
      <div class="ui-slider__container">
        <SliderTrack
          ref="trackComponent"
          :discrete="discrete"
          :tick-count="tickCount"
          :disabled="disabled"
          :readonly="readonly"
          orientation="horizontal"
          @pointerdown="onTrackPointerdown"
        >
          <SliderRange
            :start="activeRange.start"
            :end="activeRange.end"
            :discrete="discrete"
            :tick-count="tickCount"
            :disabled="disabled"
            :readonly="readonly"
            orientation="horizontal"
          />

          <SliderThumb
            v-for="(val, idx) in values"
            :key="idx"
            :value="val"
            :pct="percentages[idx] ?? 0"
            :show-value="showValue"
            :disabled="disabled"
            :readonly="readonly"
            orientation="horizontal"
            :aria-orientation="orientation"
            :is-dragging="draggingIndex === idx"
            :value-min="idx > 0 ? (values[idx - 1] ?? min) : min"
            :value-max="idx < values.length - 1 ? (values[idx + 1] ?? max) : max"
            :aria-label="range ? (idx === 0 ? (ariaLabelStart || `${label || ''} start`.trim()) : (ariaLabelEnd || `${label || ''} end`.trim())) : (ariaLabelEnd || label)"
            :class="idx === 0 && range ? 'ui-slider-thumb--start' : 'ui-slider-thumb--end'"
            @pointerdown="(e, thumbEl) => onThumbPointerdown(idx, e, thumbEl)"
            @keydown="e => onThumbKeydown(idx, e)"
          />
        </SliderTrack>
      </div>
    </div>

    <template v-if="name">
      <SliderHiddenInput
        v-for="(val, idx) in values"
        :key="`input-${idx}`"
        :value="val"
        :name="name"
        :disabled="disabled"
      />
    </template>
  </SliderRoot>
</template>

<script setup lang="ts">
import SliderRoot from './root/index.vue'
import SliderTrack from './track/index.vue'
import SliderRange from './range/index.vue'
import SliderThumb from './thumb/index.vue'
import SliderHiddenInput from './hidden-input/index.vue'

interface Props {
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  discrete?: boolean
  range?: boolean
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  readonly?: boolean
  name?: string
  ariaLabelStart?: string
  ariaLabelEnd?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  showValue: false,
  discrete: false,
  range: false,
  orientation: 'horizontal',
  disabled: false,
  readonly: false,
  name: undefined,
  ariaLabelStart: '',
  ariaLabelEnd: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[]): void
  (e: 'change', value: number | number[]): void
}>()

const modelValue = defineModel<number | number[]>({ default: 0 })

// Instantiate pure state logic
const {
  values,
  percentages,
  activeRange,
  tickCount,
  fromPercent,
  updateValue,
  getNearestThumbIndex,
} = useSlider(modelValue, props, emit)

const trackComponent = ref<{ element: HTMLElement | null } | null>(null)
const draggingIndex = ref<number | null>(null)
const dragOffset = ref(0)
let isListening = false
let rafId: number | null = null

// --- DOM Pointer Logic ---
const getPercent = (e: PointerEvent): number => {
  const el = trackComponent.value?.element
  if (!el) {
    return 0
  }

  // Re-query rect to prevent jumps if the page scrolls or layout shifts during drag
  const rect = el.getBoundingClientRect()
  const isVertical = props.orientation === 'vertical'

  const rawPercent = isVertical
    ? ((rect.bottom - e.clientY + dragOffset.value) / rect.height) * 100
    : ((e.clientX - rect.left - dragOffset.value) / rect.width) * 100

  return Math.max(0, Math.min(100, rawPercent))
}

const onPointerMove = (e: PointerEvent) => {
  if (draggingIndex.value === null) {
    return
  }

  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(() => {
    const percent = getPercent(e)
    const targetValue = fromPercent(percent)

    updateValue(draggingIndex.value!, targetValue)
  })
}

const onPointerUp = () => {
  draggingIndex.value = null
  dragOffset.value = 0

  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  cleanupDragListeners()
}

const setupDragListeners = () => {
  if (isListening) {
    return
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerup', onPointerUp, { passive: true })
  isListening = true
}

const cleanupDragListeners = () => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)

  isListening = false
}

onScopeDispose(() => {
  cleanupDragListeners()
})

const onThumbPointerdown = (index: number, event: PointerEvent, thumbElement?: HTMLElement) => {
  if (props.disabled || props.readonly || event.button) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  if (thumbElement) {
    const rect = thumbElement.getBoundingClientRect()
    const isVertical = props.orientation === 'vertical'
    dragOffset.value = isVertical
      ? event.clientY - (rect.top + rect.height / 2)
      : event.clientX - (rect.left + rect.width / 2)
  } else {
    dragOffset.value = 0
  }

  draggingIndex.value = index
  setupDragListeners()
}

const onTrackPointerdown = (e: PointerEvent) => {
  if (props.disabled || props.readonly || e.button) {
    return
  }

  const el = trackComponent.value?.element
  if (!el) {
    return
  }

  const rect = el.getBoundingClientRect()
  const isVertical = props.orientation === 'vertical'

  const percent = isVertical
    ? ((rect.bottom - e.clientY) / rect.height) * 100
    : ((e.clientX - rect.left) / rect.width) * 100

  const value = fromPercent(percent)
  const targetIndex = getNearestThumbIndex(value)

  updateValue(targetIndex, value)
  onThumbPointerdown(targetIndex, e)
}

const onThumbKeydown = (index: number, e: KeyboardEvent) => {
  if (props.disabled || props.readonly) {
    return
  }

  const currentVal = values.value[index] ?? props.min
  const s = props.step || 1
  const multiplier = e.shiftKey ? 10 : 1
  const change = s * multiplier

  const actions: Record<string, () => void> = {
    ArrowRight: () => updateValue(index, currentVal + change),
    ArrowUp: () => updateValue(index, currentVal + change),
    ArrowLeft: () => updateValue(index, currentVal - change),
    ArrowDown: () => updateValue(index, currentVal - change),
    PageUp: () => updateValue(index, currentVal + s * 10),
    PageDown: () => updateValue(index, currentVal - s * 10),
    Home: () => updateValue(index, props.min),
    End: () => updateValue(index, props.max),
  }

  const action = actions[e.key]
  if (action) {
    e.preventDefault()
    action()
  }
}
</script>

<style lang="scss">
.ui-slider {
  // Presentational wrapper helper styles
  &__wrapper {
    position: relative;
    width: 100%;
  }

  &__container {
    position: relative;
    display: flex;
    align-items: center;
    height: 48rem; // Touch target size
    width: 100%;
    touch-action: none;
    user-select: none;
    box-sizing: border-box;
  }

  // Adjust for vertical orientation
  &.ui-slider-root--vertical {
    .ui-slider__wrapper {
      height: 200rem; // Default vertical height
      width: 48rem;
    }

    .ui-slider__container {
      width: 200rem;
      transform: rotate(-90deg) translate(-100%, 0);
      transform-origin: left top;
      margin: 0;
    }
  }
}
</style>
