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
import type { UiMenuOrigin } from '~/components/ui/menu/index.vue'

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
  if (props.disabled) return
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
    font-size: 24rem;
    color: var(--color-on-surface-variant);
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
      margin-top: 4rem;
    }
  }
}

.ui-list__item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48rem;
  padding: 0 12rem;
  background-color: transparent;
  color: var(--color-on-surface);
  border: none;
  cursor: pointer;
  font-family: var(--sys-typescale-label-large-font-family-name);
  font-weight: var(--sys-typescale-label-large-font-weight);
  font-size: var(--sys-typescale-label-large-font-size);
  line-height: var(--sys-typescale-label-large-line-height);
  letter-spacing: var(--sys-typescale-label-large-letter-spacing);
  transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  &:hover {
    background-color: color-mix(in srgb, var(--color-on-surface) 8%, transparent);
  }

  &--selected {
    // According to M3, selected items might use primary container, but hover should be based on on-surface or on-primary-container
    // Let's use primary container if it was here, but with proper hover
    background-color: var(--color-primary-container);
    color: var(--color-on-primary-container);

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary-container) 92%, var(--color-on-primary-container) 8%);
    }
  }
}

.ui-list__leading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24rem;
  height: 24rem;
  margin-right: 12rem;

  .ui-icon {
    font-size: 24rem;
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
