<template>
  <div
    ref="canvasRef"
    class="ui-color-canvas"
    role="slider"
    aria-label="Saturation and brightness"
    :aria-valuetext="valueText"
    :aria-disabled="ctx.disabled.value || undefined"
    :tabindex="ctx.disabled.value ? -1 : 0"
    :style="{ backgroundColor: hueCss }"
    @pointerdown="onPointerDown"
    @keydown="onKeydown"
  >
    <div class="ui-color-canvas__saturation" />
    <div class="ui-color-canvas__value" />
    <div
      class="ui-color-canvas__thumb"
      :style="thumbStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useColorPickerContext } from '~/composables/color-picker/context'
import { useGlobalListener } from '~/composables/useGlobalListener'
import { hsvaToRgba, toCssColor } from '~~/shared/utils/color'

/** Private S/V leaf for MColorPicker. Reads/writes only the shared context. */
const ctx = useColorPickerContext()
const canvasRef = ref<HTMLElement | null>(null)
let dragging = false

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const hueCss = computed(() => toCssColor(hsvaToRgba({ h: ctx.hsva.value.h, s: 1, v: 1, a: 1 })))

const thumbStyle = computed(() => ({
  left: `${ctx.hsva.value.s * 100}%`,
  top: `${(1 - ctx.hsva.value.v) * 100}%`,
}))

const valueText = computed(() => ctx.value.value ?? 'none')

function setFromPoint(clientX: number, clientY: number) {
  const el = canvasRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const s = clamp((clientX - rect.left) / rect.width, 0, 1)
  const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
  ctx.setHSVA({ ...ctx.hsva.value, s, v })
}

function onPointerDown(event: PointerEvent) {
  if (ctx.disabled.value) return
  dragging = true
  canvasRef.value?.focus()
  setFromPoint(event.clientX, event.clientY)
}

useGlobalListener('window', 'pointermove', (event) => {
  if (dragging) setFromPoint((event as PointerEvent).clientX, (event as PointerEvent).clientY)
})

useGlobalListener('window', 'pointerup', () => {
  if (!dragging) return
  dragging = false
  ctx.commit('pointer')
})

function onKeydown(event: KeyboardEvent) {
  if (ctx.disabled.value) return
  const step = event.shiftKey ? 0.1 : 0.02
  const { s, v } = ctx.hsva.value
  let handled = true
  switch (event.key) {
    case 'ArrowLeft':
      ctx.setSaturation(clamp(s - step, 0, 1))
      break
    case 'ArrowRight':
      ctx.setSaturation(clamp(s + step, 0, 1))
      break
    case 'ArrowUp':
      ctx.setValue(clamp(v + step, 0, 1))
      break
    case 'ArrowDown':
      ctx.setValue(clamp(v - step, 0, 1))
      break
    default:
      handled = false
  }
  if (handled) {
    event.preventDefault()
    ctx.commit('keyboard')
  }
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/color-picker/index' as t;

.ui-color-canvas {
  $t: material-map(t.$tokens, 'md-color-picker');

  position: relative;
  width: 100%;
  height: g($t, 'canvas-height');
  border-radius: g($t, 'canvas-radius');
  cursor: crosshair;
  touch-action: none;
  outline: none;
  overflow: hidden;

  &:focus-visible {
    outline: g($t, 'canvas-focus-width') solid g($t, 'canvas-focus-color');
    outline-offset: g($t, 'canvas-focus-offset');
  }

  &__saturation,
  &__value {
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &__saturation {
    background: linear-gradient(to right, #{g($t, 'canvas-saturation-color')}, transparent);
  }

  &__value {
    background: linear-gradient(to top, #{g($t, 'canvas-value-color')}, transparent);
  }

  &__thumb {
    position: absolute;
    width: g($t, 'canvas-thumb-size');
    height: g($t, 'canvas-thumb-size');
    border: g($t, 'canvas-thumb-border-width') solid g($t, 'canvas-thumb-border');
    border-radius: 50%;
    box-shadow: g($t, 'canvas-thumb-shadow');
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
}
</style>
