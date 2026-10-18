<template>
  <div class="ui-color-edit">
    <MTextField
      v-if="isHex"
      v-model="draft"
      class="ui-color-edit__hex"
      :label="ctx.messages.value.value"
      :disabled="ctx.disabled.value"
      :readonly="ctx.readonly.value"
      :error="!ctx.valid.value"
      :error-message="ctx.valid.value ? undefined : ctx.messages.value.formatHint"
      variant="outlined"
      density="compact"
      autocomplete="off"
      spellcheck="false"
      @keydown.enter.prevent="commitHex"
      @keydown.esc="onEscape"
      @blur="commitHex"
    />

    <div
      v-else-if="isRgb"
      class="ui-color-edit__channels"
      role="group"
      :aria-label="ctx.messages.value.channels"
    >
      <MNumberInput
        v-for="channel in rgbChannels"
        :key="channel.key"
        class="ui-color-edit__channel"
        :model-value="channel.value"
        :label="channel.label"
        :min="0"
        :max="channel.max"
        :step="channel.step"
        :precision="channel.precision"
        :controls="false"
        :disabled="ctx.disabled.value"
        :readonly="ctx.readonly.value"
        variant="outlined"
        density="compact"
        @update:model-value="value => setRgbChannel(channel.key, value)"
      />
    </div>

    <div
      v-else
      class="ui-color-edit__channels"
      role="group"
      :aria-label="ctx.messages.value.channels"
    >
      <MNumberInput
        v-for="channel in hslChannels"
        :key="channel.key"
        class="ui-color-edit__channel"
        :model-value="channel.value"
        :label="channel.label"
        :min="0"
        :max="channel.max"
        :step="channel.step"
        :precision="channel.precision"
        :controls="false"
        :disabled="ctx.disabled.value"
        :readonly="ctx.readonly.value"
        variant="outlined"
        density="compact"
        @update:model-value="value => setHslChannel(channel.key, value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MTextField from '#kit/components/ui/text-field/index.vue'
import MNumberInput from '#kit/components/ui/number-input/index.vue'
import { useColorPickerContext } from '#kit/composables/color-picker/context'
import { hslaToRgba, rgbaToHsla } from '#kit/shared/utils/color'
import type { HSLA, RGBA } from '#kit/shared/utils/color'

type RgbChannel = keyof Pick<RGBA, 'r' | 'g' | 'b' | 'a'>
type HslChannel = keyof Pick<HSLA, 'h' | 's' | 'l' | 'a'>

const ctx = useColorPickerContext()
const draft = ref(ctx.value.value ?? '')
const isHex = computed(() => ctx.format.value === 'hex' || ctx.format.value === 'hexa')
const isRgb = computed(() => ctx.format.value === 'rgb' || ctx.format.value === 'rgba')
const hsla = computed(() => rgbaToHsla(ctx.rgba.value))
const includesAlpha = computed(() => ctx.format.value === 'rgba' || ctx.format.value === 'hsla')

const rgbChannels = computed(() => [
  { key: 'r' as const, label: 'R', value: ctx.rgba.value.r, max: 255, step: 1, precision: 0 },
  { key: 'g' as const, label: 'G', value: ctx.rgba.value.g, max: 255, step: 1, precision: 0 },
  { key: 'b' as const, label: 'B', value: ctx.rgba.value.b, max: 255, step: 1, precision: 0 },
  ...(includesAlpha.value
    ? [{ key: 'a' as const, label: 'A %', value: Math.round(ctx.rgba.value.a * 100), max: 100, step: 1, precision: 0 }]
    : []),
])

const hslChannels = computed(() => [
  { key: 'h' as const, label: 'H', value: Math.round(hsla.value.h), max: 360, step: 1, precision: 0 },
  { key: 's' as const, label: 'S %', value: Math.round(hsla.value.s * 100), max: 100, step: 1, precision: 0 },
  { key: 'l' as const, label: 'L %', value: Math.round(hsla.value.l * 100), max: 100, step: 1, precision: 0 },
  ...(includesAlpha.value
    ? [{ key: 'a' as const, label: 'A %', value: Math.round(hsla.value.a * 100), max: 100, step: 1, precision: 0 }]
    : []),
])

watch(() => ctx.value.value, (value) => {
  draft.value = value ?? ''
})

// An unreadable value stays in the field with the error under it, saying
// which forms it takes — it is not quietly replaced. Escape puts the last good
// value back and clears the error.
function commitHex() {
  if (ctx.locked.value) return
  if (draft.value.trim() === '') {
    revert()
    return
  }
  if (ctx.selectColor(draft.value)) ctx.commit('edit')
}

function revert() {
  draft.value = ctx.value.value ?? ''
  ctx.clearError()
}

function onEscape(event: KeyboardEvent) {
  // With nothing to roll back, Escape belongs to whatever is around the
  // picker — a popover closing on it, for one.
  if (draft.value === (ctx.value.value ?? '') && ctx.valid.value) return
  event.preventDefault()
  event.stopPropagation()
  revert()
}

function setRgbChannel(channel: RgbChannel, value: number | null) {
  if (value === null) return
  const next = { ...ctx.rgba.value }
  next[channel] = channel === 'a' ? value / 100 : value
  ctx.setRGBA(next)
  ctx.commit('edit')
}

function setHslChannel(channel: HslChannel, value: number | null) {
  if (value === null) return
  const next = { ...hsla.value }
  next[channel] = channel === 's' || channel === 'l' || channel === 'a' ? value / 100 : value
  ctx.setRGBA(hslaToRgba(next))
  ctx.commit('edit')
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker' as t;

.ui-color-edit {
  $t: material-map(t.$tokens, 'm-color-picker');

  &__channels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(g($t, 'edit.channel.min.width'), 1fr));
    gap: g($t, 'edit.gap');
  }
}
</style>
