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
          :orientation="orientation"
          @pointerdown="onTrackPointerdown"
        >
          <SliderRange
            :start="activeRange.start ?? 0"
            :end="activeRange.end ?? 0"
            :discrete="discrete"
            :tick-count="tickCount"
            :disabled="disabled"
            :readonly="readonly"
            :orientation="orientation"
          />

          <SliderThumb
            v-for="(val, idx) in values"
            :key="idx"
            :value="val"
            :pct="percentages[idx] ?? 0"
            :show-value="showValue"
            :disabled="disabled"
            :readonly="readonly"
            :orientation="orientation"
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
import SliderRoot from '#kit/components/fragments/slider/root/index.vue'
import SliderTrack from '#kit/components/fragments/slider/track/index.vue'
import SliderRange from '#kit/components/fragments/slider/range/index.vue'
import SliderThumb from '#kit/components/fragments/slider/thumb/index.vue'
import SliderHiddenInput from '#kit/components/fragments/slider/hidden-input/index.vue'
import { useDrag } from '#kit/composables/useDrag'
import type { DragState } from '#kit/composables/useDrag'
import { useGlobalListener } from '#kit/composables/useGlobalListener'
import { onScopeDispose } from 'vue'
import { mSliderProps } from './props'

const props = defineProps(mSliderProps)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[]): void
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
let rafId: number | null = null

// Track rect cached at drag start to avoid a forced reflow
// (`getBoundingClientRect`) on every pointermove frame. Refreshed only on
// scroll/resize while a drag is active (see `stopScroll`/`stopResize` below),
// so the "page scrolls mid-drag" case stays correct without per-frame layout.
let cachedRect: DOMRect | null = null
let stopScroll: (() => void) | null = null
let stopResize: (() => void) | null = null

const refreshRect = () => {
  const el = trackComponent.value?.element
  cachedRect = el ? el.getBoundingClientRect() : null
}

// --- DOM Pointer Logic ---
// `useDrag` owns the window-level move/up/cancel subscriptions (only active
// while dragging) and their cleanup. The pointerdown handlers below set the
// active thumb index and perform the immediate "click jump"; `useDrag` then
// drives the live drag via `onMove`/`onEnd`.
const percentFromRect = (rect: DOMRect, clientX: number, clientY: number): number => {
  const isVertical = props.orientation === 'vertical'

  const rawPercent = isVertical
    ? ((rect.bottom - clientY + dragOffset.value) / rect.height) * 100
    : ((clientX - rect.left - dragOffset.value) / rect.width) * 100

  return Math.max(0, Math.min(100, rawPercent))
}

// Begin tracking the live rect for a drag: cache it now, then keep it fresh on
// scroll/resize only. Idempotent — safe to call from both pointerdown paths.
const startRectTracking = () => {
  refreshRect()
  if (!stopScroll) {
    stopScroll = useGlobalListener('window', 'scroll', refreshRect, { passive: true, capture: true })
  }
  if (!stopResize) {
    stopResize = useGlobalListener('window', 'resize', refreshRect, { passive: true })
  }
}

const stopRectTracking = () => {
  stopScroll?.()
  stopResize?.()
  stopScroll = null
  stopResize = null
  cachedRect = null
}

const onDragMove = (state: DragState) => {
  if (draggingIndex.value === null || !cachedRect) {
    return
  }

  const { clientX, clientY } = state.event

  if (rafId) {
    return
  }

  rafId = requestAnimationFrame(() => {
    rafId = null

    if (draggingIndex.value === null || !cachedRect) {
      return
    }

    const percent = percentFromRect(cachedRect, clientX, clientY)
    updateValue(draggingIndex.value, fromPercent(percent))
  })
}

const onDragEnd = () => {
  draggingIndex.value = null
  dragOffset.value = 0

  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  stopRectTracking()
}

// Safety net: drop a pending rAF if the component unmounts mid-drag (the
// scroll/resize subscriptions self-clean via `useGlobalListener`'s scope hook).
onScopeDispose(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

// Bound to the track element: its pointerdown subscribes the window move/up
// listeners. `isDragging` only flips on the first move (threshold 0), so a pure
// click never triggers `onMove`/`onEnd` — the immediate jump is owned by the
// pointerdown handlers below.
useDrag(() => trackComponent.value?.element ?? null, {
  axis: () => (props.orientation === 'vertical' ? 'y' : 'x'),
  disabled: () => props.disabled || props.readonly,
  onMove: onDragMove,
  onEnd: onDragEnd,
})

const onThumbPointerdown = (index: number, event: PointerEvent, thumbElement?: HTMLElement) => {
  if (props.disabled || props.readonly || event.button) {
    return
  }

  event.preventDefault()

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
  startRectTracking()
}

const onTrackPointerdown = (e: PointerEvent) => {
  if (props.disabled || props.readonly || e.button) {
    return
  }

  // A thumb press bubbles here too; let `onThumbPointerdown` own it so we don't
  // re-jump the nearest thumb to the press location.
  const target = e.target as HTMLElement | null
  if (target?.closest('.ui-slider-thumb')) {
    return
  }

  const el = trackComponent.value?.element
  if (!el) {
    return
  }

  // Single rect read for the click-jump; `onThumbPointerdown` re-caches it for
  // the drag that follows (dragOffset is 0 here since there is no thumb press).
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

  // Vertical orientation: real axis-aligned geometry (no rotate hack), so
  // getBoundingClientRect() returns a correct upright rect for drag math.
  &.ui-slider-root--vertical {
    .ui-slider__wrapper {
      height: 200rem; // Default vertical height
      width: 48rem;
    }

    .ui-slider__container {
      width: 48rem;
      height: 100%;
    }
  }
}
</style>
