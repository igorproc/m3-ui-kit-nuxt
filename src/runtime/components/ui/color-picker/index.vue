<template>
  <div
    class="ui-color-picker"
    :class="{
      'ui-color-picker--hosted': hosted,
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
        :style="{ '--m-color-picker-alpha': ctx.cssColor.value }"
        @input="onAlpha"
        @change="ctx.commit('pointer')"
      >
    </div>

    <!-- One row: the colour, its format and its value, as in the concept.
         Channel fields (RGB, HSL) take a row of their own under it. -->
    <div
      v-if="valueRowShown"
      class="ui-color-picker__value-row"
    >
      <slot
        name="preview"
        :color="ctx.cssColor.value"
        :value="ctx.value.value"
      >
        <ColorPreview v-if="!hidePreview" />
      </slot>
      <MDropdown
        v-if="!hideInputs && formats.length > 1"
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
      <ColorEdit v-if="!hideInputs" />
    </div>

    <ColorSwatches
      v-if="!hideSwatches && swatches.length"
      :swatches="swatches"
    >
      <template
        v-if="$slots.swatch"
        #swatch="scope"
      >
        <slot
          name="swatch"
          v-bind="scope"
        />
      </template>
    </ColorSwatches>

    <div
      v-if="$slots.actions"
      class="ui-color-picker__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'
import ColorCanvas from '#kit/components/fragments/color-picker/Canvas.vue'
import ColorPreview from '#kit/components/fragments/color-picker/Preview.vue'
import ColorEdit from '#kit/components/fragments/color-picker/Edit.vue'
import ColorSwatches from '#kit/components/fragments/color-picker/Swatches.vue'
import { createColorPickerState, provideColorPickerContext } from '#kit/utils/color-picker/context'
import { useColorPickerHosted } from './context'
import { mColorPickerProps } from './props'
import type { ColorFormat, ColorParseError } from '#kit/shared/utils/color'

const props = defineProps(mColorPickerProps)

const slots = defineSlots<{
  /** In place of the preview swatch. */
  preview?: (props: { color: string, value: string | null }) => unknown
  /** The content of one palette swatch — the check of the chosen one by default. */
  swatch?: (props: { swatch: { value: string, label: string }, selected: boolean }) => unknown
  /** Actions under the palette: an eyedropper, "apply", "reset". */
  actions?: () => unknown
}>()

const hosted = useColorPickerHosted()

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
const valueRowShown = computed(() => !props.hideInputs || !props.hidePreview || Boolean(slots.preview))

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
@use '#kit/assets/stylesheet/components/color-picker/checker' as *;

.ui-color-picker {
  $t: material-map(t.$tokens, 'm-color-picker');
  $hue-stops: hsl(0deg 100% 50%), hsl(60deg 100% 50%), hsl(120deg 100% 50%), hsl(180deg 100% 50%), hsl(240deg 100% 50%), hsl(300deg 100% 50%), hsl(360deg 100% 50%);

  display: flex;
  flex-direction: column;
  width: g($t, 'root.width');
  max-width: 100%;
  gap: g($t, 'root.gap');
  padding: g($t, 'root.padding');
  border-radius: g($t, 'root.radius');
  background-color: g($t, 'root.surface');
  color: g($t, 'root.color');

  // In a popover the popover is the surface.
  &--hosted {
    border-radius: 0;
    background-color: transparent;
  }

  &__sliders {
    display: flex;
    flex-direction: column;
  }

  &__hue,
  &__alpha {
    width: 100%;
    height: g($t, 'slider.target');
    margin: 0;
    padding-block: g($t, 'slider.inset');
    border-radius: #{g($t, 'slider.radius.inline')} / #{g($t, 'slider.radius.block')};
    outline: none;
    appearance: none;
    cursor: pointer;

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

    // The ring sits around the thumb, the part the keys move — not around the
    // whole target.
    &:focus-visible::-webkit-slider-thumb {
      @include focus-ring;
    }

    &:focus-visible::-moz-range-thumb {
      @include focus-ring;
    }
  }

  // Full hue spectrum — the math of hue, not a theme colour. A native range
  // runs right to left in RTL, so the spectrum turns with it. Painted on the
  // content box only: the padding around it is touch area.
  @each $dir, $side in (ltr: right, rtl: left) {
    &__hue:dir(#{$dir}) {
      background: linear-gradient(to #{$side}, $hue-stops) content-box;
    }

    &__alpha:dir(#{$dir}) {
      @include checker($t, linear-gradient(to #{$side}, transparent, var(--m-color-picker-alpha)), content-box);
    }
  }

  // Preview, format and a hex value share a row; channel fields wrap under it.
  &__value-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: g($t, 'edit.inputs-gap') g($t, 'edit.gap');
  }

  // Outranks the dropdown's own `width: 100%`: in a production build its sheet
  // may load after this one.
  &__value-row &__format {
    flex: 0 0 auto;
    width: g($t, 'edit.format.width');
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: g($t, 'edit.gap');
  }

  // Disabled by roles: the fields inside carry their own disabled ink, so only
  // the colour surfaces — which cannot take another colour — recede. One
  // opacity over the whole picker would dim the fields twice.
  &--disabled {
    .ui-color-canvas,
    .ui-color-picker__hue,
    .ui-color-picker__alpha,
    .ui-color-swatches,
    .ui-color-preview {
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

  // The picker stands apart by its fill alone.
  @include forced-colors {
    &:not(.ui-color-picker--hosted) {
      border: 1px solid CanvasText;
    }
  }
}
</style>
