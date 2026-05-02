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
.ui-search {
  display: inline-flex;
  align-items: center;
  gap: 8rem;
  width: 100%;
  max-width: 720rem;
  padding-inline: 16rem;
  min-height: 56rem;
  border-radius: var(--sys-shape-corner-full);
  background-color: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  box-shadow: 0 0 0 1rem var(--color-outline-variant);
  transition:
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &__input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-on-surface);
    padding-block: 8rem;

    // Typography: Body Large
    @include typescale('body-large');

    &::placeholder {
      color: var(--color-on-surface-variant);
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
    color: var(--color-on-surface-variant);

    &--trailing {
      width: 40rem;
      height: 40rem;
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
    box-shadow: 0 0 0 2rem var(--color-primary);
    background-color: var(--color-surface-container-highest);
  }

  &--empty {
    .ui-search__icon--leading {
      color: var(--color-on-surface-variant);
    }
  }

  &:hover {
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 4%,
      var(--color-surface-container-highest)
    );
  }

  &:has(.ui-search__input:disabled) {
    opacity: 0.38;
    cursor: default;
  }
}
</style>
