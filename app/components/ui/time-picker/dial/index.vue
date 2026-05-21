<template>
  <div class="ui-time-picker-dial" :class="[`ui-time-picker-dial--${layout}`]">
    <div class="ui-time-picker-dial__content">
      <div class="ui-time-picker-dial__left-panel">
        <div v-if="label || helperText" class="ui-time-picker-dial__title-area">
          <span v-if="label" class="ui-time-picker-dial__label">{{ label }}</span>
          <span v-if="helperText" class="ui-time-picker-dial__helper">{{ helperText }}</span>
        </div>

        <div class="ui-time-picker-dial__header">
          <m-time-picker-keyboard
            ref="keyboardRef"
            v-model="modelValue"
            :is24h="is24h"
            is-dial
          />
        </div>
      </div>

    <div
      ref="faceRef"
      class="ui-time-picker-dial__face"
      @mousedown="onPointerDown"
      @touchstart.passive="onPointerDown"
    >
      <div class="ui-time-picker-dial__center-dot"></div>

      <div
        class="ui-time-picker-dial__selector"
        :class="{ 'ui-time-picker-dial__selector--inner': isInnerRing }"
        :style="{ transform: `rotate(${selectorAngle}deg)` }"
      >
        <div class="ui-time-picker-dial__selector-knob"></div>
      </div>

      <div
        v-for="num in currentNumbers"
        :key="num.id"
        class="ui-time-picker-dial__number"
        :class="{ 'ui-time-picker-dial__number--active': num.value === activeValue }"
        :style="{ transform: `translate(-50%, -50%) rotate(${num.angle}deg) translateY(-${num.radius}) rotate(-${num.angle}deg)` }"
      >
        {{ num.display }}
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MTimePickerKeyboard from '../keyboard/index.vue'

interface Props {
  label?: string
  helperText?: string
  is24h?: boolean
  layout?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  is24h: true,
  layout: 'vertical',
})

const modelValue = defineModel<string>({ default: '' })
const keyboardRef = ref<InstanceType<typeof MTimePickerKeyboard> | null>(null)

const faceRef = ref<HTMLElement | null>(null)

const activeField = computed(() => keyboardRef.value?.activeField ?? 'hours')

const parsedTime = computed(() => {
  const [hStr, mStr] = (modelValue.value || '00:00').split(':')
  return {
    hours: Number.parseInt(hStr || '0', 10),
    minutes: Number.parseInt(mStr || '0', 10)
  }
})

const isInnerRing = computed(() => {
  if (activeField.value !== 'hours' || !props.is24h) return false
  const h = parsedTime.value.hours
  return h >= 12
})

const currentNumbers = computed(() => {
  const nums = []
  if (activeField.value === 'hours') {
    if (props.is24h) {
      // Outer ring: 0-11
      for (let i = 0; i < 12; i++) {
        nums.push({ id: `h-out-${i}`, value: i, display: i === 0 ? '00' : i.toString(), angle: i * 30, radius: `96rem` })
      }
      // Inner ring: 12-23
      for (let i = 12; i < 24; i++) {
        nums.push({ id: `h-in-${i}`, value: i, display: i.toString(), angle: (i - 12) * 30, radius: `56rem` })
      }
    } else {
      // 12h: 12, 1..11
      for (let i = 0; i < 12; i++) {
        let val = i === 0 ? 12 : i
        nums.push({ id: `h-${val}`, value: val, display: val.toString(), angle: i * 30, radius: `96rem` })
      }
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const min = i * 5
      nums.push({ id: `m-${min}`, value: min, display: min.toString().padStart(2, '0'), angle: i * 30, radius: `96rem` })
    }
  }
  return nums
})

const activeValue = computed(() => {
  if (activeField.value === 'hours') {
    let h = parsedTime.value.hours
    if (!props.is24h) {
      h = h % 12
      if (h === 0) h = 12
    }
    return h
  }
  return parsedTime.value.minutes
})

const selectorAngle = computed(() => {
  if (activeField.value === 'hours') {
    return (activeValue.value % 12) * 30
  }
  return activeValue.value * 6
})

// Drag and drop logic
let isDragging = false

