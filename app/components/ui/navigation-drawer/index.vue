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
.ui-navigation-drawer {
  &__surface {
    display: flex;
    flex-direction: column;
    gap: 8rem;
    min-width: 360rem;
    width: fit-content;
    height: 100%;
    padding: 16rem;
    border-radius: 0 var(--sys-shape-corner-large) var(--sys-shape-corner-large) 0;
    background-color: var(--color-surface);
    color: var(--color-on-surface);
    box-shadow:
      0 0 16rem rgb(0 0 0 / 24%),
      0 0 32rem rgb(0 0 0 / 20%);
  }

  &__header {
    padding: 4rem 8rem 12rem;

    // Typography: Title Medium
    @include typescale('title-medium');
  }
}

.ui-navigation-drawer--right {
  .ui-navigation-drawer__surface {
    border-radius: var(--sys-shape-corner-large) 0 0 var(--sys-shape-corner-large);
  }
}
</style>
