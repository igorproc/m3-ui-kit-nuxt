<template>
  <div
    class="ui-autocomplete"
    :class="{ 'ui-autocomplete--open': open, 'ui-autocomplete--multiple': multiple }"
  >
    <MTextField
      v-model:focused="focused"
      :model-value="draft"
      :populated="multiple && selectedEntries.length > 0"
      :label="label"
      :placeholder="placeholder"
      :helper-text="helperText"
      :error="error"
      :error-message="errorMessage"
      :variant="variant"
      :path="path"
      :name="name"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      autocomplete="off"
      :input-attrs="inputAttrs"
      @update:model-value="onInput"
    >
      <template
        v-if="multiple && selectedEntries.length"
        #leading-content
      >
        <template
          v-for="(entry, index) in selectedEntries"
          :key="entry.key"
        >
          <slot
            name="selection"
            :item="entry.item"
            :value="entry.value"
            :title="entry.title"
            :active="chipFocus === index"
            :remove="() => remove(entry)"
          >
            <MChip
              :id="chipId(index)"
              type="input"
              class="ui-autocomplete__chip"
              :class="{ 'ui-autocomplete__chip--active': chipFocus === index }"
              :disabled="disabled || readonly"
              @click.stop="remove(entry)"
            >
              {{ entry.title }}
              <template #trailing>
                <MIcon name="round-close" />
              </template>
            </MChip>
          </slot>
        </template>
      </template>

      <template #append>
        <MButtonIcon
          v-if="clearable && canClear"
          type="button"
          aria-label="Clear selection"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="clear"
        >
          <MIcon name="round-close" />
        </MButtonIcon>

        <MButtonIcon
          type="button"
          aria-label="Toggle options"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="toggle"
        >
          <MIcon :name="open ? 'round-arrow-drop-up' : 'round-arrow-drop-down'" />
        </MButtonIcon>
      </template>
    </MTextField>

    <MMenu
      v-model="open"
      class="ui-autocomplete__menu"
      absolute
      match-width
      origin="top left"
      @click-outside="closeAndRestore"
    >
      <MList
        :id="listboxId"
        class="ui-autocomplete__list"
        role="listbox"
        :aria-multiselectable="multiple ? 'true' : undefined"
        @mousedown.prevent
      >
        <MProgressLinear
          v-if="loading"
          indeterminate
          aria-label="Loading options"
        />

        <slot
          v-if="loading"
          name="loading"
        >
          <div class="ui-autocomplete__state">
            Loading…
          </div>
        </slot>
        <template v-else-if="visibleEntries.length">
          <MListItem
            v-for="(entry, index) in visibleEntries"
            :id="entry.id"
            :key="entry.key"
            class="ui-autocomplete__option"
            :class="{ 'ui-autocomplete__option--active': activeIndex === index }"
            role="option"
            :lines="1"
            :interactive="true"
            :selected="isSelected(entry.value)"
            :disabled="entry.disabled"
            :aria-selected="isSelected(entry.value)"
            :aria-disabled="entry.disabled ? 'true' : undefined"
            @pointermove="setActive(index)"
            @click="select(entry)"
          >
            <slot
              name="item"
              :item="entry.item"
              :value="entry.value"
              :title="entry.title"
              :selected="isSelected(entry.value)"
              :disabled="entry.disabled"
            >
              {{ entry.title }}
            </slot>
          </MListItem>
        </template>
        <slot
          v-else-if="!items.length"
          name="empty"
        >
          <div class="ui-autocomplete__state">
            No options
          </div>
        </slot>
        <slot
          v-else
          name="no-results"
          :query="search"
        >
          <div class="ui-autocomplete__state">
            No results
          </div>
        </slot>
      </MList>
    </MMenu>
  </div>
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
import { mAutocompleteProps } from './props'
import { useAutocomplete } from '~/composables/autocomplete/useAutocomplete'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import MChip from '~/components/ui/chip/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import MList from '~/components/ui/list/index.vue'
import MListItem from '~/components/ui/list/item/index.vue'
import MMenu from '~/components/ui/menu/index.vue'
import MProgressLinear from '~/components/ui/progress/linear/index.vue'
import MTextField from '~/components/ui/text-field/index.vue'

const props = defineProps(mAutocompleteProps)
const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  (event: 'select' | 'remove', item: TItem): void
  (event: 'clear' | 'open' | 'close'): void
}>()

const {
  focused,
  draft,
  listboxId,
  chipFocus,
  chipId,
  visibleEntries,
  selectedEntries,
  isSelected,
  activeIndex,
  canClear,
  inputAttrs,
  setActive,
  onInput,
  select,
  remove,
  clear,
  toggle,
  closeAndRestore,
} = useAutocomplete<TItem, TValue>({ props, model, search, open, emit })
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/autocomplete' as t;

.ui-autocomplete {
  $t: t.$tokens;

  position: relative;
  width: 100%;
  min-width: 0;

  // Keyboard-focused chip (arrow navigation) gets a ring so the delete target
  // is obvious without moving real DOM focus off the input.
  &__chip--active {
    // Inset ring so the highlight is never clipped by the field's overflow.
    box-shadow: inset 0 0 0 2rem g($t, 'chip.active-outline');
  }

  &__menu :deep(.ui-menu__surface) {
    width: 100%;
    min-width: unset;
    top: 0;
    right: 0;
    margin-top: g($t, 'menu.margin-top');
  }

  &__list {
    max-height: g($t, 'menu.max-height');
    padding-block: g($t, 'list.padding-block');
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
