<template>
  <transition-group
    name="ui-fab-menu-item"
    tag="ul"
    role="list"
    class="ui-fab-menu__list"
    appear
  >
    <li
      v-for="(item, index) in items"
      :key="item.value ?? index"
      class="ui-fab-menu__entry"
      :style="{ '--ui-fab-stagger': items.length - 1 - index }"
    >
      <button
        type="button"
        class="ui-fab-menu__item"
        :disabled="item.disabled"
        @click="emit('select', item)"
      >
        <MIcon
          v-if="item.icon"
          :name="item.icon"
          class="ui-fab-menu__item-icon"
        />
        <span class="ui-fab-menu__label">{{ item.label }}</span>
      </button>
    </li>
  </transition-group>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MFabMenuItem } from '#kit/components/ui/fab-menu/props'

/**
 * The default actions of `<MFabMenu>`: M3 pills in reading order, the one
 * nearest the FAB revealed first. Colour comes from the menu's role class.
 */
defineProps({
  items: { type: Array as PropType<MFabMenuItem[]>, required: true },
})

const emit = defineEmits<{
  (e: 'select', item: MFabMenuItem): void
}>()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/fab-menu/index' as t;

$roles: ('primary', 'secondary', 'tertiary', 'error');

.ui-fab-menu {
  $t: material-map(t.$tokens, 'md-fab-menu');
  $item-in: g($t, 'motion.item.duration') g($t, 'motion.item.easing');
  $item-out: g($t, 'motion.item.leave.duration') g($t, 'motion.item.leave.easing');

  &__list {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: g($t, 'list.gap');
    margin: 0;
    padding: 0;
    list-style: none;

    .ui-fab-menu--start & {
      align-items: flex-start;
    }
  }

  // Staggered reveal: the action nearest the FAB leads.
  &__entry {
    display: flex;
    max-width: 100%;

    &.ui-fab-menu-item-enter-active {
      transition: opacity $item-in, translate $item-in;
      transition-delay: calc(#{g($t, 'motion.item.stagger')} * var(--ui-fab-stagger, 0));
    }

    &.ui-fab-menu-item-leave-active {
      transition: opacity $item-out, translate $item-out;
    }

    &.ui-fab-menu-item-enter-from,
    &.ui-fab-menu-item-leave-to {
      opacity: 0;
      translate: 0 g($t, 'motion.item.shift');
    }
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: g($t, 'item.gap');
    min-height: g($t, 'item.height');
    max-width: g($t, 'item.max-width');
    padding-inline: g($t, 'item.padding');
    border: none;
    border-radius: g($t, 'item.shape');
    box-shadow: g($t, 'item.shadow');
    cursor: pointer;
    text-align: start;
    overflow-wrap: anywhere;
    outline: none;

    @include typescale(g($t, 'item.font'));

    &:focus-visible {
      @include focus-ring;
    }

    &:disabled {
      cursor: default;
      box-shadow: none;
    }

    // Only a fill and a shadow draw the action, and forced colors drops both.
    @include forced-colors {
      border: 1px solid ButtonText;

      &:disabled {
        border-color: GrayText;
        color: GrayText;
      }
    }
  }

  &__item-icon {
    flex-shrink: 0;
    font-size: g($t, 'item.icon.size');
  }

  @each $role in $roles {
    &--#{$role} .ui-fab-menu__item {
      background-color: g($t, '#{$role}.item.container.color');
      color: g($t, '#{$role}.item.content.color');

      @include can-hover {
        &:hover:not(:disabled) {
          background-color: g($t, '#{$role}.item.container.hover.color');
        }
      }

      &:focus-visible {
        background-color: g($t, '#{$role}.item.container.focus.color');
      }

      &:active:not(:disabled) {
        background-color: g($t, '#{$role}.item.container.pressed.color');
      }

      &:disabled {
        background-color: g($t, 'disabled.container.color');
        color: g($t, 'disabled.content.color');
      }
    }
  }
}
</style>
