<template>
  <div
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
        :model-value="multiple ? '' : selectedLabel"
        :focused="fieldFocused"
        readonly
        :disabled="disabled"
        :variant="variant"
        class="ui-dropdown__field"
        :class="{ 'ui-dropdown__field--multiple': multiple && selectedItems.length }"
      >
        <template
          v-if="multiple && selectedItems.length"
          #prepend
        >
          <div class="ui-dropdown__chips">
            <!-- Whole-area override; defaults to a chip per selected item. -->
            <slot
              name="selected"
              :items="selectedItems"
              :remove="remove"
            >
              <template
                v-for="(item, index) in selectedItems"
                :key="item.value ?? item.id ?? index"
              >
                <!-- Per-item wrapper; falls back to an input chip with a remove affordance. -->
                <slot
                  name="chip"
                  :item="item"
                  :index="index"
                  :remove="() => remove(item)"
                >
                  <m-chip
                    variant="input"
                    class="ui-dropdown__chip"
                    @click.stop
                  >
                    {{ item.label }}
                    <template #trailing>
                      <m-icon
                        :name="ICONS.close"
                        @click.stop="remove(item)"
                      />
                    </template>
                  </m-chip>
                </slot>
              </template>
            </slot>
          </div>
        </template>

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
      match-width
      :origin="menuOrigin"
      @click-outside="isOpen = false"
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

<script setup lang="ts" generic="T extends DropdownItem">
import { ICONS } from '~~/shared/constants/icons'
import type { UiMenuOrigin } from '~/components/ui/menu/types'
import type { DropdownOption, DropdownItem } from './types'

interface Props {
  path?: string
  label?: string
  placeholder?: string
  options?: DropdownOption[]
  items?: T[]
  disabled?: boolean
  variant?: 'filled' | 'outlined'
  menuOrigin?: UiMenuOrigin
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '',
  label: '',
  placeholder: '',
  options: () => [],
  items: () => [],
  disabled: false,
  variant: 'filled',
  menuOrigin: 'top left',
  multiple: false,
})

const modelValue = defineModel<any>()
const isOpen = ref(false)

const valueOf = (option: any) => option?.value ?? option?.id ?? option

// Resolve a raw model value back to its source item (items first, then options)
// so the chips can render a label; unknown values still surface as a bare chip.
const resolveItem = (val: any) => {
  const source = props.items?.length ? props.items : props.options
  return source.find((o: any) => valueOf(o) === val) ?? { value: val, label: String(val) }
}

// Selected entries shown as chips in multiple mode.
const selectedItems = computed(() => {
  if (!props.multiple) {
    return []
  }

  const vals = Array.isArray(modelValue.value) ? modelValue.value : []
  return vals.map(resolveItem)
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

// True when the dropdown holds a value (a chip in multiple mode, a label in single).
const hasSelection = computed(() =>
  props.multiple ? selectedItems.value.length > 0 : !!selectedLabel.value)

// Float the field label (focused look) while the menu is open or a value is
// present — otherwise the label would overlap the chips / selected text.
const fieldFocused = computed(() => isOpen.value || hasSelection.value)

function toggle() {
  if (props.disabled) {
    return
  }

  isOpen.value = !isOpen.value
}

function select(option: any) {
  const val = valueOf(option)

  // Multiple: toggle membership and keep the menu open for further picks.
  if (props.multiple) {
    const current = Array.isArray(modelValue.value) ? modelValue.value : []
    modelValue.value = current.includes(val)
      ? current.filter((v: any) => v !== val)
      : [...current, val]
    return
  }

  modelValue.value = val
  isOpen.value = false
}

function remove(item: any) {
  const val = valueOf(item)
  const current = Array.isArray(modelValue.value) ? modelValue.value : []
  modelValue.value = current.filter((v: any) => v !== val)
}

function isSelected(option: any) {
  const val = valueOf(option)

  if (props.multiple) {
    return Array.isArray(modelValue.value) && modelValue.value.includes(val)
  }

  return modelValue.value === val
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/dropdown' as *;

.ui-dropdown {
  $prefix: 'm-dropdown';
  $t: material-map($tokens, $prefix);

  position: relative;
  width: 100%;

  &__trigger {
    cursor: pointer;
  }

  &__field {
    pointer-events: none;
  }

  // Selected-value chips live inside the trigger's prepend slot. The field
  // itself is pointer-events:none (the wrapper handles the toggle); chips opt
  // back in so their remove affordance stays clickable.
  &__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: g($t, 'list-padding-vertical');
    pointer-events: auto;
  }

  &__chip {
    cursor: pointer;
  }

  &__field--multiple :deep(.ui-text-field__control) {
    height: auto;
    flex-wrap: wrap;
  }

  &__arrow {
    transition: transform g($t, 'state-duration') g($t, 'state-easing');
    font-size: g($t, 'arrow-size');
    color: g($t, 'arrow-color');
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
      margin-top: g($t, 'menu-margin-top');
    }
  }

  &__list {
    padding: g($t, 'list-padding-vertical') 0;
  }
}
</style>
