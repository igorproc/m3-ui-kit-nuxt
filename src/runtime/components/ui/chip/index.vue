<template>
  <button
    ref="element"
    class="ui-chip"
    :class="chipClasses"
    type="button"
    :disabled="isDisabled"
    :aria-pressed="ticket ? isSelected : undefined"
    :aria-disabled="isBlocked ? 'true' : undefined"
    :tabindex="ticket?.tabindex.value"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span
      v-if="$slots.icon"
      class="ui-chip__icon"
    >
      <slot name="icon" />
    </span>

    <span class="ui-chip__label">
      <slot />
    </span>

    <span
      v-if="$slots.trailing"
      class="ui-chip__trailing"
    >
      <slot name="trailing" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { tryUseChipGroupContext } from '#kit/composables/chip-group/context'
import { mChipProps } from './props'

const props = defineProps(mChipProps)

const selectedModel = defineModel<boolean>({ default: false })

const element = useTemplateRef<HTMLElement>('element')
const group = tryUseChipGroupContext()

/**
 * A chip joins the group only with a `value`. Without one it stays standalone —
 * a normal Tab stop with its own boolean model — even inside a group layout.
 */
const ticket = group && props.value !== undefined
  ? group.register({
      value: () => props.value,
      disabled: () => props.disabled,
      element,
    })
  : undefined

onScopeDispose(() => ticket?.stop())

const isSelected = computed(() => (ticket ? ticket.selected.value : selectedModel.value))
const isDisabled = computed(() => (ticket ? ticket.disabled.value : props.disabled))
// Blocked by the group `max`: announced as unavailable through aria-disabled
// rather than natively disabled, so it stays discoverable in the group.
const isBlocked = computed(() => Boolean(ticket && ticket.blockReason.value === 'max'))

const chipClasses = computed(() => [
  `ui-chip--${props.type}`,
  {
    'ui-chip--selected': isSelected.value,
    'ui-chip--disabled': isDisabled.value,
    'ui-chip--blocked': isBlocked.value,
  },
])

function onClick() {
  if (isDisabled.value) return

  if (ticket) {
    // The registry rejects a blocked toggle, so no local guard is duplicated.
    ticket.toggle()
    return
  }

  if (props.type === 'filter') selectedModel.value = !selectedModel.value
}

function onKeydown(event: KeyboardEvent) {
  if (!ticket || !group) return

  const horizontal = group.direction.value === 'horizontal'
  // RTL swaps the visual meaning of previous/next along the inline axis only.
  const rtl = horizontal && element.value
    ? getComputedStyle(element.value).direction === 'rtl'
    : false

  const forward = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
  const backward = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'
  const value = ticket.value.value

  switch (event.key) {
    case forward:
      event.preventDefault()
      group.focusNext(value)
      break
    case backward:
      event.preventDefault()
      group.focusPrev(value)
      break
    case 'Home':
      event.preventDefault()
      group.focusFirst()
      break
    case 'End':
      event.preventDefault()
      group.focusLast()
      break
  }
  // Space/Enter keep native button activation and reach `onClick`.
}
</script>

<style lang="scss">
@use 'sass:map';
@use '#kit/assets/stylesheet/components/chip/index' as t;

$prefix: 'md-chip';

.ui-chip {
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: g($t, 'gap');
  min-height: g($t, 'height');
  padding-inline: g($t, 'padding-inline');
  border-radius: g($t, 'radius');
  border: g($t, 'border-width') solid transparent;
  background-color: g($t, 'bg-color-default');
  color: g($t, 'text-color-variant');
  cursor: pointer;
  outline: none;
  text-decoration: none;
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(g($t, 'text-type'));

  &__icon,
  &__trailing {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'icon-size');
  }

  &__label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &:hover:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, #{map.get($theme-color-link, 'on-surface')} #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-default')});
  }

  &:active:not(.ui-chip--disabled) {
    background-color: color-mix(in srgb, #{map.get($theme-color-link, 'on-surface')} #{g($t, 'state-layer-opacity-active')}, #{g($t, 'bg-color-default')});
    transform: translateY(1rem);
  }

  &--assist,
  &--filter,
  &--input {
    background-color: transparent;
    border-color: g($t, 'border-color-default');
    color: g($t, 'text-color-default');

    &:hover {
      background-color: color-mix(in srgb, #{map.get($theme-color-link, 'on-surface')} #{g($t, 'state-layer-opacity-hover')}, transparent);
    }

    &:active {
      background-color: color-mix(in srgb, #{map.get($theme-color-link, 'on-surface')} #{g($t, 'state-layer-opacity-active')}, transparent);
    }
  }

  &--suggestion {
    background-color: g($t, 'bg-color-suggestion');
    border-color: transparent;
    box-shadow: g($t, 'suggestion-shadow');

    &:hover {
      background-color: color-mix(in srgb, #{map.get($theme-color-link, 'on-surface')} #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-suggestion')});
    }
  }

  &--selected {
    background-color: g($t, 'bg-color-selected');
    color: g($t, 'text-color-selected');
    border-color: transparent;

    &:hover {
      background-color: color-mix(in srgb, #{g($t, 'text-color-selected')} #{g($t, 'state-layer-opacity-hover')}, #{g($t, 'bg-color-selected')});
    }
  }

  // Restores the visible indicator removed by `outline: none` above.
  &:focus-visible {
    outline: g($t, 'focus-width') solid g($t, 'focus-color');
    outline-offset: g($t, 'focus-offset');
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'disabled-opacity');
    pointer-events: none;
  }

  // Selection is blocked by the group `max`; the chip stays focusable so the
  // user can reach it and understand why it cannot be selected.
  &--blocked {
    cursor: default;
    opacity: g($t, 'blocked-opacity');
  }
}
</style>
