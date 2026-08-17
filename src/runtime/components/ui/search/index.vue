<template>
  <div
    class="ui-search"
    :class="{
      'ui-search--focused': isFocused,
      'ui-search--empty': !modelValue,
    }"
  >
    <span class="ui-search__icon ui-search__icon--leading">
      <slot name="leading">
        <m-icon
          :name="ICONS.search"
          aria-hidden="true"
        />
      </slot>
    </span>

    <input
      :id="fieldId"
      v-model="modelValue"
      class="ui-search__input"
      type="search"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      :disabled="disabled"
      @focus="onFocus"
      @blur="onBlur"
    >

    <button
      v-if="modelValue && !disabled"
      type="button"
      class="ui-search__icon ui-search__icon--trailing"
      aria-label="Clear search"
      @click="onClear"
    >
      <slot name="clear">
        <m-icon :name="ICONS.close" />
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '#kit/shared/constants/icons'
import { mSearchProps } from './props'

defineProps(mSearchProps)

const modelValue = defineModel<string>({ default: '' })

const isFocused = defineModel<boolean>('focused', { default: false })

const fieldId = useId()

function onFocus() {
  isFocused.value = true
}

function onBlur() {
  isFocused.value = false
}

function onClear() {
  modelValue.value = ''
}
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/search' as t;

.ui-search {
  $prefix: 'md-search';
  $t: material-map(t.$tokens, $prefix);

  position: relative;
  display: inline-flex;
  align-items: center;
  gap: g($t, 'gap');
  width: 100%;
  max-width: g($t, 'max-width');
  padding-inline: g($t, 'padding-inline');
  min-height: g($t, 'min-height');
  border-radius: var(--sys-shape-corner-full);
  background-color: g($t, 'bg-color');
  color: g($t, 'text-color');
  box-shadow: 0 0 0 g($t, 'border-width') g($t, 'border-color');
  transition:
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: g($t, 'text-color');
    padding-block: g($t, 'input-padding-block');

    // Always reserve room for the absolutely-positioned clear button so its
    // appearance/removal never reflows the input (no CLS).
    padding-right: calc(#{g($t, 'icon-trailing-size')} + #{g($t, 'gap')});

    @include typescale(g($t, 'input-text-type'));

    &::placeholder {
      color: g($t, 'placeholder-color');
      opacity: 1;
    }

    &::-webkit-search-cancel-button,
    &::-webkit-search-decoration {
      appearance: none;
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: g($t, 'icon-color');

    &--trailing {
      position: absolute;
      top: 50%;
      right: g($t, 'padding-inline');
      transform: translateY(-50%);
      width: g($t, 'icon-trailing-size');
      height: g($t, 'icon-trailing-size');
      border-radius: 999rem;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;

      &:hover {
        background-color: color-mix(
          in srgb,
          #{map.get($theme-color-link, 'on-surface')} 8%,
          transparent
        );
      }
    }
  }

  &--focused {
    box-shadow: 0 0 0 g($t, 'focused-border-width') g($t, 'focused-border-color');
    background-color: g($t, 'bg-color');
  }

  &--empty {
    .ui-search__icon--leading {
      color: g($t, 'icon-color');
    }
  }

  &:hover {
    background-color: color-mix(
      in srgb,
      #{map.get($theme-color-link, 'on-surface')} 4%,
      g($t, 'bg-color')
    );
  }

  &:has(.ui-search__input:disabled) {
    opacity: g($t, 'disabled-opacity');
    cursor: default;
  }
}
</style>
