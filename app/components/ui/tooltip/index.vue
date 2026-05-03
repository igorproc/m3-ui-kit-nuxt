<template>
  <span
    class="ui-tooltip"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <span class="ui-tooltip__trigger">
      <slot />
    </span>

    <span
      v-if="visible"
      class="ui-tooltip__content"
      role="tooltip"
    >
      <slot name="content">
        {{ text }}
      </slot>
    </span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '',
})

const visible = ref(false)

function onEnter() {
  visible.value = true
}

function onLeave() {
  visible.value = false
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tooltip' as v;

.ui-tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }

  &__content {
    position: absolute;
    left: 50%;
    bottom: calc(100% + v.$content-offset);
    transform: translateX(-50%);
    padding: v.$content-padding;
    border-radius: v.$content-border-radius;
    background-color: v.$content-bg-color;
    color: v.$content-color;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: v.$content-shadow;
    z-index: v.$z-index;

    @include typescale(v.$content-text-type);
  }
}
</style>
