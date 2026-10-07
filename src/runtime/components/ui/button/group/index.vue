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
import { useVModel } from '@vueuse/core'
import UiButton from '#kit/components/ui/button/index.vue'
import UiIcon from '#kit/components/ui/icon/index.vue'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { useSegmentedButton } from '#kit/composables/button/useSegmentedButton'
import { useReducedMotion } from '#kit/composables/useReducedMotion'
import { toggleTransition } from '../morph'
import { mButtonGroupProps } from './props'
import type { MButtonGroupModelValue } from './props'

const props = defineProps(mButtonGroupProps)

const emit = defineEmits<{
  (e: 'update:modelValue', value: MButtonGroupModelValue): void
}>()

const value = useVModel(props, 'modelValue', emit, {
  passive: true,
  deep: true,
})

// The toggle look comes from MButton's selected / unselected classes; the
// state itself is announced by the engine (`aria-checked` or `aria-pressed`),
// so the buttons get no `selected` prop of their own.
const { isSelected, groupAttrs, segmentAttrs, segmentRef } = useSegmentedButton(value, props)

useButtonNameWarning('m-button-group', () => undefined)

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

  // The doubled class outranks MButton's own round and selected-square
  // corners. Inner corners stay small; pressing does not reshape, only
  // selection does.
  &__item.ui-button {
    border-radius: g($t, 'inner');

    &:first-child {
      border-start-start-radius: g($t, 'outer');
      border-end-start-radius: g($t, 'outer');
    }

    &:last-child {
      border-start-end-radius: g($t, 'outer');
      border-end-end-radius: g($t, 'outer');
    }

    &:focus-visible {
      z-index: 1;
    }
  }

  &__item.ui-button.ui-button--selected {
    border-radius: g($t, 'selected');
  }
}
</style>
