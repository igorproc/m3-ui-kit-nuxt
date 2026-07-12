<template>
  <span
    class="ui-hotkey"
    :class="{ 'ui-hotkey--disabled': isDisabled }"
    role="img"
    :aria-label="resolvedAriaLabel"
  >
    <template
      v-for="(entry, index) in displayKeys"
      :key="index"
    >
      <span
        v-if="index > 0"
        class="ui-hotkey__separator"
        aria-hidden="true"
      >
        <slot
          name="separator"
          :index="index"
          :platform="resolvedPlatform"
        >{{ separatorText }}</slot>
      </span>

      <kbd
        class="ui-hotkey__key"
        :class="{
          'ui-hotkey__key--pressed': pressedSet.has(entry.key),
          'ui-hotkey__key--modifier': entry.isModifier,
        }"
        aria-hidden="true"
      >
        <slot
          name="key"
          :token="entry.key"
          :label="entry.label"
          :pressed="pressedSet.has(entry.key)"
          :disabled="isDisabled"
          :index="index"
        >{{ entry.symbol }}</slot>
      </kbd>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { buildAriaLabel, buildDisplayKeys, detectPlatform } from '~/composables/hotkey/format'
import { mHotkeyProps } from './props'
import type { ResolvedHotkeyPlatform } from '~~/shared/types/hotkey'

const props = defineProps(mHotkeyProps)

defineSlots<{
  key?: (scope: { token: string, label: string, pressed: boolean, disabled: boolean, index: number }) => unknown
  separator?: (scope: { index: number, platform: ResolvedHotkeyPlatform }) => unknown
}>()

if (import.meta.dev) {
  watchEffect(() => {
    const hasHotkey = !!props.hotkey
    const hasKeys = !!props.keys
    if (hasHotkey === hasKeys) {
      console.warn('[m3:hotkey] <MHotkey> requires exactly one of `hotkey` or `keys`.')
    }
  })
}

// SSR-safe platform for static `keys` mode (behavioral mode reuses the
// composable's already-resolved platform).
const platformOption = computed(() => props.platform ?? 'auto')
const staticPlatform = ref<ResolvedHotkeyPlatform>(
  platformOption.value === 'auto' ? 'windows' : platformOption.value,
)
if (platformOption.value === 'auto') {
  onMounted(() => {
    staticPlatform.value = detectPlatform()
  })
}

const resolvedPlatform = computed<ResolvedHotkeyPlatform>(() =>
  props.hotkey ? props.hotkey.platform.value : staticPlatform.value,
)

const displayKeys = computed(() =>
  props.hotkey ? props.hotkey.displayKeys.value : buildDisplayKeys(props.keys ?? [], staticPlatform.value),
)

const resolvedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel
  if (props.hotkey) return props.hotkey.ariaLabel.value
  return buildAriaLabel(displayKeys.value)
})

const isDisabled = computed(() => (props.hotkey ? !props.hotkey.isActive.value : props.disabled))

const pressedSet = computed(() => new Set(props.hotkey ? props.hotkey.pressedKeys.value : []))

const separatorText = computed(() =>
  props.separator ?? (resolvedPlatform.value === 'mac' ? '' : '+'),
)
</script>

<style lang="scss">
@use 'sass:map';
@use '~/assets/stylesheet/components/hotkey/index' as t;

$prefix: 'md-hotkey';

.ui-hotkey {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  gap: g($t, 'container-gap');
  vertical-align: middle;

  &__key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'key-min-width');
    padding: g($t, 'key-padding-block') g($t, 'key-padding-inline');
    border-radius: g($t, 'key-radius');
    border: 1rem solid g($t, 'key-enabled-border');
    background-color: g($t, 'key-enabled-bg');
    color: g($t, 'key-enabled-color');
    font-family: inherit;
    transition:
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    @include typescale(g($t, 'key-typography'));

    &--pressed {
      background-color: g($t, 'key-pressed-bg');
      color: g($t, 'key-pressed-color');
      border-color: transparent;
      transform: translateY(1rem);
    }
  }

  &__separator {
    color: g($t, 'separator-color');

    @include typescale(g($t, 'key-typography'));
  }

  &--disabled {
    .ui-hotkey__key {
      border-color: transparent;
      color: color-mix(in srgb, #{g($t, 'key-disabled-color')} 38%, transparent);
      background-color: color-mix(in srgb, #{g($t, 'key-disabled-color')} 12%, transparent);
    }

    .ui-hotkey__separator {
      color: color-mix(in srgb, #{g($t, 'key-disabled-color')} 38%, transparent);
    }
  }
}
</style>
