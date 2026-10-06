<template>
  <div
    class="ui-autocomplete"
    :class="{ 'ui-autocomplete--open': open, 'ui-autocomplete--multiple': multiple }"
    @keydown="onFieldKeydown"
  >
    <MTextField
      ref="fieldRef"
      v-model:focused="control.focused.value"
      class="ui-autocomplete__field"
      :model-value="control.draft.value"
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
      :readonly="readonly"
      :required="required"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :input-attrs="control.inputAttrs.value"
      @update:model-value="control.onInput"
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
            class="ui-autocomplete__chip"
            :class="{ 'ui-autocomplete__chip--active': control.chipFocus.value === index }"
            :disabled="disabled || readonly || entry.itemDisabled"
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
          class="ui-autocomplete__clear"
          :aria-label="MESSAGES.dropdownClear"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="control.clearQuery"
        >
          <MIcon :name="ICONS.close" />
        </MButtonIcon>

        <MButtonIcon
          type="button"
          class="ui-autocomplete__toggle"
          :aria-label="MESSAGES.dropdownToggle"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="control.togglePanel"
        >
          <MIcon :name="open ? ICONS.arrowDropUp : ICONS.arrowDropDown" />
        </MButtonIcon>
      </template>
    </MTextField>

    <MMenu
      v-model="open"
      class="ui-autocomplete__menu"
      absolute
      match-width
      :anchor="fieldControl"
      :origin="menuPlacement"
      @click-outside="control.closeAndRestore"
    >
      <slot
        :entries="control.entries.value"
        :listbox-attrs="control.listboxAttrs.value"
        :get-option-attrs="control.getOptionAttrs"
        :panel-style="control.panelStyle.value"
        :active-id="control.activeId.value"
        :query="search"
        :loading="loading"
        :select="control.selectEntry"
        :close="control.closePanel"
      >
        <MList
          v-bind="control.listboxAttrs.value"
          class="ui-autocomplete__list"
          :density="density"
          :style="control.panelStyle.value"
          @mousedown.prevent
        >
          <MProgressLinear
            v-if="loading"
            indeterminate
            :aria-label="MESSAGES.dropdownLoading"
          />

          <slot
            v-if="loading"
            name="loading"
          >
            <div class="ui-autocomplete__state">
              {{ MESSAGES.dropdownLoading }}
            </div>
          </slot>

          <template v-else-if="control.entries.value.length">
            <MListItem
              v-for="(entry, index) in control.entries.value"
              :key="entry.key"
              v-bind="control.getOptionAttrs(entry)"
              class="ui-autocomplete__option"
              :class="{ 'ui-autocomplete__option--active': control.activeId.value === entry.id }"
              :interactive="true"
              :selected="entry.selected"
              :disabled="entry.disabled"
              :lines="1"
            >
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
          </template>

          <slot
            v-else-if="!items.length"
            name="empty"
          >
            <div class="ui-autocomplete__state">
              {{ MESSAGES.dropdownEmpty }}
            </div>
          </slot>

          <slot
            v-else
            name="no-results"
            :query="search"
          >
            <div class="ui-autocomplete__state">
              {{ MESSAGES.dropdownNoResults }}
            </div>
          </slot>
        </MList>
      </slot>
    </MMenu>
  </div>
</template>

<script setup lang="ts" generic="TItem extends DropdownItemBase, TValue = TItem">
import { computed, nextTick, ref, watch } from 'vue'
import { mAutocompleteProps } from './props'
import type { MFieldParts } from '#kit/components/ui/text-field/props'
import { useAutocomplete } from '#kit/composables/autocomplete/useAutocomplete'
import type { AutocompleteControlConfig } from '#kit/composables/autocomplete/useAutocomplete'
import { provideDropdownContext } from '#kit/components/ui/dropdown/context'
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

const props = defineProps(mAutocompleteProps)

const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (event: 'select' | 'remove', item: TItem): void
  (event: 'clear' | 'open' | 'close'): void
}>()

const fieldRef = ref<MFieldParts | null>(null)

// Anchor to the drawn container: the root's box also holds the support line,
// and the menu would otherwise open below the helper text.
const fieldControl = computed(() => fieldRef.value?.control ?? null)

// Keystrokes starting on the input are handled by its own bag; a chip that
// took focus bubbles here instead.
function onFieldKeydown(event: KeyboardEvent) {
  if (event.target === fieldRef.value?.input) return
  control.onKeydown(event)
}

// Validation binds the selection, not the text being typed into the box.
const field = useField<TValue | TValue[] | undefined>({ path: props.path, model })

const isError = computed(() => props.error || Boolean(props.errorMessage) || field.hasError.value)
const displayError = computed(() => field.errorMessage.value ?? props.errorMessage)

const control = useAutocomplete<TItem, TValue>({
  props: props as AutocompleteControlConfig,
  model,
  search,
  open,
  emit,
})

const hasChips = computed(() => props.multiple && control.selectedEntries.value.length > 0)

// Opening from the toggle button leaves focus nowhere useful; the combobox
// needs DOM focus for `aria-activedescendant` to point from anything.
watch(open, (value) => {
  if (value) nextTick(() => fieldRef.value?.input?.focus())
})

provideDropdownContext(control.context as unknown as DropdownContext)

defineExpose({ open: control.openPanel, close: control.closeAndRestore, clear: control.clearQuery })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/autocomplete' as t;

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

  // `.ui-button` is repeated to outweigh the button's own two-class colour rule
  // (`.ui-button.ui-button--text`) without depending on stylesheet order.
  &__clear.ui-button.ui-button,
  &__toggle.ui-button.ui-button {
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

  &__list {
    max-height: var(--m-dropdown-panel-max-height, #{g($t, 'menu.max-height')});
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
