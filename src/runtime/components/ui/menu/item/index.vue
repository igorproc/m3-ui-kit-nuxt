<template>
  <component
    :is="href ? 'a' : 'button'"
    class="ui-menu__item"
    :class="{
      'ui-menu__item--selected': isCheckable && selected,
      'ui-menu__item--disabled': disabled,
      'ui-menu__item--two-line': hasSupporting,
    }"
    v-bind="itemAttrs"
    :type="href ? undefined : 'button'"
    :href="href"
    @click="onClick"
  >
    <span
      v-if="leadingGlyph"
      class="ui-menu__item-leading"
      aria-hidden="true"
    >
      <MIcon :name="leadingGlyph" />
    </span>

    <span class="ui-menu__item-label">
      <span class="ui-menu__item-text">
        <slot>{{ label }}</slot>
      </span>
      <span
        v-if="hasSupporting"
        class="ui-menu__item-supporting"
      >
        <slot name="supporting">{{ supportingText }}</slot>
      </span>
    </span>

    <span
      v-if="trailingText"
      class="ui-menu__item-shortcut"
    >
      {{ trailingText }}
    </span>

    <span
      v-if="trailingIcon"
      class="ui-menu__item-trailing"
      aria-hidden="true"
    >
      <MIcon :name="trailingIcon" />
    </span>
  </component>
</template>

<script setup lang="ts">
/**
 * `<MMenuItem>` — one action of an `<MMenu>`. Its role, `aria-checked`,
 * `aria-disabled` and tab index come from the menu's control; the menu moves
 * focus between items, and the item swallows its own activation while
 * disabled.
 */
import { computed, useSlots } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useMenuContext } from '../context'
import { mMenuItemProps } from './props'
import type { MMenuItemEmits } from './props'

const props = defineProps(mMenuItemProps)
const emit = defineEmits<MMenuItemEmits>()
const slots = useSlots()
const menu = useMenuContext()

const isCheckable = computed(() => props.role !== 'menuitem')
const itemAttrs = computed(() => menu.getItemAttrs({ role: props.role, checked: props.selected, disabled: props.disabled }))
const hasSupporting = computed(() => Boolean(props.supportingText || slots.supporting))
// A checked item shows a check where its icon would be: the state is never colour alone.
const leadingGlyph = computed(() => (isCheckable.value && props.selected ? ICONS.check : props.leadingIcon))

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  emit('select', event)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/menu/index' as t;

$t: material-map(t.$tokens, 'md-menu');
$b: '.ui-menu';

.ui-menu {
  &__item {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    gap: g($t, 'item.gap');
    width: 100%;
    min-height: g($t, 'item.min.height');
    padding-inline: g($t, 'item.padding.inline');
    border: none;
    border-radius: g($t, 'item.shape.rest');
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: start;
    text-decoration: none;

    @include typescale(g($t, 'item.text.type'));

    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: currentcolor;
      content: '';
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'item.state.duration') g($t, 'item.state.easing');
    }

    &:first-child,
    #{$b}__group-label + & {
      border-start-start-radius: g($t, 'item.shape.edge');
      border-start-end-radius: g($t, 'item.shape.edge');
    }

    &:last-child {
      border-end-start-radius: g($t, 'item.shape.edge');
      border-end-end-radius: g($t, 'item.shape.edge');
    }

    &--selected {
      border-radius: g($t, 'item.selected.shape');
    }

    &--two-line {
      padding-block: g($t, 'item.two-line.padding.block');
    }

    &--disabled {
      cursor: default;
    }

    &:not(&--disabled) {
      @include can-hover {
        &:hover::before {
          opacity: g($t, 'item.state.hover');
        }
      }

      &:focus-visible::before {
        opacity: g($t, 'item.state.focus');
      }

      &:active::before {
        opacity: g($t, 'item.state.pressed');
      }
    }
  }

  &__item-leading,
  &__item-trailing {
    display: inline-flex;
    flex: none;
    font-size: g($t, 'item.icon.size');
  }

  &__item-label {
    flex: 1;
    min-width: 0;
  }

  &__item-text,
  &__item-supporting {
    display: block;
    overflow-wrap: anywhere;
  }

  &__item-supporting {
    @include typescale(g($t, 'item.supporting.type'));
  }

  &__item-shortcut {
    @include typescale(g($t, 'item.shortcut.type'));
  }
}

// Items fill a surface that clips: the ring goes inside.
.ui-menu__item:focus-visible {
  @include focus-ring(inset);
}
</style>
