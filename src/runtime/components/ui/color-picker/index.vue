<template>
  <div
    class="ui-color-picker"
    :class="{
      'ui-color-picker--disabled': disabled,
      'ui-color-picker--readonly': readonly,
    }"
    role="group"
    :aria-label="label"
  >
    <ColorCanvas v-if="!hideCanvas" />

    <div class="ui-color-picker__sliders">
      <input
        type="range"
        class="ui-color-picker__hue"
        min="0"
        max="360"
        step="1"
        :aria-label="messages.hue"
        :aria-valuetext="`${Math.round(ctx.hsva.value.h)}°`"
        :value="ctx.hsva.value.h"
        :disabled="disabled"
        :aria-readonly="readonly || undefined"
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
        :aria-label="messages.alpha"
        :aria-valuetext="`${Math.round(ctx.hsva.value.a * 100)}%`"
        :value="ctx.hsva.value.a"
        :disabled="disabled"
        :aria-readonly="readonly || undefined"
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
      <!-- A compact list, not a row of six segments: it fits any width and the
           model of formats stays as it is. -->
      <MDropdown
        v-if="formats.length > 1"
        class="ui-color-picker__format"
        :model-value="format"
        :items="formatItems"
        item-value="id"
        :label="messages.format"
        label-placement="hidden"
        density="compact"
        variant="outlined"
        :disabled="disabled"
        :readonly="readonly"
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
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import ColorCanvas from '#kit/components/fragments/color-picker/Canvas.vue'
import ColorPreview from '#kit/components/fragments/color-picker/Preview.vue'
import ColorEdit from '#kit/components/fragments/color-picker/Edit.vue'
import ColorSwatches from '#kit/components/fragments/color-picker/Swatches.vue'
import { createColorPickerState, provideColorPickerContext } from '#kit/composables/color-picker/context'
import { mColorPickerProps } from './props'
import type { ColorFormat, ColorParseError } from '#kit/shared/utils/color'

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
  readonly: () => props.readonly,
  messages: () => props.messages,
  onChange: value => emit('change', value),
  onInvalid: (draft, reason) => emit('invalid', draft, reason),
})

provideColorPickerContext(ctx)

const formatItems = computed(() => props.formats.map(entry => ({ id: entry, label: entry.toUpperCase() })))

function onHue(event: Event) {
  const input = event.target as HTMLInputElement
  // A read-only range still moves under the pointer; the value it shows is
  // put back, so the color does not change.
  if (props.readonly) {
    input.value = String(ctx.hsva.value.h)
    return
  }
  ctx.setHue(Number(input.value))
}

function onAlpha(event: Event) {
  const input = event.target as HTMLInputElement
  if (props.readonly) {
    input.value = String(ctx.hsva.value.a)
    return
  }
  ctx.setAlpha(Number(input.value))
}

function onFormat(value: unknown) {
  ctx.setFormat(value as ColorFormat)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-picker {
  $t: material-map(t.$tokens, 'm-color-picker');

  display: flex;
  flex-direction: column;
  width: g($t, 'root.width');
  max-width: 100%;
  gap: g($t, 'root.gap');
  padding: g($t, 'root.padding');
  border-radius: g($t, 'root.radius');
  background-color: g($t, 'root.surface');
  color: g($t, 'root.color');
  box-shadow: g($t, 'root.elevation');

  &__sliders {
    display: flex;
    flex-direction: column;
    gap: g($t, 'slider.gap');
  }

  &__hue,
  &__alpha {
    width: 100%;
    height: g($t, 'slider.target');
    margin: 0;
    padding-block: g($t, 'slider.inset');
    border-radius: #{g($t, 'slider.radius.inline')} / #{g($t, 'slider.radius.block')};
    appearance: none;
    cursor: pointer;

    // The track is the gradient itself; the ring around it is the focus.
    &:focus-visible {
      @include focus-ring;
    }

    &::-webkit-slider-thumb {
      width: g($t, 'slider.thumb.size');
      height: g($t, 'slider.thumb.size');
      border: g($t, 'slider.thumb.border-width') solid g($t, 'slider.thumb.border');
      border-radius: g($t, 'slider.thumb.shape');
      box-shadow: g($t, 'slider.thumb.shadow');
      appearance: none;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: g($t, 'slider.thumb.size');
      height: g($t, 'slider.thumb.size');
      border: g($t, 'slider.thumb.border-width') solid g($t, 'slider.thumb.border');
      border-radius: g($t, 'slider.thumb.shape');
      box-shadow: g($t, 'slider.thumb.shadow');
      cursor: pointer;
    }
  }

  // Full hue spectrum — the math of hue, not a theme colour. A native range
  // runs right to left in RTL, so the spectrum turns with it.
  // Painted on the content box only: the padding around it is touch area.
  &__hue {
    background: linear-gradient(to right, hsl(0deg 100% 50%), hsl(60deg 100% 50%), hsl(120deg 100% 50%), hsl(180deg 100% 50%), hsl(240deg 100% 50%), hsl(300deg 100% 50%), hsl(360deg 100% 50%)) content-box;

    &:dir(rtl) {
      background: linear-gradient(to left, hsl(0deg 100% 50%), hsl(60deg 100% 50%), hsl(120deg 100% 50%), hsl(180deg 100% 50%), hsl(240deg 100% 50%), hsl(300deg 100% 50%), hsl(360deg 100% 50%)) content-box;
    }
  }

  &__alpha {
    background:
      linear-gradient(to right, transparent, var(--alpha-color)) content-box,
      conic-gradient(g($t, 'checker.a') 0 25%, g($t, 'checker.b') 0 50%, g($t, 'checker.a') 0 75%, g($t, 'checker.b') 0) 0 0 / #{g($t, 'checker.size')} #{g($t, 'checker.size')} content-box;

    &:dir(rtl) {
      background:
        linear-gradient(to left, transparent, var(--alpha-color)) content-box,
        conic-gradient(g($t, 'checker.a') 0 25%, g($t, 'checker.b') 0 50%, g($t, 'checker.a') 0 75%, g($t, 'checker.b') 0) 0 0 / #{g($t, 'checker.size')} #{g($t, 'checker.size')} content-box;
    }
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    gap: g($t, 'edit.inputs-gap');
  }

  // Disabled by roles: the fields inside carry their own disabled ink, so only
  // the colour surfaces — which cannot take another colour — recede. One
  // opacity over the whole picker would dim the fields twice.
  &--disabled {
    .ui-color-canvas,
    .ui-color-picker__hue,
    .ui-color-picker__alpha,
    .ui-color-swatches,
    .ui-color-preview__swatch {
      opacity: g($t, 'disabled.opacity');
      cursor: default;
    }
  }

  &--readonly {
    .ui-color-canvas,
    .ui-color-picker__hue,
    .ui-color-picker__alpha {
      cursor: default;
    }
  }

  // The picker floats on its fill and shadow alone.
  @include forced-colors {
    border: 1px solid CanvasText;
  }
}
</style>
