<template>
  <div class="ui-segmented-button">
    <button
      v-for="(item, index) in items"
      :key="item.value"
      v-ripple="!item.disabled"
      class="ui-segmented-button__segment"
      :class="{
        'ui-segmented-button__segment--selected': isSelected(item.value),
      }"
      :disabled="item.disabled"
      @click="selectItem(item.value)"
    >
      <span
        v-if="isSelected(item.value) || item.icon"
        class="ui-segmented-button__icon"
      >
        <UiIcon
          v-if="isSelected(item.value)"
          name="ic:baseline-check"
        />
        <UiIcon
          v-else-if="item.icon"
          :name="item.icon"
        />
      </span>
      <span
        v-if="item.label"
        class="ui-segmented-button__label"
      >{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import UiIcon from '~/components/ui/icon/index.vue'

export interface UiSegmentedItem {
  label?: string
  icon?: string
  value: string | number
  disabled?: boolean
}

interface Props {
  items: UiSegmentedItem[]
  modelValue?: string | number | (string | number)[]
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  multiple: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | (string | number)[]): void
}>()

function isSelected(val: string | number) {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(val)
  }
  return props.modelValue === val
}

function selectItem(val: string | number) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    if (current.includes(val)) {
      emit('update:modelValue', current.filter(i => i !== val))
    } else {
      emit('update:modelValue', [...current, val])
    }
  } else {
    emit('update:modelValue', val)
  }
}
</script>

<style lang="scss">
.ui-segmented-button {
  display: inline-flex;
  align-items: stretch;
  height: 40rem;
  border-radius: var(--sys-shape-corner-full, 100vmax);
  border: 1rem solid var(--color-outline);
  overflow: hidden;

  &__segment {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding-inline: 12rem;
    gap: 8rem;
    background: transparent;
    color: var(--color-on-surface);
    border: none;
    border-right: 1rem solid var(--color-outline);
    cursor: pointer;
    @include typescale('label-large');
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
                color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:last-child {
      border-right: none;
    }

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
    }

    &:active:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, transparent);
    }

    &--selected {
      background-color: var(--color-accent-container);
      color: var(--color-accent-container-contrast, var(--color-on-surface));

      &:hover:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-accent-container-contrast, var(--color-on-surface)) 8%, var(--color-accent-container));
      }

      &:active:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-accent-container-contrast, var(--color-on-surface)) 12%, var(--color-accent-container));
      }
    }

    &:disabled {
      color: color-mix(in srgb, var(--color-on-surface) 38%, transparent);
      cursor: default;
    }
  }

  &__icon {
    font-size: 18rem;
    display: inline-flex;
  }
}
</style>
