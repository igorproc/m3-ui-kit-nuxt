<template>
  <span
    class="ui-hotkey"
    :class="{ 'ui-hotkey--disabled': isDisabled }"
    v-bind="rootAttrs"
  >
    <span
      v-for="layer in layers"
      :key="layer.name"
      class="ui-hotkey__combo"
      :class="{ 'ui-hotkey__combo--reserve': layer.reserve }"
      aria-hidden="true"
    >
      <template
        v-for="(entry, index) in layer.keys"
        :key="index"
      >
        <span
          v-if="index > 0"
          class="ui-hotkey__separator"
        >
          <slot
            name="separator"
            :index="index"
            :platform="layer.platform"
          >{{ separatorFor(layer.platform) }}</slot>
        </span>

        <kbd
          class="ui-hotkey__key"
          :class="{
            'ui-hotkey__key--pressed': !layer.reserve && pressedSet.has(entry.key),
            'ui-hotkey__key--modifier': entry.isModifier,
          }"
        >
          <slot
            name="key"
            :token="entry.key"
            :label="entry.label"
            :pressed="!layer.reserve && pressedSet.has(entry.key)"
            :disabled="isDisabled"
            :index="index"
          >{{ entry.symbol }}</slot>
        </kbd>
      </template>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useHotkeyPresentation } from '#kit/composables/hotkey/useHotkeyPresentation'
import { mHotkeyProps } from './props'
import type { HotkeyDisplayKey, ResolvedHotkeyPlatform } from '#kit/shared/types/hotkey'

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

const standalone = useHotkeyPresentation({
  keys: () => props.keys ?? [],
  platform: () => props.platform,
  active: () => !props.disabled,
})

const view = computed(() => props.hotkey ?? standalone)

const isDisabled = computed(() => !view.value.isActive.value)

const rootAttrs = computed(() => {
  const name = props.ariaLabel ?? view.value.ariaLabel.value
  if (!name) return {}
  return { 'role': 'img', 'aria-label': name, 'aria-disabled': isDisabled.value ? 'true' as const : undefined }
})

const pressedSet = computed(() => new Set(isDisabled.value ? [] : view.value.pressedKeys.value))

const layers = computed(() => {
  const shown = { name: 'shown', keys: view.value.displayKeys.value, platform: view.value.platform.value, reserve: false }
  const reserved: HotkeyDisplayKey[] = view.value.reservedKeys.value
  if (!reserved.length) return [shown]
  return [shown, { name: 'reserved', keys: reserved, platform: 'windows' as ResolvedHotkeyPlatform, reserve: true }]
})

function separatorFor(platform: ResolvedHotkeyPlatform): string {
  return props.separator ?? (platform === 'mac' ? '' : '+')
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/hotkey/index' as t;

$prefix: 'md-hotkey';

.ui-hotkey {
  $t: material-map(t.$tokens, $prefix);

  display: inline-grid;
  vertical-align: middle;

  &__combo {
    display: inline-flex;
    flex-wrap: wrap;
    grid-area: 1 / 1;
    align-items: center;
    gap: g($t, 'container.gap');

    &--reserve {
      visibility: hidden;
    }
  }

  &__key {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: g($t, 'key.min-size');
    min-block-size: g($t, 'key.min-size');
    padding-inline: g($t, 'key.padding.inline');
    border: g($t, 'key.border.width') solid g($t, 'key.enabled.border');
    border-radius: g($t, 'key.radius');
    background-color: g($t, 'key.enabled.bg');
    color: g($t, 'key.enabled.color');
    isolation: isolate;

    @include typescale(g($t, 'key.typography'));

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: g($t, 'key.pressed.layer');
      content: '';
      opacity: 0;
      transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    }

    &--pressed::before {
      opacity: g($t, 'key.pressed.opacity');
    }
  }

  &__separator {
    color: g($t, 'separator.color');

    @include typescale(g($t, 'key.typography'));
  }

  &--disabled &__key {
    border-color: g($t, 'key.disabled.border');
    background-color: g($t, 'key.disabled.bg');
    color: g($t, 'key.disabled.color');
  }

  &--disabled &__separator {
    color: g($t, 'key.disabled.color');
  }

  @include forced-colors {
    &__key {
      border-color: ButtonText;

      &::before {
        display: none;
      }

      &--pressed {
        border-color: Highlight;
        background-color: Highlight;
        color: HighlightText;
      }
    }

    &--disabled &__key {
      border-color: GrayText;
      color: GrayText;
    }

    &--disabled &__separator {
      color: GrayText;
    }
  }
}
</style>
