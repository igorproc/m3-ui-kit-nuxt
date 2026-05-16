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
      <m-text-field
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
          <m-icon
            :name="ICONS.arrowDropDown"
            class="ui-dropdown__arrow"
          />
        </template>
      </m-text-field>
    </div>

    <m-menu
      v-model="isOpen"
      class="ui-dropdown__menu"
      absolute
      :origin="menuOrigin"
    >
      <m-list class="ui-dropdown__list">
        <!-- List-style generic slot -->
        <template v-if="items?.length">
          <slot
            v-for="(item, index) in items"
            :key="item.id || index"
            :item="item"
            :index="index"
            :selected="isSelected(item)"
            :on-select="() => select(item)"
          />
        </template>

        <!-- Default slot for manual items -->
        <slot v-else-if="$slots.default" />

        <!-- Fallback to options loop -->
        <template v-else>
          <m-dropdown-item
            v-for="option in options"
            :key="option.value"
            :selected="isSelected(option)"
            @click="select(option)"
          >
            {{ option.label }}
          </m-dropdown-item>
        </template>
      </m-list>
    </m-menu>
  </div>
</template>

<script setup lang="ts" generic="T extends { id?: string | number, value?: any, label?: string }">
import { ICONS } from '~~/shared/constants/icons'
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
  options?: Option[]
  items?: T[]
  disabled?: boolean
  variant?: 'filled' | 'outlined'
  menuOrigin?: UiMenuOrigin
}

const props = withDefaults(defineProps<Props>(), {
  path: undefined,
  label: undefined,
  placeholder: undefined,
  options: () => [],
  items: () => [],
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
  // Check in items first
  if (props.items?.length) {
    const item = props.items.find(i => (i.value ?? i.id) === modelValue.value)
    return item?.label || ''
  }
  // Fallback to options
  const option = props.options.find(o => o.value === modelValue.value)
  return option ? option.label : ''
})

function toggle() {
  if (props.disabled) {
    return
  }

  isOpen.value = !isOpen.value
}

function select(option: any) {
  modelValue.value = option.value ?? option.id ?? option
  isOpen.value = false
}

function isSelected(option: any) {
  const val = option.value ?? option.id ?? option
  return modelValue.value === val
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
    pointer-events: none;
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

  &__list {
    padding: 8rem 0;
  }
}
</style>
