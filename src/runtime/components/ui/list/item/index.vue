<template>
  <component
    :is="tag"
    ref="rootRef"
    v-ripple="isInteractive && !disabled"
    class="ui-list-item"
    :class="{
      'ui-list-item--interactive': isInteractive,
      'ui-list-item--disabled': disabled,
      'ui-list-item--selected': selected,
      [`ui-list-item--lines-${computedLines}`]: true,
    }"
    :disabled="disabled"
    :role="a11yRole"
    :tabindex="a11yTabindex"
    :aria-disabled="emulatesButton && disabled ? 'true' : undefined"
    v-bind="bindings"
    @keydown="onKeydown"
  >
    <div
      v-if="$slots.leading || leadingIcon"
      class="ui-list-item__leading"
    >
      <slot name="leading">
        <m-icon
          v-if="leadingIcon"
          :name="leadingIcon"
        />
      </slot>
    </div>

    <div class="ui-list-item__body">
      <div
        v-if="overline || $slots.overline"
        class="ui-list-item__overline"
      >
        <slot name="overline">
          {{ overline }}
        </slot>
      </div>

      <div
        v-if="headline || $slots.headline"
        class="ui-list-item__headline"
      >
        <slot name="headline">
          {{ headline }}
        </slot>
      </div>

      <slot />

      <div
        v-if="supportingText || $slots.supporting"
        class="ui-list-item__supporting"
      >
        <slot name="supporting">
          {{ supportingText }}
        </slot>
      </div>
    </div>

    <div
      v-if="$slots.trailing || trailingIcon || trailingSupportingText || $slots.trailingSupporting"
      class="ui-list-item__trailing"
    >
      <div
        v-if="trailingSupportingText || $slots.trailingSupporting"
        class="ui-list-item__trailing-supporting"
      >
        <slot name="trailingSupporting">
          {{ trailingSupportingText }}
        </slot>
      </div>
      <slot name="trailing">
        <m-icon
          v-if="trailingIcon"
          :name="trailingIcon"
        />
      </slot>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useSlots } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { type MListItemProps, mListItemProps } from './props'

const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))

const props = defineProps(mListItemProps)

const slots = useSlots()

const rootRef = ref<HTMLElement | ComponentPublicInstance | null>(null)

const isInteractive = computed(() => {
  return props.interactive || props.tag === 'button' || props.tag === 'a' || !!props.to
})

// Native interactive elements (button/a/NuxtLink) already provide role,
// focusability and Enter/Space semantics. A bare interactive `div` must
// emulate the button role so AT and keyboard users get the same affordance.
const emulatesButton = computed(() =>
  isInteractive.value && !props.to && props.tag !== 'button' && props.tag !== 'a',
)

const a11yRole = computed(() => (emulatesButton.value ? 'button' : undefined))
const a11yTabindex = computed(() => {
  if (!emulatesButton.value) return undefined
  return props.disabled ? -1 : 0
})

function onKeydown(event: KeyboardEvent) {
  if (!emulatesButton.value || props.disabled) return
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return

  event.preventDefault()

  const el = rootRef.value instanceof HTMLElement
    ? rootRef.value
    : (rootRef.value as ComponentPublicInstance | null)?.$el as HTMLElement | undefined

  el?.click()
}

const computedLines = computed(() => {
  if (props.lines !== 'auto') {
    return props.lines
  }
  const hasSupporting = props.supportingText || slots.supporting || slots.default
  const hasOverline = props.overline || slots.overline

  if (hasOverline && hasSupporting) {
    return 3
  }
  if (hasSupporting) {
    return 2
  }
  return 1
})

const bindings = computed(() => {
  if (props.to) {
    return { to: props.to }
  }
  return {}
})

const tag = computed(() => {
  if (props.to) {
    return NuxtLink
  }
  return props.tag
})
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/list/item/index' as t;

