<template>
  <div
    v-bind="rootAttrs()"
    class="ui-dropdown"
    :class="{
      'ui-dropdown--open': open,
      'ui-dropdown--disabled': disabled,
    }"
    @click="onFieldClick"
    @keydown.capture="onKeyboard"
    @pointerdown="onPointer"
  >
    <MTextField
      v-bind="{ ...controlAttrs(), ...fieldError() }"
      ref="fieldRef"
      v-model:focused="focused"
      class="ui-dropdown__field"
      :model-value="control.displayTitle.value"
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
      :input-attrs="control.inputAttrs.value"
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
            block="ui-dropdown"
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
          class="ui-dropdown__clear"
          :aria-label="messages?.clear"
          :disabled="disabled || readonly"
          @mousedown.prevent
          @click.stop="clear"
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
            v-if="$slots.empty"
            #empty
          >
            <slot name="empty" />
          </template>
          <template
            v-if="$slots.loading"
            #loading
          >
            <slot name="loading" />
          </template>
        </DropdownPanel>
      </slot>
    </MMenu>

    <span
      class="ui-dropdown__status"
      role="status"
    >{{ status }}</span>
  </div>
</template>

<script setup lang="ts" generic="TItem extends DropdownItemBase, TValue = TItem">
import { computed, ref } from 'vue'
import { mDropdownProps } from './props'
import type { DropdownChipSlotProps, DropdownItemSlotProps, MDropdownEmits, MDropdownSlots } from './props'
import { provideDropdownContext } from './context'
import { useDropdownControl } from '#kit/composables/dropdown/useDropdownControl'
import type { DropdownContext, DropdownItemBase, UseDropdownControlReturn } from '#kit/composables/dropdown/types'
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

// The root is a wrapper; aria-*, name and listeners belong on the combobox.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mDropdownProps)
const emit = defineEmits<MDropdownEmits<TItem>>()
const slots = defineSlots<MDropdownSlots<TItem, TValue>>()

const model = defineModel<TValue | TValue[] | undefined>()
const open = defineModel<boolean>('open', { default: false })

const focused = ref(false)
const panelRef = ref<{ stateEl: HTMLElement | null } | null>(null)

const { fieldRef, fieldControl, field, isError, displayError, keyboardCursor, onKeyboard, onPointer, focusInput, isFieldFrame }
  = useSelectionShell<TValue>({ props, model, open })

// The field reserves its support line only when an error can reach it
// (decision 2026-10-19): the consumer bound one, or an adapter path can
// produce one. Otherwise the error props are not passed at all.
const isBound = useBoundProp()
const fieldError = () => (isBound('error') || isBound('errorMessage') || props.path
  ? { error: isError.value, errorMessage: displayError.value }
  : {})

const state = computed<DropdownPanelState>(() => panelState({
  rows: control.entries.value.length,
  loading: props.loading,
  items: props.items.length,
  queryReady: true,
}))

const control: UseDropdownControlReturn<TItem, TValue> = useDropdownControl<TItem, TValue>({
  props,
  model,
  open,
  pending: () => field.meta.pending,
  canOpen: (): boolean => Boolean(slots.default) || panelHasContent(state.value, name => Boolean(slots[name as keyof typeof slots]), props.messages),
  onSelect: entry => emit('select', entry.item),
  onRemove: entry => emit('remove', entry.item),
  onClear: () => emit('clear'),
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
})

useUnnamedControlWarning('m-dropdown', () => props.messages, () => [
  ...(control.canClear.value ? ['clear' as const] : []),
  ...(props.loading && open.value ? ['loading' as const] : []),
])

const status = usePanelStatus({
  open: () => open.value,
  loading: () => props.loading,
  hasRows: () => control.entries.value.length > 0,
  loadingText: () => props.messages?.loading,
  state: () => panelRef.value?.stateEl,
})

// The field passes a press anywhere in its box on to the input, and a label's
// click reaches it natively: the input's click is the one that toggles — the
// box's own click is that same press, seen twice. The field's frame between
// the box and its support line passes nothing on, so it toggles here; the
// support line itself does not.
function onFieldClick(event: MouseEvent) {
  if (props.disabled || props.readonly) return
  if (event.target === fieldRef.value?.input) {
    control.togglePanel()
  } else if (isFieldFrame(event.target)) {
    focusInput()
    control.togglePanel()
  }
}

// The button leaves with the value; the field is where the user goes next.
function clear() {
  control.clear()
  focusInput()
}

provideDropdownContext(control.context as unknown as DropdownContext)

defineExpose({ open: control.openPanel, close: control.closePanel, clear: control.clear })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dropdown' as t;
@use '#kit/assets/stylesheet/components/dropdown/field' as field;

.ui-dropdown {
  $t: t.$tokens;

  position: relative;
  width: 100%;
  min-width: 0;

  // The box is the control; the label and the support line around it are not.
  &__field .ui-text-field__control {
    cursor: pointer;
  }

  &--disabled &__field .ui-text-field__control {
    cursor: default;
  }

  // The input takes no text (see `useDropdownControl`): no I-beam, no caret.
  // One class above the field's own caret rules, its error caret included.
  &__field.ui-text-field .ui-text-field__input {
    cursor: inherit;
    caret-color: g($t, 'input.caret');
  }

  @include field.selection-field($t);
}
</style>
