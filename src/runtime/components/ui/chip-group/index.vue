<template>
  <div
    v-bind="rootAttrs()"
    class="ui-chip-group"
    :class="[
      `ui-chip-group--${direction}`,
      { 'ui-chip-group--wrap': wrap, 'ui-chip-group--scroll': direction === 'horizontal' && !wrap },
    ]"
  >
    <span
      v-if="label || $slots.label"
      :id="labelId"
      class="ui-chip-group__label"
    >
      <slot name="label">{{ label }}</slot>
      <span
        v-if="required"
        class="ui-chip-group__required"
        aria-hidden="true"
      > *</span>
    </span>

    <div
      ref="chips"
      v-bind="controlAttrs(chipsAttrs())"
      class="ui-chip-group__chips"
      role="group"
      @focusin="roving.onFocusin"
      @focusout="onRowFocusout"
    >
      <slot v-bind="groupSlot" />

      <template v-if="props.items">
        <template
          v-for="entry in entries"
          :key="entry.key"
        >
          <slot
            name="item"
            :item="entry.item"
            :index="entry.index"
            :value="entry.value"
            :selected="isSelected(entry.value)"
            :disabled="entry.disabled || props.disabled"
            :blocked="isBlocked(entry.value, entry.disabled)"
            :block-reason="blockReasonFor(entry.value, entry.disabled)"
            :props="{ value: entry.value, disabled: entry.disabled }"
          />
        </template>

        <slot
          v-if="!entries.length"
          name="empty"
          v-bind="groupSlot"
        />
      </template>
    </div>

    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId"
      class="ui-chip-group__support"
      :is-error="isError"
      :message="message"
    >
      <template
        v-if="$slots.helper"
        #helper="scope"
      >
        <slot
          name="helper"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.error"
        #error="scope"
      >
        <slot
          name="error"
          v-bind="scope"
        />
      </template>
    </ChoiceSupport>
  </div>
</template>

<script setup lang="ts" generic="TItem, TValue = TItem">
/**
 * Groups chips under one stable-value model with roving focus.
 *
 * Selection is not reimplemented: `useSelectionGroup` stays the only source of
 * truth. This component adds a dedicated chip context (so chips never register
 * into an unrelated `<MSelectionGroup>`) plus an ordered element list used
 * solely for user-triggered focus movement.
 *
 * A descendant `MChip` without a `value` stays a normal standalone chip: it
 * does not register, keeps its own tab stop, and produces no warning. That
 * keeps assist/input/suggestion chips usable inside a group layout.
 */
import { computed, nextTick, onScopeDispose, ref, useAttrs, useId, useTemplateRef, watchEffect } from 'vue'
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import { useSelectionGroup } from '#kit/composables/selection/useSelectionGroup'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { createChipRoving } from '#kit/utils/chip-group/createChipRoving'
import { resolveEntries } from '#kit/utils/selection/resolveEntries'
import type { ChipView } from '#kit/utils/chip-group/createChipRoving'
import { useFieldValidation } from '#kit/utils/text-field/useFieldValidation'
import { useSupportLine } from '#kit/utils/text-field/supportLine'
import { provideChipGroupContext } from '#kit/composables/chip-group/context'
import type {
  MChipGroupContext,
  MChipGroupTicket,
  MChipRegistration,
} from '#kit/composables/chip-group/context'
import type { SelectionBlockReason } from '#kit/composables/selection/context'
import type { ChipGroupSlot, ChipItemSlot } from './types'
import type { MChipGroupProps } from './props'
import { mChipGroupProps } from './props'

// The root holds the label, the row and the support line; ARIA — a consumer's
// `aria-label` first of all — belongs on the `role=group` row itself.
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mChipGroupProps) as MChipGroupProps<TItem, TValue> & {
  multiple: boolean
  mandatory: boolean | 'force'
  disabled: boolean
  direction: MChipGroupProps<TItem, TValue>['direction'] & string
  wrap: boolean
}

const model = defineModel<TValue | TValue[] | undefined>()

const slots = defineSlots<{
  default: (slot: ChipGroupSlot<TValue>) => unknown
  item: (slot: ChipItemSlot<TItem, TValue>) => unknown
  empty: (slot: ChipGroupSlot<TValue>) => unknown
  /** The group's visible name; replaces `label`. */
  label?: () => unknown
  /** Replaces the helper text under the row. */
  helper?: (scope: { message?: string }) => unknown
  /** Replaces the error text under the row. */
  error?: (scope: { message?: string }) => unknown
}>()

const groupId = useId()
const labelId = `${groupId}-label`
const supportId = `${groupId}-support`

// The group is the form field: one value (or array) for the adapter, one line.
const { isError, message } = useFieldValidation(model, props)
const hasSupport = useSupportLine(props, slots)

const chips = useTemplateRef<HTMLElement>('chips')
// Set while focus has nowhere else to go after the focused chip was removed.
const orphanedFocus = ref(false)

function onRowFocusout(event: FocusEvent) {
  if (event.target === chips.value) orphanedFocus.value = false
}

const chipsAttrs = () => ({
  'tabindex': orphanedFocus.value ? -1 : undefined,
  'aria-labelledby': props.label || slots.label ? labelId : undefined,
  'aria-describedby': hasSupport() && (message.value || slots.helper || (isError.value && slots.error)) ? supportId : undefined,
  'aria-invalid': isError.value ? 'true' as const : undefined,
})

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.label && !slots.label && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[m-chip-group] the group has no name: pass `label`, `aria-label` or `aria-labelledby`.')
    }
  })
}

const entries = computed(() => resolveEntries<TItem, TValue>(props.items ?? [], {
  itemValue: props.itemValue,
  itemDisabled: props.itemDisabled,
  itemKey: props.itemKey,
}, 'm3:chip-group'))

