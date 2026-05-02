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
.ui-tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }

  &__content {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8rem);
    transform: translateX(-50%);
    padding: 4rem 8rem;
    border-radius: var(--sys-shape-corner-small);
    background-color: var(--color-on-surface);
    color: var(--color-surface-variant);
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 2rem 4rem rgb(0 0 0 / 15%);
    z-index: 10;

    @include typescale('body-small');
  }
}
</style>
