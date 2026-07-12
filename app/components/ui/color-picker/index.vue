<template>
  <div
    class="ui-color-picker"
    :class="{ 'ui-color-picker--disabled': disabled }"
  >
    <ColorCanvas v-if="!hideCanvas" />

    <div class="ui-color-picker__sliders">
      <input
        type="range"
        class="ui-color-picker__hue"
        min="0"
        max="360"
        step="1"
        aria-label="Hue"
        :value="ctx.hsva.value.h"
        :disabled="disabled"
        @input="onHue"
        @change="ctx.commit('pointer')"
      >
      <input
        v-if="ctx.supportsAlpha.value"
        type="range"
        class="ui-color-picker__alpha"
        min="0"
        max="1"
        step="0.01"
        aria-label="Alpha"
        :value="ctx.hsva.value.a"
        :disabled="disabled"
        :style="{ '--alpha-color': ctx.cssColor.value }"
        @input="onAlpha"
        @change="ctx.commit('pointer')"
      >
    </div>

    <ColorPreview v-if="!hidePreview" />

    <div
      v-if="!hideInputs"
      class="ui-color-picker__inputs"
    >
      <MButtonSegmented
        v-if="formats.length > 1"
        :model-value="format"
        :items="formatItems"
        :disabled="disabled"
        @update:model-value="onFormat"
      />
      <ColorEdit />
    </div>

    <ColorSwatches
      v-if="!hideSwatches && swatches.length"
      :swatches="swatches"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ColorCanvas from '~/components/color-picker/Canvas.vue'
import ColorPreview from '~/components/color-picker/Preview.vue'
import ColorEdit from '~/components/color-picker/Edit.vue'
import ColorSwatches from '~/components/color-picker/Swatches.vue'
import { createColorPickerState, provideColorPickerContext } from '~/composables/color-picker/context'
import { mColorPickerProps } from './props'
import type { ColorFormat, ColorParseError } from '~~/shared/utils/color'

const props = defineProps(mColorPickerProps)

const model = defineModel<string | null>({ default: null })
const format = defineModel<ColorFormat>('format', { default: 'hex' })

const emit = defineEmits<{
  (event: 'change', value: string | null): void
  (event: 'invalid', draft: string, reason: ColorParseError): void
}>()

const ctx = createColorPickerState({
  model,
  format,
  formats: () => props.formats,
  disabled: () => props.disabled,
  onChange: value => emit('change', value),
  onInvalid: (draft, reason) => emit('invalid', draft, reason),
})

provideColorPickerContext(ctx)

const formatItems = computed(() => props.formats.map(entry => ({ label: entry.toUpperCase(), value: entry })))

function onHue(event: Event) {
  ctx.setHue(Number((event.target as HTMLInputElement).value))
}

function onAlpha(event: Event) {
  ctx.setAlpha(Number((event.target as HTMLInputElement).value))
}

function onFormat(value: string | number | (string | number)[]) {
  ctx.setFormat(value as ColorFormat)
}
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/color-picker/index' as t;

.ui-color-picker {
  $t: material-map(t.$tokens, 'md-color-picker');

  display: flex;
  flex-direction: column;
  width: g($t, 'root-width');
  max-width: 100%;
  gap: g($t, 'root-gap');
  padding: g($t, 'root-padding');
  border-radius: g($t, 'root-radius');
  background-color: g($t, 'root-surface');
  color: g($t, 'root-color');
  box-shadow: g($t, 'root-elevation');

  &__sliders {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }

  &__hue,
  &__alpha {
    width: 100%;
    height: g($t, 'slider-height');
    border-radius: g($t, 'slider-radius');
    appearance: none;
    cursor: pointer;
    outline: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: g($t, 'slider-thumb-size');
      height: g($t, 'slider-thumb-size');
      border: 2rem solid g($t, 'slider-thumb-border');
      border-radius: 50%;
      box-shadow: 0 0 0 1rem rgb(0 0 0 / 30%);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: g($t, 'slider-thumb-size');
      height: g($t, 'slider-thumb-size');
      border: 2rem solid g($t, 'slider-thumb-border');
      border-radius: 50%;
      box-shadow: 0 0 0 1rem rgb(0 0 0 / 30%);
      cursor: pointer;
    }
  }

  &__hue {
    // Full hue spectrum — structural gradient, not a theme color.
    background: linear-gradient(to right, hsl(0deg 100% 50%), hsl(60deg 100% 50%), hsl(120deg 100% 50%), hsl(180deg 100% 50%), hsl(240deg 100% 50%), hsl(300deg 100% 50%), hsl(360deg 100% 50%));
  }

  &__alpha {
    background:
      linear-gradient(to right, transparent, var(--alpha-color)),
      conic-gradient(g($t, 'checker-a') 0 25%, g($t, 'checker-b') 0 50%, g($t, 'checker-a') 0 75%, g($t, 'checker-b') 0) 0 0 / #{g($t, 'checker-size')} #{g($t, 'checker-size')};
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
