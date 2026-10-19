<template>
  <div
    ref="canvasRef"
    class="ui-color-canvas"
    :class="{
      'ui-color-canvas--focused': focusedAxis !== null,
      'ui-color-canvas--locked': ctx.locked.value,
    }"
    :style="{ backgroundColor: hueCss }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="ui-color-canvas__saturation" />
    <div class="ui-color-canvas__value" />
    <div
      class="ui-color-canvas__thumb"
      :style="thumbStyle"
    />

    <!-- One slider per axis: a 2-D field cannot be one honest `slider`, and
         two of them read each value out on its own (APG). Visually hidden;
         the thumb above shows their focus. -->
    <span
      v-for="axis in axes"
      :key="axis.name"
      class="ui-color-canvas__axis"
      role="slider"
      :tabindex="ctx.disabled.value ? -1 : 0"
      :aria-label="axis.label"
      :aria-orientation="axis.orientation"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="axis.value"
      :aria-valuetext="`${axis.value}%`"
      :aria-disabled="ctx.disabled.value || undefined"
      :aria-readonly="ctx.readonly.value || undefined"
      @focus="onAxisFocus(axis.name, $event)"
      @blur="focusedAxis = null"
      @keydown="axis.onKeydown"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Private saturation × brightness field of `MColorPicker`. Reads and writes
 * only the shared context. The pointer drags absolutely from the press point,
 * with the pointer captured for the drag alone; the keyboard drives the two
 * axis sliders.
 */
import { useColorPickerContext } from '#kit/utils/color-picker/context'
import { createRangeKeyboardController } from '#kit/composables/slider/createRangeKeyboardController'
import { hsvaToRgba, toCssColor } from '#kit/shared/utils/color'

type Axis = 'saturation' | 'brightness'

const ctx = useColorPickerContext()
const canvasRef = ref<HTMLElement | null>(null)
const focusedAxis = ref<Axis | null>(null)
const dragging = ref(false)
// Measured once per drag, not on every move: the box and the writing direction.
let rect: DOMRect | null = null
let rtl = false

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const percent = (value: number) => Math.round(value * 100)

const hueCss = computed(() => toCssColor(hsvaToRgba({ h: ctx.hsva.value.h, s: 1, v: 1, a: 1 })))

const thumbStyle = computed(() => ({
  insetInlineStart: `${ctx.hsva.value.s * 100}%`,
  top: `${(1 - ctx.hsva.value.v) * 100}%`,
}))

const isRtl = () => canvasRef.value ? getComputedStyle(canvasRef.value).direction === 'rtl' : false

function axisController(read: () => number, write: (value: number) => void) {
  return createRangeKeyboardController({
    min: () => 0,
    max: () => 100,
    step: () => 1,
    getValue: () => percent(read()),
    setValue: value => write(value / 100),
    rtl: isRtl,
  })
}

const saturation = axisController(() => ctx.hsva.value.s, value => ctx.setSaturation(value))
const brightness = axisController(() => ctx.hsva.value.v, value => ctx.setValue(value))

// The field shows an axis's focus the way a native control would: from the
// keyboard, not after a pointer opened the picker and moved the focus in.
function onAxisFocus(axis: Axis, event: FocusEvent) {
  focusedAxis.value = (event.target as Element).matches(':focus-visible') ? axis : null
}

function keydownFor(axis: Axis, controller: ReturnType<typeof axisController>) {
  return (event: KeyboardEvent) => {
    focusedAxis.value = axis
    if (ctx.locked.value) return
    if (controller.onKeydown(event)) ctx.commit('keyboard')
  }
}

const axes = computed(() => [
  {
    name: 'saturation' as const,
    label: ctx.messages.value.saturation,
    orientation: 'horizontal' as const,
    value: percent(ctx.hsva.value.s),
    onKeydown: keydownFor('saturation', saturation),
  },
  {
    name: 'brightness' as const,
    label: ctx.messages.value.brightness,
    orientation: 'vertical' as const,
    value: percent(ctx.hsva.value.v),
    onKeydown: keydownFor('brightness', brightness),
  },
])

function setFromPoint(clientX: number, clientY: number) {
  if (!rect) return
  const x = clamp((clientX - rect.left) / rect.width, 0, 1)
  const s = rtl ? 1 - x : x
  const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
  ctx.setHSVA({ ...ctx.hsva.value, s, v })
}

function onPointerDown(event: PointerEvent) {
  const el = canvasRef.value
  if (ctx.locked.value || !el || event.button !== 0) return

  dragging.value = true
  rect = el.getBoundingClientRect()
  rtl = isRtl()
  // Captured to the field for the drag only: no listener on the window
  // outlives it.
  el.setPointerCapture?.(event.pointerId)
  setFromPoint(event.clientX, event.clientY)
}

function onPointerMove(event: PointerEvent) {
  if (dragging.value) setFromPoint(event.clientX, event.clientY)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  rect = null
  canvasRef.value?.releasePointerCapture?.(event.pointerId)
  ctx.commit('pointer')
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-canvas {
  $t: material-map(t.$tokens, 'm-color-picker');

  position: relative;
  width: 100%;
  height: g($t, 'canvas.height');
  border-radius: g($t, 'canvas.radius');
  cursor: crosshair;
  touch-action: none;

  // The axis sliders are hidden, so the field shows their focus.
  &--focused {
    @include focus-ring;
  }

  &--locked {
    cursor: default;
  }

  &__saturation,
  &__value {
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  // Saturation grows toward the inline end, so the white edge is the start.
  @each $dir, $side in (ltr: right, rtl: left) {
    &__saturation:dir(#{$dir}) {
      background: linear-gradient(to #{$side}, #{g($t, 'canvas.saturation-color')}, transparent);
    }
  }

  &__value {
    background: linear-gradient(to top, #{g($t, 'canvas.value-color')}, transparent);
  }

  &__thumb {
    position: absolute;
    width: g($t, 'canvas.thumb.size');
    height: g($t, 'canvas.thumb.size');
    border: g($t, 'canvas.thumb.border-width') solid g($t, 'canvas.thumb.border');
    border-radius: g($t, 'canvas.thumb.shape');
    box-shadow: g($t, 'canvas.thumb.shadow');
    transform: translate(-50%, -50%);
    pointer-events: none;

    &:dir(rtl) {
      transform: translate(50%, -50%);
    }

    // Forcing drops the fill the thumb is told apart by; an edge stays.
    @include forced-colors {
      border-color: CanvasText;
    }
  }

  &__axis {
    @include sr-only;
  }
}
</style>
