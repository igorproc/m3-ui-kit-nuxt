<template>
  <div
    v-bind="rootAttrs()"
    class="ui-autocomplete"
    :class="{ 'ui-autocomplete--open': open }"
    @click="onFieldClick"
    @keydown.capture="onKeyboard"
    @pointerdown="onPointer"
  >
    <MTextField
      v-bind="{ ...controlAttrs(), ...fieldError() }"
      ref="fieldRef"
      v-model:focused="control.focused.value"
      class="ui-autocomplete__field"
      :model-value="control.draft.value"
      :label="label"
      :placeholder="control.hasSelection.value ? undefined : placeholder"
      :helper-text="helperText"
      :variant="variant"
      :shape="shape"
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

      <!-- Always there in multiple, empty without chips: the field keeps the
           chips' height from the first frame, so the first chip moves nothing. -->
      <template
        v-if="multiple"
        #leading-content
      >
        <slot
          name="selection"
          :entries="control.selectedEntries.value"
          :remove="control.removeEntry"
        >
          <DropdownChips
            v-if="control.selectedEntries.value.length"
            :entries="control.selectedEntries.value"
            block="ui-autocomplete"
            :chip-id="control.chipId"
            :focus="control.chipFocus.value"
            :disabled="disabled"
            :readonly="readonly"
            @remove="control.removeEntry"
          >
            <template
              v-if="$slots.chip"
              #default="chip"
            >
              <slot
                name="chip"
                v-bind="chip as DropdownChipSlotProps<TItem, TValue>"
              />
            </template>
          </DropdownChips>
        </slot>
      </template>

      <template #append>
        <slot name="append" />

        <MButtonIcon
          v-if="control.canClear.value"
          type="button"
          class="ui-autocomplete__clear"
          :aria-label="messages?.clear"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="clear"
        >
          <MIcon :name="ICONS.close" />
        </MButtonIcon>

        <!-- Not a tab stop (APG): the combobox already opens from the keyboard,
             so the button is for the pointer and would only add a stop. -->
        <MButtonIcon
          type="button"
          class="ui-autocomplete__toggle"
          tabindex="-1"
          :aria-label="messages?.toggle"
          :aria-expanded="String(open)"
          :aria-controls="control.listboxId"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click="control.togglePanel"
        >
          <MIcon
            :name="ICONS.arrowDropDown"
            class="ui-autocomplete__arrow"
          />
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
        :limit-reached="control.limitReached.value"
        :query="search"
        :loading="loading"
        :select="control.selectEntry"
        :close="control.closePanel"
      >
        <!-- Rows stay while a new query loads: a refresh keeps what the user
             was reading, and the active row survives the round trip. -->
        <DropdownPanel
          ref="panelRef"
          :entries="control.entries.value"
          :listbox-attrs="control.listboxAttrs.value"
          :get-option-attrs="control.getOptionAttrs"
          :panel-style="control.panelStyle.value"
          :active-id="control.activeId.value"
          :keyboard="keyboardCursor"
          :density="density"
          :multiple="multiple"
          :loading="loading"
          :state="state"
          :messages="messages"
          :query="search"
          :missing="minSearchLength - search.length"
          :reset-query="control.resetQuery"
          @pointer="onPointer"
        >
          <template
            v-if="$slots.item"
            #item="row"
          >
            <slot
              name="item"
              v-bind="row as DropdownItemSlotProps<TItem, TValue>"
            />
          </template>
          <template
            v-if="$slots.hint"
            #hint="hint"
          >
            <slot
              name="hint"
              v-bind="hint as AutocompleteHintSlotProps"
            />
          </template>
          <template
            v-if="$slots.loading"
            #loading
          >
            <slot name="loading" />
          </template>
          <template
            v-if="$slots.empty"
            #empty
          >
            <slot name="empty" />
          </template>
          <template
            v-if="$slots['no-results']"
            #no-results="result"
          >
            <slot
              name="no-results"
              v-bind="result as AutocompleteNoResultsSlotProps"
            />
          </template>
        </DropdownPanel>
      </slot>
    </MMenu>

    <span
      class="ui-autocomplete__status"
      role="status"
    >{{ status }}</span>
  </div>
</template>

