<template>
  <ul
    role="list"
    class="ui-fab-menu__list"
  >
    <li
      v-for="(item, index) in items"
      :key="item.value ?? index"
      class="ui-fab-menu__entry"
      :style="cascade(index)"
    >
      <button
        v-ripple="!item.disabled"
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
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MFabMenuItem } from '#kit/components/ui/fab-menu/props'

/**
 * The default actions of `<MFabMenu>`: M3 pills in reading order. They open
 * nearest the FAB first and close farthest first (M3 / Compose
 * `FloatingActionButtonMenu`); the menu's open class drives both directions,
 * so a reversal mid-way continues from where the actions are. Colour comes
 * from the menu's role class.
 */
const props = defineProps({
  items: { type: Array as PropType<MFabMenuItem[]>, required: true },
})

const emit = defineEmits<{
  (e: 'select', item: MFabMenuItem): void
}>()

// The position of each action in the cascade, both ways: live per-item order,
// the one runtime value the stylesheet cannot know.
function cascade(index: number) {
  const fromFab = props.items.length - 1 - index
  return { '--ui-fab-enter': fromFab, '--ui-fab-leave': index }
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/fab-menu/index' as t;

$roles: ('primary', 'secondary', 'tertiary', 'error');

.ui-fab-menu {
  $t: material-map(t.$tokens, 'md-fab-menu');
  $item-in: g($t, 'motion.item.duration') g($t, 'motion.item.easing');
  $item-out: g($t, 'motion.item.leave.duration') g($t, 'motion.item.leave.easing');
  $stagger: g($t, 'motion.item.stagger');

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

  // Closed, an action rests below its place and invisible; the open drawer
  // brings it up. Each direction carries its own curve and cascade order.
  &__entry {
    display: flex;
    max-width: 100%;
    opacity: 0;
    translate: 0 g($t, 'motion.item.shift');
    transition: opacity $item-out, translate $item-out;
    transition-delay: calc(#{$stagger} * var(--ui-fab-leave, 0));

    .ui-fab-menu__drawer--open & {
      opacity: 1;
      translate: none;
      transition: opacity $item-in, translate $item-in;
      transition-delay: calc(#{$stagger} * var(--ui-fab-enter, 0));
    }

    // Reduced motion keeps the fade and drops the travel.
    @media (prefers-reduced-motion: reduce) {
      translate: none;
    }
  }

  &__item {
    position: relative;
    isolation: isolate;
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

    // State layer in the action's content colour; pressed is the ripple's.
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: currentcolor;
      opacity: 0;
      pointer-events: none;
    }

    @include can-hover {
      &:hover:not(:disabled)::before {
        opacity: g($t, 'state.hover');
      }
    }

    &:focus-visible {
      @include focus-ring;

      &::before {
        opacity: g($t, 'state.focus');
      }
    }

    &:disabled {
      cursor: default;
      box-shadow: none;
      background-color: g($t, 'disabled.container.color');
      color: g($t, 'disabled.content.color');
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
    &--#{$role} .ui-fab-menu__item:enabled {
      background-color: g($t, '#{$role}.item.container');
      color: g($t, '#{$role}.item.content');
    }
  }
}
</style>
