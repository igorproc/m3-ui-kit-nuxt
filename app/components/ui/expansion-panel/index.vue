<template>
  <div
    class="ui-expansion-panel"
    :class="{
      'ui-expansion-panel--expanded': isOpen,
      'ui-expansion-panel--disabled': disabled,
    }"
  >
    <button
      :id="headerId"
      type="button"
      class="ui-expansion-panel__header"
      :aria-expanded="isOpen"
      :aria-controls="regionId"
      :disabled="disabled"
      @click="toggle"
    >
      <div class="ui-expansion-panel__header-content">
        <slot name="header">
          <span class="ui-expansion-panel__title">{{ title }}</span>
          <span
            v-if="description"
            class="ui-expansion-panel__description"
          >
            {{ description }}
          </span>
        </slot>
      </div>

      <div class="ui-expansion-panel__trailing">
        <m-icon :name="ICONS.keyboardArrowDown" />
      </div>
    </button>

    <div
      :id="regionId"
      class="ui-expansion-panel__content-wrapper"
      role="region"
      :aria-labelledby="headerId"
      :aria-hidden="!isOpen"
    >
      <div class="ui-expansion-panel__content-inner">
        <div class="ui-expansion-panel__content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, useId } from 'vue'
import { ICONS } from '~~/shared/constants/icons'
import { mExpansionPanelProps } from './props'
import { useExpansionPanelGroupContext } from '~/composables/expansion-panel/useExpansionPanelGroup'

const props = defineProps(mExpansionPanelProps)

const modelValue = defineModel<boolean>({ default: false })

const group = useExpansionPanelGroupContext()

// Grouped mode derives a stable value (prop or generated id); standalone keeps
// using its own `v-model`.
const generatedValue = useId()
const panelValue = computed(() => props.value ?? generatedValue)

// ARIA wiring: header labels the content region, region is controlled by header.
const headerId = useId()
const regionId = useId()

if (group) {
  const ticket = group.register({
    value: panelValue.value,
    disabled: () => props.disabled,
  })

  onScopeDispose(() => group.unregister(ticket.id))
}

const isOpen = computed(() => {
  if (group) return group.isOpen(panelValue.value)

  return modelValue.value
})

function toggle() {
  if (props.disabled) return

  if (group) {
    group.toggle(panelValue.value)

    return
  }

  modelValue.value = !modelValue.value
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/expansion-panel/index' as *;

.ui-expansion-panel {
  $t: material-map($tokens, 'md-expansion-panel');

  display: flex;
  flex-direction: column;
  background-color: g($t, 'base-bg-default');
  border-radius: g($t, 'base-border-radius');
  transition:
    background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    margin var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    border-radius var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
    box-shadow var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: g($t, 'header-gap');
    width: 100%;
    min-height: g($t, 'header-min-height');
    padding: g($t, 'header-padding');
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: g($t, 'header-text-color');
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:disabled {
      cursor: default;
      opacity: g($t, 'disabled-opacity');
    }

    &:hover:not(:disabled) {
      background-color: g($t, 'header-hover-bg');
    }

    &:active:not(:disabled) {
      background-color: g($t, 'header-active-bg');
    }
  }

  &__header-content {
    display: flex;
    flex-direction: column;
    gap: g($t, 'header-content-gap');
    flex: 1;
  }

  &__title {
    color: g($t, 'header-text-color');

    @include typescale(g($t, 'typography-title'));
  }

  &__description {
    color: g($t, 'description-text-color');

    @include typescale(g($t, 'typography-description'));
  }

  &__trailing {
    display: flex;
    align-items: center;
    justify-content: center;
    color: g($t, 'trailing-color-default');
    transition: transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
    font-size: g($t, 'trailing-icon-size');
  }

  // Content Animation using Grid Trick
  &__content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
  }

  &__content-inner {
    overflow: hidden;
  }

  &__content {
    color: g($t, 'content-text-color');
    padding: 0 g($t, 'content-padding-inline') g($t, 'content-padding-bottom');
    opacity: 0;
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    @include typescale(g($t, 'typography-content'));
  }

  &--expanded {
    background-color: g($t, 'base-bg-expanded');
    box-shadow: g($t, 'base-expanded-shadow');

    .ui-expansion-panel__trailing {
      transform: rotate(180deg);
      color: g($t, 'trailing-color-active');
    }

    .ui-expansion-panel__content {
      opacity: 1;

      &-wrapper {
        grid-template-rows: 1fr;
      }
    }
  }
}
</style>
