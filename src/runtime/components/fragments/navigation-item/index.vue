<template>
  <button
    type="button"
    class="ui-navigation-item"
    :class="[
      `ui-navigation-item--${host}`,
      `ui-navigation-item--${placement}`,
      {
        'ui-navigation-item--active': active,
        'ui-navigation-item--disabled': disabled,
        'ui-navigation-item--fade-label': fadeLabel,
      },
    ]"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    :aria-describedby="badgeLabel ? descriptionId : undefined"
    @click="emit('select', $event)"
  >
    <span class="ui-navigation-item__indicator">
      <span
        v-if="icon"
        class="ui-navigation-item__icon"
      >
        <MIcon
          :name="glyph"
          :filled="filled"
        />

        <span
          v-if="iconBadge"
          class="ui-navigation-item__badge"
          :class="{ 'ui-navigation-item__badge--dot': badge === true }"
          aria-hidden="true"
        >
          <MBadge
            :value="badge === true ? undefined : badge"
            :dot="badge === true"
          />
        </span>
      </span>

      <span
        v-if="placement === 'start'"
        class="ui-navigation-item__label"
      >
        {{ label }}
      </span>

      <span
        v-if="trailing"
        class="ui-navigation-item__trailing"
        aria-hidden="true"
      >
        {{ badge }}
      </span>
    </span>

    <span
      v-if="placement === 'top'"
      class="ui-navigation-item__label"
    >
      {{ label }}
    </span>

    <!-- Hidden, so it stays out of the name; aria-describedby still reads it. -->
    <span
      v-if="badgeLabel"
      :id="descriptionId"
      class="ui-navigation-item__description"
      hidden
    >
      {{ badgeLabel }}
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * Private destination of the navigation family: `<MNavigationBar>`,
 * `<MNavigationRail>` and `<MNavigationDrawer>` draw their items with it, so
 * the pill, the state layer, the badge and the active glyph live in one place.
 * Only the host's tokens differ.
 */
import { computed, useId } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MBadge from '#kit/components/ui/badge/index.vue'
import type { NavigationItemProps } from './types'

const props = withDefaults(defineProps<NavigationItemProps>(), {
  icon: undefined,
  activeIcon: undefined,
  active: false,
  disabled: false,
  badge: undefined,
  badgeLabel: undefined,
  fadeLabel: false,
})

const emit = defineEmits<{
  (event: 'select', nativeEvent: MouseEvent): void
}>()

const descriptionId = useId()

// The active destination draws a filled glyph: its own `activeIcon`, or the
// filled pair of an outline `ic` icon.
const glyph = computed(() => (props.active && props.activeIcon ? props.activeIcon : props.icon!))
const filled = computed(() => props.active && !props.activeIcon)

const iconBadge = computed(() => props.host !== 'drawer'
  && (props.badge === true || (typeof props.badge === 'number' && props.badge > 0)))
const trailing = computed(() => props.host === 'drawer'
  && props.badge !== undefined && props.badge !== true && props.badge !== '' && props.badge !== 0)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-item/index' as t;
@use '#kit/assets/stylesheet/components/badge/index' as badge;

$t: material-map(t.$tokens, 'md-navigation-item');

@keyframes ui-navigation-item-label-top {
  from { opacity: 0; }
}

@keyframes ui-navigation-item-label-start {
  from { opacity: 0; }
}

