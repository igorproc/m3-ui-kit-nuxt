<template>
  <MListItem
    v-bind="search.optionAttrs(id)"
    ref="row"
    class="ui-search-list-item"
    :class="{
      'ui-search-list-item--active': active,
      'ui-search-list-item--keyboard': active && search.keyboard.value,
    }"
    :interactive="true"
    :disabled="disabled"
    :headline="headline"
    :supporting-text="supportingText"
  >
    <template
      v-if="$slots.leading"
      #leading
    >
      <slot name="leading" />
    </template>
    <template
      v-if="$slots.headline"
      #headline
    >
      <slot name="headline" />
    </template>
    <template
      v-if="$slots.supporting"
      #supporting
    >
      <slot name="supporting" />
    </template>
    <template
      v-if="$slots.default"
      #default
    >
      <slot />
    </template>
    <template
      v-if="removable || $slots.trailing"
      #trailing
    >
      <slot name="trailing" />
      <!-- A pointer target, not a button: a listbox option holds no controls.
           Delete on the active row is its keyboard twin. -->
      <span
        v-if="removable"
        class="ui-search-list-item__remove"
        aria-hidden="true"
        @mousedown.prevent
        @click.stop="emit('remove')"
      >
        <MIcon :name="ICONS.close" />
      </span>
    </template>
  </MListItem>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, useId, useTemplateRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { mSearchListItemProps } from './props'
import type { MSearchListItemEmits, MSearchListItemSlots } from './props'
import { useSearchContext } from '#kit/utils/search/context'
import { ICONS } from '#kit/shared/constants/icons'
import MIcon from '#kit/components/ui/icon/index.vue'
import MListItem from '#kit/components/ui/list/item/index.vue'

const props = defineProps(mSearchListItemProps)
const emit = defineEmits<MSearchListItemEmits>()
defineSlots<MSearchListItemSlots>()

const id = useId()
const search = useSearchContext()
const row = useTemplateRef<ComponentPublicInstance>('row')

const title = () => props.title ?? props.headline

// Registered while rendering, the server's render included; the getters keep
// the engine in step with the props.
const unregister = search.register({
  id,
  get value() { return props.value === undefined ? title() : props.value },
  get title() { return title() },
  get disabled() { return props.disabled },
  get removable() { return props.removable },
  // No DOM globals: the server sorts rows too, and has no `HTMLElement`.
  el: () => (row.value?.$el?.nodeType === 1 ? row.value.$el as HTMLElement : null),
  remove: () => emit('remove'),
})
onBeforeUnmount(unregister)

const active = computed(() => search.isActive(id))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/search' as t;

.ui-search-list-item {
  $t: t.$tokens;

  // The virtual focus draws the row's layer — the pointer and the keyboard both
  // move it. `:hover` stays on a row the keyboard has left, so it is switched
  // off on every row but the active one. The row's own rules are one class:
  // the compound below outranks them whatever order the sheets load in.
  @include can-hover {
    &:not(.ui-search-list-item--active).ui-list-item:hover::before {
      opacity: 0;
    }
  }

  &--active.ui-list-item::before {
    opacity: g($t, 'row.layer.pointer');
  }

  &--keyboard.ui-list-item {
    @include focus-ring(inset);

    &.ui-search-list-item::before {
      opacity: g($t, 'row.layer.keyboard');
    }

    @include forced-colors {
      outline-color: Highlight;
    }
  }

  &__remove {
    display: grid;
    place-items: center;
    width: g($t, 'row.remove.target');
    height: g($t, 'row.remove.target');
    color: g($t, 'row.remove.color');
    font-size: g($t, 'row.remove.size');
    cursor: pointer;
  }
}
</style>