<script setup lang="ts" generic="TItem extends DropdownItemBase, TValue = TItem">
import { computed, ref } from 'vue'
import { mAutocompleteProps } from './props'
import type { AutocompleteHintSlotProps, AutocompleteNoResultsSlotProps, MAutocompleteSlots } from './props'
import type { DropdownChipSlotProps, DropdownItemSlotProps, MDropdownEmits } from '#kit/components/ui/dropdown/props'
import { useAutocomplete } from '#kit/composables/autocomplete/useAutocomplete'
import type { AutocompleteControlConfig, UseAutocompleteReturn } from '#kit/composables/autocomplete/useAutocomplete'
import { provideDropdownContext } from '#kit/components/ui/dropdown/context'
import type { DropdownContext, DropdownItemBase } from '#kit/composables/dropdown/types'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { panelHasContent, panelState } from '#kit/utils/dropdown/panelState'
import type { DropdownPanelState } from '#kit/utils/dropdown/panelState'
import { usePanelStatus } from '#kit/utils/dropdown/usePanelStatus'
import { useSelectionShell, useUnnamedControlWarning } from '#kit/utils/dropdown/useSelectionShell'
import { useBoundProp } from '#kit/utils/text-field/supportLine'
import { ICONS } from '#kit/shared/constants/icons'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MMenu from '#kit/components/ui/menu/index.vue'
import MTextField from '#kit/components/ui/text-field/index.vue'
import DropdownChips from '#kit/components/fragments/dropdown/Chips.vue'
import DropdownPanel from '#kit/components/fragments/dropdown/Panel.vue'

// The root is a wrapper; aria-*, inputmode and listeners belong on the combobox.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mAutocompleteProps)
const emit = defineEmits<MDropdownEmits<TItem>>()
const slots = defineSlots<MAutocompleteSlots<TItem, TValue>>()

const model = defineModel<TValue | TValue[] | undefined>()
const search = defineModel<string>('search', { default: '' })
const open = defineModel<boolean>('open', { default: false })

const panelRef = ref<{ stateEl: HTMLElement | null } | null>(null)

const { fieldRef, fieldControl, field, isError, displayError, keyboardCursor, onKeyboard, onPointer, focusInput, isFieldFrame }
  = useSelectionShell<TValue>({ props, model, open })

// The field reserves its support line only when an error can reach it
// (decision 2026-10-19): the consumer bound one, or an adapter path can
// produce one. Otherwise
// the error props are not passed at all.
const isBound = useBoundProp()
const fieldError = () => (isBound('error') || isBound('errorMessage') || props.path
  ? { error: isError.value, errorMessage: displayError.value }
  : {})

const state = computed<DropdownPanelState>(() => panelState({
  rows: control.entries.value.length,
  loading: props.loading,
  items: props.items.length,
  queryReady: control.queryReady.value,
}))

const control: UseAutocompleteReturn<TItem, TValue> = useAutocomplete<TItem, TValue>({
  props: props as AutocompleteControlConfig,
  model,
  search,
  open,
  emit,
  pending: () => field.meta.pending,
  canOpen: (): boolean => Boolean(slots.default) || panelHasContent(state.value, name => Boolean(slots[name as keyof typeof slots]), props.messages),
})

useUnnamedControlWarning('m-autocomplete', () => props.messages, () => [
  'toggle' as const,
  ...(control.canClear.value ? ['clear' as const] : []),
  ...(props.loading && open.value ? ['loading' as const] : []),
])

const status = usePanelStatus({
  open: () => open.value,
  loading: () => props.loading,
  hasRows: () => control.entries.value.length > 0,
  loadingText: () => props.messages?.loading,
  state: () => panelRef.value?.stateEl,
  sources: () => [props.items.length, control.queryReady.value],
})

// A press in the box reaches the input through the field; the field's frame
// between the box and its support line passes nothing on, so it opens here.
function onFieldClick(event: MouseEvent) {
  if (!isFieldFrame(event.target)) return
  focusInput()
  control.openPanel()
}

// The button leaves with the value; the field is where the user goes next.
function clear() {
  control.clearQuery()
  focusInput()
}

provideDropdownContext(control.context as unknown as DropdownContext)

defineExpose({ open: control.openPanel, close: control.closeAndRestore, clear: control.clearQuery })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/autocomplete' as t;
@use '#kit/assets/stylesheet/components/dropdown/field' as field;

.ui-autocomplete {
  $t: t.$tokens;

  position: relative;
  width: 100%;
  min-width: 0;

  // The clear and toggle buttons carry no colour of their own: an icon button
  // without one takes its container's content colour, and the field's trailing
  // zone gives it every role — rest, error, error + hover, disabled.

  @include field.selection-field($t);
}
</style>
