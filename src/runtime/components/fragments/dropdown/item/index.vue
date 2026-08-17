<template>
  <m-list-item
    :id="ticket?.id"
    ref="itemRef"
    class="ui-dropdown-item"
    :class="{
      'ui-dropdown-item--selected': selected,
      'ui-dropdown-item--active': ticket?.isActive.value,
    }"
    :interactive="true"
    role="option"
    :aria-selected="selected"
    v-bind="$attrs"
  >
    <template
      v-if="$slots.leading || selected"
      #leading
    >
      <slot name="leading">
        <m-icon
          v-if="selected"
          :name="ICONS.check"
          class="ui-dropdown-item__check"
        />
      </slot>
    </template>

    <slot />

    <template
      v-if="$slots.trailing"
      #trailing
    >
      <slot name="trailing" />
    </template>
  </m-list-item>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useDropdownContext } from '#kit/components/ui/dropdown/context'
import type { DropdownEntry, DropdownOptionTicket } from '#kit/components/ui/dropdown/types'
import MIcon from '#kit/components/ui/icon/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'

interface Props {
  selected?: boolean
  /** Source entry, supplied when rendered via the dropdown's option/items paths. */
  entry?: DropdownEntry
}

const props = defineProps<Props>()

const ctx = useDropdownContext()

const itemRef = ref<ComponentPublicInstance | null>(null)
const itemEl = computed<HTMLElement | null>(() => (itemRef.value?.$el as HTMLElement | null) ?? null)

// Only entries with a resolvable identity join the keyboard-navigation registry
// (the dropdown's option/items paths pass `entry`; bare manual items don't).
let ticketHandle: DropdownOptionTicket | null = null
if (props.entry !== undefined) {
  ticketHandle = ctx.registerOption(props.entry, itemEl)
  onBeforeUnmount(() => ticketHandle?.unregister())
}

const ticket = ticketHandle
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dropdown/item' as *;

.ui-dropdown-item {
  $prefix: 'm-dropdown-item';
  $t: material-map($tokens, $prefix);

  position: relative;
  height: g($t, 'height');
  padding-inline: g($t, 'padding-inline');
  color: g($t, 'color');

  @include typescale(g($t, 'typography'));

  // Virtual focus (aria-activedescendant): real focus stays on the combobox,
  // so mirror the hover emphasis to show the active option during keyboard nav.
  &--active {
    background-color: g($t, 'hover-bg');
  }

  &--selected {
    background-color: g($t, 'selected-bg');
    color: g($t, 'selected-color');

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 15%;
      height: 70%;
      width: 4rem;
      background-color: g($t, 'selected-indicator');
      border-radius: 0 4rem 4rem 0;
    }

    &:hover,
    &.ui-dropdown-item--active {
      background-color: g($t, 'hover-selected-bg');
    }
  }
}
</style>
