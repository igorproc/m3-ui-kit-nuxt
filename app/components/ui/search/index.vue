<template>
  <div
    class="ui-search"
    :class="{
      'ui-search--focused': isFocused,
      'ui-search--empty': !modelValue,
    }"
  >
    <ui-icon
      class="ui-search__icon ui-search__icon--leading"
      name="baseline-search"
      aria-hidden="true"
    />

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
      <ui-icon name="baseline-close" />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Search',
  ariaLabel: undefined,
  disabled: false,
})

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
@use '~/assets/stylesheet/components/search' as v;

.ui-search {
  display: inline-flex;
  align-items: center;
  gap: v.$gap;
  width: 100%;
  max-width: v.$max-width;
  padding-inline: v.$padding-inline;
  min-height: v.$min-height;
  border-radius: v.$border-radius;
  background-color: v.$bg-color-default;
  color: v.$text-color-default;
  box-shadow: 0 0 0 v.$border-width-default v.$border-color-default;
  transition:
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: v.$text-color-default;
    padding-block: v.$input-padding-block;

    @include typescale(v.$input-text-type);

    &::placeholder {
      color: v.$placeholder-color;
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
    color: v.$icon-color;

    &--trailing {
      width: v.$trailing-icon-size;
      height: v.$trailing-icon-size;
      border-radius: 999rem;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;

      &:hover {
        background-color: color-mix(
          in srgb,
          var(--color-on-surface) 8%,
          transparent
        );
      }
    }
  }

  &--focused {
    box-shadow: 0 0 0 v.$focused-border-width v.$focused-border-color;
    background-color: v.$bg-color-default;
  }

  &--empty {
    .ui-search__icon--leading {
      color: v.$icon-color;
    }
  }

  &:hover {
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 4%,
      v.$bg-color-default
    );
  }

  &:has(.ui-search__input:disabled) {
    opacity: v.$disabled-opacity;
    cursor: default;
  }
}
</style>
