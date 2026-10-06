<template>
  <div
    class="ui-dropdown"
    :class="{
      'ui-dropdown--open': open,
      'ui-dropdown--disabled': disabled,
      'ui-dropdown--multiple': multiple,
    }"
    @click="onFieldClick"
    @keydown="onFieldKeydown"
  >
    <MTextField
      ref="fieldRef"
      v-model:focused="focused"
      class="ui-dropdown__field"
      :model-value="control.displayTitle.value"
      :populated="hasChips"
      :label="label"
      :placeholder="control.hasSelection.value ? undefined : placeholder"
      :helper-text="helperText"
      :error="isError"
      :error-message="displayError"
      :variant="variant"
      :rounded="rounded"
      :label-placement="labelPlacement"
      :density="density"
      :name="name ?? path"
      :disabled="disabled"
      :required="required"
      :autofocus="autofocus"
      readonly
      :input-attrs="control.inputAttrs.value"
    >
      <template
        v-if="$slots.prepend"
        #prepend
      >
        <slot name="prepend" />
      </template>

      <template
        v-if="hasChips"
        #leading-content
      >
        <slot
          name="selection"
          :entries="control.selectedEntries.value"
          :remove="control.removeEntry"
        >
          <MChip
            v-for="(entry, index) in control.selectedEntries.value"
            :id="control.chipId(index)"
            :key="entry.key"
            type="input"
            class="ui-dropdown__chip"
            :class="{ 'ui-dropdown__chip--active': control.chipFocus.value === index }"
            :disabled="disabled || entry.itemDisabled"
            @mousedown.prevent
            @click.stop="control.removeEntry(entry)"
          >
            <slot
              name="chip"
              :item="entry.item"
              :value="entry.value"
              :title="entry.title"
              :index="index"
              :remove="() => control.removeEntry(entry)"
            >
              {{ entry.title }}
            </slot>
            <template #trailing>
              <MIcon :name="ICONS.close" />
            </template>
          </MChip>
        </slot>
      </template>

      <template #append>
        <slot name="append" />

        <MButtonIcon
          v-if="control.canClear.value"
          type="button"
          class="ui-dropdown__clear"
          :aria-label="MESSAGES.dropdownClear"
          :disabled="disabled"
          @mousedown.prevent
          @click.stop="control.clear"
        >
          <MIcon :name="ICONS.close" />
        </MButtonIcon>

        <MIcon
          :name="ICONS.arrowDropDown"
          class="ui-dropdown__arrow"
          aria-hidden="true"
        />
      </template>
    </MTextField>

    <MMenu
      v-model="open"
      class="ui-dropdown__menu"
      absolute
      match-width
      :anchor="fieldControl"
      :origin="menuPlacement"
      @click-outside="control.closePanel"
    >
      <slot
        :entries="control.entries.value"
        :listbox-attrs="control.listboxAttrs.value"
        :get-option-attrs="control.getOptionAttrs"
        :panel-style="control.panelStyle.value"
        :active-id="control.activeId.value"
        :limit-reached="control.limitReached.value"
        :loading="loading"
        :select="control.selectEntry"
        :close="control.closePanel"
      >
        <MList
          v-bind="control.listboxAttrs.value"
          class="ui-dropdown__list"
          :density="density"
          :style="control.panelStyle.value"
          @mousedown.prevent
        >
          <MProgressLinear
            v-if="loading"
            indeterminate
            :aria-label="MESSAGES.dropdownLoading"
          />

          <MListItem
            v-for="(entry, index) in control.entries.value"
            :key="entry.key"
            v-bind="control.getOptionAttrs(entry)"
            class="ui-dropdown__option"
            :class="{ 'ui-dropdown__option--active': control.activeId.value === entry.id }"
            :interactive="true"
            :selected="entry.selected"
            :disabled="entry.disabled"
            :lines="1"
          >
            <template #leading>
              <MIcon
                v-if="entry.selected"
                :name="ICONS.check"
                class="ui-dropdown__check"
              />
            </template>

            <slot
              name="item"
              :item="entry.item"
              :index="index"
              :value="entry.value"
              :title="entry.title"
              :selected="entry.selected"
              :disabled="entry.disabled"
              :blocked="entry.blocked"
              :active="control.activeId.value === entry.id"
            >
              {{ entry.title }}
            </slot>
          </MListItem>

          <slot
            v-if="!loading && !control.entries.value.length"
            name="empty"
          >
            <div class="ui-dropdown__state">
              {{ MESSAGES.dropdownEmpty }}
            </div>
          </slot>
        </MList>
      </slot>
    </MMenu>
  </div>