.ui-navigation-item {
  display: flex;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: g($t, 'unselected.content.color');
  font: inherit;
  text-align: center;
  cursor: pointer;
  outline: none;
  transition: color g($t, 'motion.color.duration') g($t, 'motion.color.easing');

  // The pill: it holds the selection fill and, above it, the state layer.
  &__indicator {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    max-width: 100%;
    border-radius: g($t, 'indicator.shape');

    // Selection fill: grows out of the centre of the pill.
    &::after {
      content: '';
      position: absolute;
      inset: 0 50%;
      z-index: -2;
      border-radius: inherit;
      background-color: g($t, 'selected.container.color');
      opacity: 0;
      transition:
        left g($t, 'motion.indicator.duration') g($t, 'motion.indicator.easing'),
        right g($t, 'motion.indicator.duration') g($t, 'motion.indicator.easing'),
        opacity g($t, 'motion.indicator.duration') g($t, 'motion.indicator.easing');
    }

    // State layer, drawn over the fill: hovering the active pill never thins it.
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: g($t, 'indicator.state.color');
      opacity: 0;
      transition: opacity g($t, 'motion.color.duration') g($t, 'motion.color.easing');
    }
  }

  &__icon {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    font-size: g($t, 'icon.size');
  }

  // The icon box is the anchor: the badge takes its top-end corner (M3 BadgedBox).
  &__badge {
    @include badge.badge-anchor(large);

    display: inline-flex;
    line-height: 0;

    &--dot {
      @include badge.badge-anchor(small);
    }
  }

  &__label {
    min-width: 0;
  }

  &__trailing {
    margin-inline-start: auto;
    color: g($t, 'drawer.trailing.color');
  }

  &--active {
    color: g($t, 'selected.content.color');
  }

  &--active &__icon {
    color: g($t, 'selected.content.icon');
  }

  &--active &__indicator::after {
    inset: 0;
    opacity: 1;
  }

  // ---- placement ---------------------------------------------------------

  &--top {
    flex-direction: column;
    justify-content: center;
    gap: g($t, 'top.gap');

    @include typescale(g($t, 'top.typography'));
  }

  &--top &__label {
    display: -webkit-box;
    max-width: 100%;
    overflow: hidden;
    overflow-wrap: break-word;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &--start &__label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: start;
  }

  // ---- hosts ---------------------------------------------------------------

  &--bar {
    padding-block: g($t, 'bar.padding.block');
  }

  &--bar.ui-navigation-item--top &__indicator {
    width: g($t, 'bar.indicator.width');
    height: g($t, 'bar.indicator.height');
  }

  &--bar.ui-navigation-item--start {
    justify-content: center;
  }

  &--bar.ui-navigation-item--start &__indicator {
    gap: g($t, 'bar.start.gap');
    height: g($t, 'bar.start.height');
    padding-inline: g($t, 'bar.start.padding');

    @include typescale(g($t, 'bar.start.typography'));
  }

  &--rail.ui-navigation-item--top {
    width: 100%;
    min-height: g($t, 'rail.min-height');
  }

  &--rail.ui-navigation-item--top &__indicator {
    width: g($t, 'rail.indicator.width');
    height: g($t, 'rail.indicator.height');
  }

  &--rail.ui-navigation-item--start {
    max-width: 100%;

    @include typescale(g($t, 'start.typography'));
  }

  &--rail.ui-navigation-item--start &__indicator {
    gap: g($t, 'rail.start.gap');
    height: g($t, 'rail.start.height');
    padding-inline: g($t, 'rail.start.padding');
  }

  // A rail switching layout in place, while its width runs: the label fades
  // in rather than jumping between the two spots. A keyframe animation starts
  // whenever its name changes, hence one name per placement.
  &--fade-label &__label {
    animation: ui-navigation-item-label-top g($t, 'motion.label.duration') g($t, 'motion.label.easing');
  }

  &--fade-label.ui-navigation-item--start &__label {
    animation-name: ui-navigation-item-label-start;
  }

  // The drawer's pill is the whole row.
  &--drawer {
    width: 100%;

    @include typescale(g($t, 'start.typography'));
  }

  &--drawer &__indicator {
    justify-content: flex-start;
    gap: g($t, 'drawer.gap');
    width: 100%;
    height: g($t, 'drawer.height');
    padding-inline: g($t, 'drawer.padding.start') g($t, 'drawer.padding.end');
  }

  &--drawer.ui-navigation-item--active {
    color: g($t, 'drawer.selected.content.color');
  }

  // ---- states --------------------------------------------------------------

  @include can-hover {
    &:hover:not(:disabled) &__indicator::before {
      opacity: g($t, 'indicator.state.hover');
    }

    &:hover:not(:disabled, .ui-navigation-item--active) {
      color: g($t, 'unselected.content.active.color');
    }
  }

  &:focus-visible &__indicator {
    @include focus-ring;
  }

  &:focus-visible &__indicator::before {
    opacity: g($t, 'indicator.state.focus');
  }

  &:active:not(:disabled) &__indicator::before {
    opacity: g($t, 'indicator.state.pressed');
  }

  &--disabled {
    color: g($t, 'disabled.color');
    cursor: default;
  }

  &--disabled &__icon {
    color: inherit;
  }

  // Forced colors erase the fill: the active pill becomes Highlight under
  // HighlightText, a disabled destination GrayText.
  @include forced-colors {
    &--active &__indicator {
      forced-color-adjust: none;
      color: HighlightText;
    }

    &--active &__indicator::after {
      background-color: Highlight;
    }

    &--active &__icon {
      color: HighlightText;
    }

    &:focus-visible &__indicator {
      outline-color: CanvasText;
    }

    &--disabled {
      color: GrayText;
    }
  }
}
</style>
