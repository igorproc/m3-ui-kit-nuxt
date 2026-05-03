<template>
  <div
    ref="dropdownRef"
    class="ui-dropdown"
    :class="{ 'ui-dropdown--open': isOpen, 'ui-dropdown--disabled': disabled }"
  >
    <div
      class="ui-dropdown__trigger"
      @click="toggle"
    >
      <ui-text-field
        :path="path || ''"
        :label="label"
        :placeholder="placeholder"
        :model-value="selectedLabel"
        readonly
        :disabled="disabled"
        :variant="variant"
        class="ui-dropdown__field"
      >
        <template #append>
          <ui-icon
            name="baseline-arrow-drop-down"
            class="ui-dropdown__arrow"
          />
        </template>
      </ui-text-field>
    </div>

    <ui-menu
      v-model="isOpen"
      class="ui-dropdown__menu"
      absolute
      :origin="menuOrigin"
    >
      <ui-list>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="ui-list__item"
          :class="{ 'ui-list__item--selected': isSelected(option) }"
          @click="select(option)"
        >
          <span class="ui-list__leading">
            <ui-icon
              v-if="isSelected(option)"
              name="baseline-check"
            />
          </span>
          <span class="ui-list__label">{{ option.label }}</span>
        </button>
      </ui-list>
    </ui-menu>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { UiMenuOrigin } from '~/components/ui/menu/index'

interface Option {
  label: string
  value: any
}

interface Props {
  path?: string
  label?: string
  placeholder?: string
  options: Option[]
  disabled?: boolean
  variant?: 'filled' | 'outlined'
  menuOrigin?: UiMenuOrigin
}

const props = withDefaults(defineProps<Props>(), {
  path: undefined,
  label: undefined,
  placeholder: undefined,
  disabled: false,
  variant: 'filled',
  menuOrigin: 'top left',
})

const modelValue = defineModel<any>()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === modelValue.value)
  return option ? option.label : ''
})

function toggle() {
  if (props.disabled) {
    return
  }

  isOpen.value = !isOpen.value
}

function select(option: Option) {
  modelValue.value = option.value
  isOpen.value = false
}

function isSelected(option: Option) {
  return modelValue.value === option.value
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/dropdown' as v;

.ui-dropdown {
  position: relative;
  width: 100%;

  &__trigger {
    cursor: pointer;
  }

  &__field {
    pointer-events: none; // Click is handled by trigger div
  }

  &__arrow {
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    font-size: v.$arrow-size;
    color: v.$arrow-color;
  }

  &--open &__arrow {
    transform: rotate(180deg);
  }

  &--disabled &__trigger {
    cursor: default;
  }

  &__menu {
    :deep(.ui-menu__surface) {
      width: 100%;
      min-width: unset;
      top: 0;
      right: 0;
      margin-top: v.$menu-margin-top;
    }
  }
}

.ui-list__item {
  display: flex;
  align-items: center;
  width: 100%;
  height: v.$list-item-height;
  padding: v.$list-item-padding;
  background-color: transparent;
  color: v.$list-item-color;
  border: none;
  cursor: pointer;
  transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(v.$list-item-text-type);

  &:hover {
    background-color: v.$list-item-hover-bg;
  }

  &--selected {
    background-color: v.$list-item-selected-bg;
    color: v.$list-item-selected-color;

    &:hover {
      background-color: color-mix(in srgb, v.$list-item-selected-bg 92%, v.$list-item-selected-color 8%);
    }
  }
}

.ui-list__leading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: v.$list-leading-size;
  height: v.$list-leading-size;
  margin-right: v.$list-leading-margin-right;

  .ui-icon {
    font-size: v.$list-leading-size;
  }
}

.ui-list__label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