</template>

<script setup lang="ts" generic="TItem extends DropdownItemBase, TValue = TItem">
import { computed, nextTick, ref, watch } from 'vue'
import { mDropdownProps } from './props'
import type { MDropdownEmits } from './props'
import type { MFieldParts } from '#kit/components/ui/text-field/props'
import { provideDropdownContext } from './context'
import { useDropdownControl } from '#kit/composables/dropdown/useDropdownControl'
import type { DropdownContext, DropdownItemBase } from '#kit/composables/dropdown/types'
import { useField } from '#kit/composables/useField'
import { ICONS } from '#kit/shared/constants/icons'
import { MESSAGES } from '#kit/shared/constants/messages'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MChip from '#kit/components/ui/chip/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MList from '#kit/components/ui/list/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MProgressLinear from '#kit/components/ui/progress/linear/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'

const props = defineProps(mDropdownProps)
const emit = defineEmits<MDropdownEmits<TItem>>()

const model = defineModel<TValue | TValue[] | undefined>()
const open = defineModel<boolean>('open', { default: false })

const focused = ref(false)
const fieldRef = ref<MFieldParts | null>(null)

const fieldControl = computed(() => fieldRef.value?.control ?? null)

const field = useField<TValue | TValue[] | undefined>({ path: props.path, model })

const isError = computed(() => props.error || Boolean(props.errorMessage) || field.hasError.value)
const displayError = computed(() => field.errorMessage.value ?? props.errorMessage)

const control = useDropdownControl<TItem, TValue>({
  props,
  model,
  open,
  onSelect: entry => emit('select', entry.item),
  onRemove: entry => emit('remove', entry.item),
  onClear: () => emit('clear'),
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
})

const hasChips = computed(() => props.multiple && control.selectedEntries.value.length > 0)

// A click can land on the box, the label or the arrow — none of which is
// focusable — so the input is focused whenever the panel opens. Without it the
// combobox has no DOM focus, and `aria-activedescendant` points from nowhere.
watch(open, (value) => {
  if (value) nextTick(() => fieldRef.value?.input?.focus())
})

const onFieldClick = () => {
  if (props.disabled || props.readonly) {
    return
  }

  control.togglePanel()
}

const onFieldKeydown = (event: KeyboardEvent) => {
  if (event.target === fieldRef.value?.input) {
    return
  }

  control.onKeydown(event)
}

provideDropdownContext(control.context as unknown as DropdownContext)

defineExpose({ open: control.openPanel, close: control.closePanel, clear: control.clear })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dropdown' as t;

.ui-dropdown {
  $t: t.$tokens;

  position: relative;
  width: 100%;
  min-width: 0;
  cursor: pointer;

  &--disabled {
    cursor: default;
  }

  &__field {
    cursor: inherit;
  }

  &__chip--active {
    box-shadow: inset 0 0 0 2rem g($t, 'chip.active-outline');
  }

  // `.ui-button` is repeated to outweigh the button's own two-class colour rule
  // (`.ui-button.ui-button--text`) without depending on stylesheet order.
  &__clear.ui-button.ui-button {
    color: g($t, 'clear.color');

    @include can-hover {
      &:hover:not(.ui-button--disabled) {
        color: g($t, 'clear.active-color');
      }
    }

    &:focus-visible {
      color: g($t, 'clear.active-color');
    }
  }

  &__arrow {
    font-size: g($t, 'arrow.size');
    color: g($t, 'arrow.color');
    transition: transform g($t, 'motion.duration') g($t, 'motion.easing');
  }

  &--open &__arrow {
    transform: rotate(180deg);
  }

  &__list {
    max-height: var(--m-dropdown-panel-max-height, #{g($t, 'panel.max-height')});
    padding-block: g($t, 'panel.padding-block');
    overflow-y: auto;
  }

  &__option--active:not(.ui-list-item--selected) {
    background-color: g($t, 'option.active-bg');
  }

  &__state {
    padding: g($t, 'state.padding');
    color: g($t, 'state.color');
  }
}
</style>
