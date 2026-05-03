<template>
  <vue-final-modal
    v-bind="{ modelValue }"
    content-class="ui-navigation-drawer__surface"
    :overlay-transition="overlayTransition"
    :content-transition="contentTransition"
    :click-to-close="clickToClose"
    :esc-to-close="escToClose"
    @update:model-value="onUpdateModelValue"
  >
    <header
      v-if="$slots.header"
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

interface Props {
  side?: 'left' | 'right'
  clickToClose?: boolean
  escToClose?: boolean
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  side: 'left',
  clickToClose: true,
  escToClose: true,
  containerClass: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = defineModel<boolean>({ default: false })

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
@use '~/assets/stylesheet/components/navigation-drawer' as v;

.ui-navigation-drawer {
  &__surface {
    display: flex;
    flex-direction: column;
    gap: v.$surface-gap;
    min-width: v.$surface-min-width;
    width: fit-content;
    height: 100%;
    padding: v.$surface-padding;
    border-radius: v.$surface-border-radius-left;
    background-color: v.$surface-bg-color;
    color: v.$surface-text-color;
    box-shadow: v.$surface-shadow;
  }

  &__header {
    padding: v.$header-padding;

    @include typescale(v.$header-text-type);
  }
}

.ui-navigation-drawer--right {
  .ui-navigation-drawer__surface {
    border-radius: v.$surface-border-radius-right;
  }
}
</style>
