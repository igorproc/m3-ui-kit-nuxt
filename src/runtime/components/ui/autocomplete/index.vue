<template>
  <div
    v-bind="rootAttrs()"
    class="ui-autocomplete"
    :class="{ 'ui-autocomplete--open': open, 'ui-autocomplete--multiple': multiple }"
    @keydown.capture="keyboardCursor = true"
    @pointerdown="keyboardCursor = false"
    @keydown="onFieldKeydown"
  >
    <MTextField
      v-bind="controlAttrs()"
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

        <!-- Not a tab stop (APG): the combobox already opens from the keyboard,
             so the button is for the pointer and would only add a stop. -->
        <MButtonIcon
          type="button"
          class="ui-autocomplete__toggle"
          tabindex="-1"
          :aria-label="MESSAGES.dropdownToggle"
          :aria-expanded="String(open)"
          :aria-controls="control.listboxId"
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
        <!-- Progress and the state messages sit beside the listbox, not in it:
             a listbox may only own options. -->
        <div
          class="ui-autocomplete__panel"
          @mousedown.prevent
          @pointermove="keyboardCursor = false"
        >
          <MProgressLinear
            v-if="loading"
            class="ui-autocomplete__progress"
            indeterminate
            :aria-label="MESSAGES.dropdownLoading"
          />

          <!-- Rows stay while a new query loads: a refresh keeps what the user
               was reading, and the active row survives the round trip. -->
          <MList
            v-bind="control.listboxAttrs.value"
            class="ui-autocomplete__list"
            :density="density"
            :style="control.panelStyle.value"
          >
            <MListItem
              v-for="(entry, index) in control.entries.value"
              :key="entry.key"
              v-bind="control.getOptionAttrs(entry)"
              class="ui-autocomplete__option"
              :class="optionClasses(entry)"
              :interactive="true"
              :selected="entry.selected"
              :disabled="entry.disabled"
              :lines="1"
            >
              <template #leading>
                <MIcon
                  v-if="entry.selected"
                  :name="ICONS.check"
                  class="ui-autocomplete__check"
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
                <span class="ui-autocomplete__option-title">{{ entry.title }}</span>
              </slot>
            </MListItem>
          </MList>

          <div ref="stateRef">
            <template v-if="!control.entries.value.length">
              <slot
                v-if="loading"
                name="loading"
              >
                <div class="ui-autocomplete__state">
                  {{ MESSAGES.dropdownLoading }}
                </div>
              </slot>

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
            </template>
          </div>
        </div>
      </slot>
    </MMenu>

    <span
      class="ui-autocomplete__status"
      role="status"
    >{{ status }}</span>
  </div>
</template>

<script setup lang="ts" generic="TItem extends DropdownItemBase, TValue = TItem">
import { computed, nextTick, ref, watch } from 'vue'
import { mAutocompleteProps } from './props'
import type { MFieldParts } from '#kit/components/ui/text-field/props'
import { useAutocomplete } from '#kit/composables/autocomplete/useAutocomplete'
import type { AutocompleteControlConfig } from '#kit/composables/autocomplete/useAutocomplete'
import { provideDropdownContext } from '#kit/components/ui/dropdown/context'
import { usePanelStatus } from '#kit/composables/dropdown/usePanelStatus'
import type { DropdownContext, DropdownEntry, DropdownItemBase } from '#kit/composables/dropdown/types'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
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

// The root is a wrapper; aria-*, inputmode and listeners belong on the combobox.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

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

// Hovering a row also makes it active, so the ring that marks keyboard focus
// is drawn only while the keyboard drives.
const keyboardCursor = ref(false)

const optionClasses = (entry: DropdownEntry<TItem, TValue>) => {
  const active = control.activeId.value === entry.id
  return {
    'ui-autocomplete__option--active': active,
    'ui-autocomplete__option--keyboard': active && keyboardCursor.value,
  }
}

const stateRef = ref<HTMLElement | null>(null)
const status = usePanelStatus({
  open: () => open.value,
  loading: () => props.loading,
  hasRows: () => control.entries.value.length > 0,
  loadingText: MESSAGES.dropdownLoading,
  state: () => stateRef.value,
  sources: () => [props.items.length],
})

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

  // The chip Backspace would delete. Real focus stays in the input, so this is
  // the chip's own focus ring drawn by hand — inset, so the field's scrolling
  // row cannot clip it.
  &__chip--active.ui-chip {
    @include focus-ring(inset);

    @include forced-colors {
      outline-color: Highlight;
    }
  }

  // `.ui-button` is repeated to outweigh the button's own two-class colour rule
  // (`.ui-button.ui-button--text`) without depending on stylesheet order.
  @each $part in clear, toggle {
    &__#{$part}.ui-button.ui-button {
      color: g($t, '#{$part}.color');

      @include can-hover {
        &:hover:not(.ui-button--disabled) {
          color: g($t, '#{$part}.active-color');
        }
      }

      &:focus-visible {
        color: g($t, '#{$part}.active-color');
      }
    }
  }

  // Progress lies over the panel's top edge instead of pushing the rows down,
  // so a refresh on every keystroke does not make the panel jump.
  &__panel {
    position: relative;
    isolation: isolate;
  }

  &__progress {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: 1;
  }

  &__list {
    --ui-scrollbar-inset-block: #{g($t, 'panel.scrollbar-inset')};

    max-height: var(--m-dropdown-panel-max-height, #{g($t, 'panel.max-height')});
    padding-block: g($t, 'panel.padding-block');
    overflow-y: auto;
    overscroll-behavior: contain;

    // Filtering adds and removes the scrollbar; a stable gutter keeps the
    // rows from changing width under the user's eyes.
    scrollbar-gutter: stable;
  }

  &__option--active:not(.ui-list-item--selected) {
    background-color: g($t, 'option.active.bg');
  }

  &__option--active.ui-list-item--selected {
    background-color: g($t, 'option.active.selected-bg');
  }

  // Keyboard focus on a row is the kit's focus ring, as on any other item; the
  // fill alone is what hover also draws.
  &__option--keyboard.ui-list-item {
    @include focus-ring(inset);

    @include forced-colors {
      outline-color: Highlight;
    }
  }

  // A row wraps rather than truncating — a choice has to be readable — and an
  // unbreakable string (a URL, an e-mail) breaks too, instead of widening the
  // panel into a horizontal scroll.
  &__option-title {
    overflow-wrap: anywhere;
  }

  &__state {
    padding: g($t, 'state.padding');
    color: g($t, 'state.color');
  }

  &__status {
    @include sr-only;
  }
}
</style>
