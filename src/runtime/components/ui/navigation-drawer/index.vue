<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? `ui-navigation-drawer-slide-${side}`"
    :content-class="['ui-navigation-drawer', `ui-navigation-drawer--${side}`, containerClass, contentClass]"
    :aria-labelledby="$slots.header ? headerId : undefined"
    :aria-label="$slots.header ? undefined : 'Navigation drawer'"
  >
    <div class="ui-navigation-drawer__surface">
      <header
        v-if="$slots.header"
        :id="headerId"
        class="ui-navigation-drawer__header"
      >
        <slot name="header" />
      </header>

      <div class="ui-navigation-drawer__content">
        <slot />
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { mNavigationDrawerProps } from './props'

const props = defineProps(mNavigationDrawerProps)

const modelValue = defineModel<boolean>({ default: false })

// The native <dialog> root is the accessible dialog; the header slot names it.
const headerId = useId()
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-drawer/index' as t;

$t: material-map(t.$tokens, 'md-navigation-drawer');

.ui-navigation-drawer {
  &__surface {
    // A flex child of the <MOverlay> panel: full height, pinned to its side.
    align-self: stretch;
    margin-inline-end: auto;
    display: flex;
    flex-direction: column;
    gap: g($t, 'surface-gap');
    min-width: g($t, 'surface-min-width');
    width: fit-content;
    height: 100%;
    padding: g($t, 'surface-padding');
    border-radius: g($t, 'surface-shape-left');
    background-color: g($t, 'surface-color');
    color: g($t, 'surface-text-color');
    box-shadow: g($t, 'surface-shadow');

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &__header {
    padding: g($t, 'header-padding');

    @include typescale(g($t, 'header-typography'));
  }
}

.ui-navigation-drawer--right {
  .ui-navigation-drawer__surface {
    margin-inline: auto 0;
    border-radius: g($t, 'surface-shape-right');
  }
}

// Slide in from the drawer's own edge; the scrim fades separately. The panel
// carries the same timing (Vue reads it to know when the phase ends) while the
// surface moves by its own width.
.ui-navigation-drawer-slide-left,
.ui-navigation-drawer-slide-right {
  &-enter-active,
  &-enter-active .ui-navigation-drawer__surface {
    transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &-leave-active,
  &-leave-active .ui-navigation-drawer__surface {
    transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }
}

.ui-navigation-drawer-slide-left-enter-from .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-left-leave-to .ui-navigation-drawer__surface {
  transform: translateX(-100%);
}

.ui-navigation-drawer-slide-right-enter-from .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-right-leave-to .ui-navigation-drawer__surface {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .ui-navigation-drawer-slide-left-enter-active,
  .ui-navigation-drawer-slide-left-leave-active,
  .ui-navigation-drawer-slide-right-enter-active,
  .ui-navigation-drawer-slide-right-leave-active,
  .ui-navigation-drawer__surface {
    transition-duration: 0s;
  }
}
</style>