const group = useSelectionGroup<TValue>({
  multiple: () => props.multiple,
  mandatory: () => props.mandatory,
  disabled: () => props.disabled,
  max: () => props.max,
  comparator: () => props.valueComparator ?? ((left, right) => left === right),
  model: () => model.value,
  emitModel: (value) => {
    model.value = value
  },
})

const selection = group.context

const isSelected = (value: TValue) => selection.isSelected(value)

const roving = createChipRoving<TValue>({
  comparator: () => props.valueComparator ?? ((left: TValue, right: TValue) => left === right),
  isSelected,
  // The last chip went away with focus on it: the row takes focus for a moment
  // rather than dropping it to `<body>`.
  onOrphanedFocus: () => {
    orphanedFocus.value = true
    nextTick(() => chips.value?.focus())
  },
})

function isBlocked(value: TValue, disabled: boolean) {
  if (props.disabled || disabled) return true
  return !isSelected(value) && selection.selectionLimitReached.value
}

function blockReasonFor(value: TValue, disabled: boolean): SelectionBlockReason {
  if (props.disabled || disabled) return 'disabled'
  if (!isSelected(value) && selection.selectionLimitReached.value) return 'max'
  return null
}

const context: MChipGroupContext<TValue> = {
  multiple: selection.multiple,
  disabled: selection.disabled,
  selectionLimitReached: selection.selectionLimitReached,
  direction: computed(() => props.direction),
  select: selection.select,
  unselect: selection.unselect,
  toggle: selection.toggle,
  focusNext: roving.focusNext,
  focusPrev: roving.focusPrev,
  focusFirst: roving.focusFirst,
  focusLast: roving.focusLast,
  register(registration: MChipRegistration<TValue>): MChipGroupTicket<TValue> {
    const ticket = selection.register({
      value: registration.value,
      disabled: registration.disabled,
    })

    const view: ChipView<TValue> = {
      element: registration.element,
      value: () => ticket.value.value,
      blocked: () => ticket.isSelectionBlocked.value,
    }
    const remove = roving.add(view)

    // The chip's scope owns cleanup, so conditional rendering and data-driven
    // removal both drop the ticket and its view entry.
    onScopeDispose(() => {
      remove()
      ticket.stop()
    })

    return {
      value: ticket.value,
      selected: ticket.isSelected,
      disabled: ticket.isDisabled,
      blocked: ticket.isSelectionBlocked,
      blockReason: ticket.blockReason,
      tabindex: computed(() => (roving.activeView.value === view ? 0 : -1)),
      toggle: ticket.toggle,
      focus: () => registration.element.value?.focus(),
      stop: ticket.stop,
    }
  },
}

provideChipGroupContext(context as MChipGroupContext<unknown>)

const groupSlot = computed<ChipGroupSlot<TValue>>(() => ({
  selected: selection.selected.value,
  multiple: selection.multiple.value,
  disabled: selection.disabled.value,
  selectionLimitReached: selection.selectionLimitReached.value,
  select: selection.select,
  unselect: selection.unselect,
  toggle: selection.toggle,
}))
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/chip-group/index' as t;

@property --ui-chip-group-fade-start {
  syntax: '<length>';
  inherits: false;
  initial-value: 0;
}

@property --ui-chip-group-fade-end {
  syntax: '<length>';
  inherits: false;
  initial-value: 0;
}

// The fade sits at an edge only while chips continue beyond it.
@keyframes ui-chip-group-fade {
  0% {
    --ui-chip-group-fade-start: 0;
    --ui-chip-group-fade-end: #{map.get(t.$tokens, 'fade')};
  }

  10% { --ui-chip-group-fade-start: #{map.get(t.$tokens, 'fade')}; }
  90% { --ui-chip-group-fade-end: #{map.get(t.$tokens, 'fade')}; }

  100% {
    --ui-chip-group-fade-start: #{map.get(t.$tokens, 'fade')};
    --ui-chip-group-fade-end: 0;
  }
}

.ui-chip-group {
  $t: material-map(t.$tokens, 'md-chip-group');

  display: flex;
  flex-direction: column;
  gap: g($t, 'label.gap');
  min-inline-size: 0;

  &__label {
    color: g($t, 'label.color');

    @include typescale(g($t, 'label.typography'));
  }

  &__required {
    color: g($t, 'label.required');
  }

  &__chips {
    display: flex;
    align-items: center;
    gap: g($t, 'gap');
    outline: none;
  }

  &--vertical &__chips {
    flex-direction: column;
    align-items: flex-start;
  }

  &--wrap &__chips { flex-wrap: wrap; }

  // Native inline scrolling only: no arrows or drag until MSlideGroup lands.
  &--scroll &__chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    overscroll-behavior-inline: contain;

    // Room for the chips' focus ring on every side, and a chip scrolled into
    // view by the arrows stops clear of the edge fade.
    padding: g($t, 'scroll.padding');
    scroll-padding-inline: g($t, 'scroll.padding');

    @supports (animation-timeline: scroll()) {
      mask-image: linear-gradient(
        to right,
        transparent,
        currentcolor var(--ui-chip-group-fade-start),
        currentcolor calc(100% - var(--ui-chip-group-fade-end)),
        transparent
      );
      animation: ui-chip-group-fade auto linear both;
      animation-timeline: scroll(self inline);

      &:dir(rtl) {
        mask-image: linear-gradient(
          to left,
          transparent,
          currentcolor var(--ui-chip-group-fade-start),
          currentcolor calc(100% - var(--ui-chip-group-fade-end)),
          transparent
        );
      }
    }
  }
}
</style>
