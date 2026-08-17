<template>
  <vue-final-modal
    v-bind="{ modelValue }"
    content-class="ui-navigation-drawer__surface"
    :overlay-transition="overlayTransition"
    :content-transition="contentTransition"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    :aria-labelledby="$slots.header ? headerId : undefined"
    :aria-label="$slots.header ? undefined : 'Navigation drawer'"
    @update:model-value="onUpdateModelValue"
  >
    <header
      v-if="$slots.header"
      :id="headerId"
      class="ui-navigation-drawer__header"
    >
      <slot name="header" />
    </header>

    <div :class="['ui-navigation-drawer__content', backdropClass]">
      <slot />
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import { mNavigationDrawerProps } from './props'

const props = defineProps(mNavigationDrawerProps)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = defineModel<boolean>({ default: false })

// vue-final-modal already emits role="dialog" + aria-modal="true"; supply the
// accessible name from the header slot when present.
const headerId = useId()

const overlayTransition = 'vfm-fade'
const contentTransition = computed(() =>
  props.side === 'right' ? 'vfm-slide-right' : 'vfm-slide-left',
)

const backdropClass = computed(() => [
  'ui-navigation-drawer',
  `ui-navigation-drawer--${props.side}`,
  props.containerClass,
])

function onUpdateModelValue(value: boolean) {
  modelValue.value = value
  emit('update:modelValue', value)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-drawer/index' as t;

$t: material-map(t.$tokens, 'md-navigation-drawer');

.ui-navigation-drawer {
  &__surface {
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
  }

  &__header {
    padding: g($t, 'header-padding');

    @include typescale(g($t, 'header-typography'));
  }
}

.ui-navigation-drawer--right {
  .ui-navigation-drawer__surface {
    border-radius: g($t, 'surface-shape-right');
  }
}
</style>