.ui-list-item {
  $prefix: 'md-list-item';
  $t: material-map(t.$tokens, $prefix);

  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: g($t, 'padding-between');
  padding: g($t, 'padding-top') g($t, 'padding-trailing') g($t, 'padding-bottom') g($t, 'padding-leading');
  border-radius: g($t, 'shape');
  background-color: g($t, 'container-color');
  border: none;
  width: 100%;
  text-align: left;
  color: g($t, 'label-text-color');
  text-decoration: none;
  box-sizing: border-box;
  position: relative;
  outline: none;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    outline var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  // Line counts
  &--lines-1 {
    min-height: g($t, 'height-one');
  }

  &--lines-2 {
    min-height: g($t, 'height-two');
  }

  &--lines-3 {
    min-height: g($t, 'height-three');
    align-items: flex-start;

    .ui-list-item__leading {
      margin-top: 4rem; // align to top for three lines
    }

    .ui-list-item__trailing {
      margin-top: 4rem; // align to top for three lines
    }
  }

  &--interactive {
    cursor: pointer;

    &:hover {
      background-color: color-mix(in srgb, g($t, 'state-hover-color') g($t, 'state-hover-opacity'), transparent);
    }

    &:active {
      background-color: color-mix(in srgb, g($t, 'state-pressed-color') g($t, 'state-pressed-opacity'), transparent);
    }

    &:focus-visible {
      background-color: color-mix(in srgb, g($t, 'state-focus-color') g($t, 'state-focus-opacity'), transparent);
      outline: g($t, 'state-focus-indicator-thickness') solid g($t, 'state-focus-indicator-color');
      outline-offset: g($t, 'state-focus-indicator-offset');
    }
  }

  // Selected State
  &--selected {
    background-color: g($t, 'container-selected-color');
    color: g($t, 'label-text-selected-color');

    .ui-list-item__headline {
      color: g($t, 'label-text-selected-color');
    }

    .ui-list-item__supporting {
      color: g($t, 'supporting-text-selected-color');
    }

    .ui-list-item__overline {
      color: g($t, 'overline-selected-color');
    }

    .ui-list-item__leading {
      color: g($t, 'leading-icon-selected-color');
    }

    .ui-list-item__trailing {
      color: g($t, 'trailing-icon-selected-color');

      &-supporting {
        color: g($t, 'trailing-supporting-text-selected-color');
      }
    }

    &.ui-list-item--interactive {
      &:hover {
        background-color: color-mix(in srgb, g($t, 'state-hover-color') g($t, 'state-hover-opacity'), g($t, 'container-selected-color'));
      }

      &:active {
        background-color: color-mix(in srgb, g($t, 'state-pressed-color') g($t, 'state-pressed-opacity'), g($t, 'container-selected-color'));
      }

      &:focus-visible {
        background-color: color-mix(in srgb, g($t, 'state-focus-color') g($t, 'state-focus-opacity'), g($t, 'container-selected-color'));
      }
    }
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'container-disabled-opacity');
    pointer-events: none;
  }

  &__leading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: g($t, 'leading-icon-color');
    font-size: g($t, 'leading-icon-size');
    min-width: 24rem;

    img {
      width: g($t, 'leading-image-width');
      height: g($t, 'leading-image-height');
      border-radius: g($t, 'leading-image-shape');
      object-fit: cover;
    }

    .ui-avatar {
      width: g($t, 'leading-avatar-size');
      height: g($t, 'leading-avatar-size');
      border-radius: map.get($theme-shape-link, full);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__overline {
    color: g($t, 'overline-color');
    margin-bottom: 4rem;

    @include apply-typography(g($t, 'overline-typography'));
  }

  &__headline {
    color: g($t, 'label-text-color');
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @include apply-typography(g($t, 'label-text-typography'));
  }

  &__supporting {
    color: g($t, 'supporting-text-color');
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 4rem;

    @include apply-typography(g($t, 'supporting-text-typography'));
  }

  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8rem;
    color: g($t, 'trailing-icon-color');
    font-size: g($t, 'trailing-icon-size');
  }

  &__trailing-supporting {
    color: g($t, 'trailing-supporting-text-color');

    @include apply-typography(g($t, 'trailing-supporting-text-typography'));
  }
}
</style>
