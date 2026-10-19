<template>
  <div
    v-if="items.length"
    v-bind="groupAttrs"
    class="ui-button-group"
  >
    <UiButton
      v-for="(item, index) in items"
      :key="item.value"
      :ref="segmentRef(index)"
      class="ui-button-group__item"
      :class="isSelected(item.value) ? 'ui-button--selected' : 'ui-button--unselected'"
      :variant="variant"
      :color="color"
      :density="density"
      :style="{ transition: toggleTransition(reducedMotion) }"
      v-bind="segmentAttrs(item, index)"
    >
      <template
        v-if="item.icon"
        #prepend
      >
        <UiIcon :name="item.icon" />
      </template>
      <template
        v-if="item.label"
        #default
      >
        {{ item.label }}
      </template>
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from '#kit/components/ui/button/index.vue'
import UiIcon from '#kit/components/ui/icon/index.vue'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import { useSegmentedButton } from '#kit/composables/button/useSegmentedButton'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { toggleTransition } from '../morph'
import { mButtonGroupProps } from './props'
import type { MButtonGroupModelValue } from './props'

const props = defineProps(mButtonGroupProps)

/** Selected value, or values with `multiple`. */
const value = defineModel<MButtonGroupModelValue>()

// The toggle look comes from MButton's selected / unselected classes; the
// state itself is announced by the engine (`aria-checked` or `aria-pressed`),
// so the buttons get no `selected` prop of their own.
const { isSelected, groupAttrs, segmentAttrs, segmentRef } = useSegmentedButton(value, props)

useButtonNameWarning('m-button-group', () => undefined, '`aria-label` or `aria-labelledby`')

// Every button of a connected group is a toggle: a selected one becomes a pill on a spring.
const reducedMotion = useReducedMotion()
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/group' as t;

.ui-button-group {
  $t: material-map(t.$tokens, 'md-button-group');

  display: inline-flex;
  max-width: 100%;
  gap: g($t, 'gap');

  // The step class outranks MButton's own toggle corners. Inner corners stay
  // small; the ends and a selected button are the step's pill. Pressing does
  // not reshape, only selection does.
  @each $step in ('compact', 'default', 'comfortable') {
    &__item.ui-button.ui-button--#{$step} {
      $outer: g($t, 'outer.#{$step}');

      border-radius: g($t, 'inner');

      &:first-child {
        border-start-start-radius: $outer;
        border-end-start-radius: $outer;
      }

      &:last-child {
        border-start-end-radius: $outer;
        border-end-end-radius: $outer;
      }

      &.ui-button--selected {
        border-radius: $outer;
      }
    }
  }

  &__item.ui-button:focus-visible {
    z-index: 1;
  }
}
</style>