function updateTimeFromEvent(e: MouseEvent | TouchEvent) {
  if (!faceRef.value || !keyboardRef.value) return
  
  const rect = faceRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = clientX - cx
  const dy = clientY - cy

  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
  if (angle < 0) angle += 360

  const distance = Math.hypot(dx, dy)
  const isInner = props.is24h && distance < (rect.width / 2) * 0.72 // threshold matching Vuetify better

  if (activeField.value === 'hours') {
    let hour = Math.round(angle / 30) % 12

    if (props.is24h) {
      if (isInner) {
        hour = hour === 0 ? 12 : hour + 12
      }
    } else {
      hour = hour === 0 ? 12 : hour
    }
    keyboardRef.value.hours = hour.toString()
  } else {
    let min = Math.round(angle / 6)
    if (min === 60) min = 0
    keyboardRef.value.minutes = min.toString().padStart(2, '0')
  }
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging) return
  if (e.cancelable) e.preventDefault()
  updateTimeFromEvent(e)
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  if (e.cancelable && e.type !== 'touchstart') e.preventDefault() // prevent default text selection, except passive touchstart
  isDragging = true
  
  window.addEventListener('mousemove', onDragMove, { passive: false })
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('mouseup', onPointerUp)
  window.addEventListener('touchend', onPointerUp)
  
  updateTimeFromEvent(e)
}

function onPointerUp(e: MouseEvent | TouchEvent) {
  if (!isDragging) return
  isDragging = false
  
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchend', onPointerUp)

  if (activeField.value === 'hours' && keyboardRef.value) {
    keyboardRef.value.activeField = 'minutes'
  }
}

import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchend', onPointerUp)
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/time-picker/dial/_index' as t;

.ui-time-picker-dial {
  $prefix: 'dial';
  $t: material-map(t.$tokens, $prefix);

  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: g($t, 'container-color');
  border-radius: g($t, 'container-shape');
  padding: g($t, 'container-padding');
  gap: g($t, 'container-gap');
  position: relative;

  &--horizontal &__content {
    flex-direction: row;
  }

  &--vertical &__content {
    flex-direction: column;
  }

  &__content {
    display: flex;
    gap: g($t, 'container-gap');
    align-items: center;
    justify-content: center;
  }

  &__left-panel {
    display: flex;
    flex-direction: column;
    gap: 24rem;
  }

  &__title-area {
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    gap: 4rem;
  }

  &__label {
    color: var(--color-on-surface-variant);

    @include typescale('label-large');
  }

  &__helper {
    color: var(--color-on-surface-variant);

    @include typescale('body-small');
  }

  &__header {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  &__face {
    position: relative;
    width: g($t, 'face-size');
    height: g($t, 'face-size');
    border-radius: g($t, 'face-shape');
    background-color: g($t, 'face-color');
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__center-dot {
    width: g($t, 'selector-knob-size');
    height: g($t, 'selector-knob-size');
    border-radius: 50%;
    background-color: g($t, 'selector-color');
    position: absolute;
    z-index: 2;
  }

  &__selector {
    position: absolute;
    width: g($t, 'selector-width');
    height: calc(50% - #{g($t, 'selector-offset')});
    background-color: g($t, 'selector-color');
    bottom: 50%;
    transform-origin: bottom center;
    z-index: 1;
    transition: transform g($t, 'selector-transition-duration') g($t, 'selector-transition-easing'),
                height g($t, 'selector-transition-duration') g($t, 'selector-transition-easing');

    &--inner {
      height: calc(50% - #{g($t, 'selector-offset-inner')});
    }
  }

  &__selector-knob {
    position: absolute;
    top: calc(#{g($t, 'selector-handle-size')} / -4);
    left: calc((#{g($t, 'selector-handle-size')} - #{g($t, 'selector-width')}) / -2);
    width: g($t, 'selector-handle-size');
    height: g($t, 'selector-handle-size');
    border-radius: 50%;
    background-color: g($t, 'selector-color');
  }

  &__number {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 32rem;
    height: 32rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: g($t, 'number-color-default');
    z-index: 3;
    pointer-events: none;

    @include apply-typography(g($t, 'number-typography'));

    &--active {
      color: g($t, 'number-color-active');
    }
  }
}
</style>
