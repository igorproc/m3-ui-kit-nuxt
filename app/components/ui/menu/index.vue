<template>
  <transition name="ui-menu-anim">
    <div
      v-if="modelValue"
      class="ui-menu"
      :class="{ 'ui-menu--absolute': absolute }"
      :style="{ '--ui-menu-origin': origin }"
    >
      <button
        v-if="!absolute"
        class="ui-menu__backdrop"
        type="button"
        aria-hidden="true"
        @click="onBackdropClick"
      />

      <div
        ref="$menu"
        class="ui-menu__surface"
        role="menu"
      >
        <slot />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { UiMenuOrigin } from './types'

interface Props {
  closeOnBackdrop?: boolean
  absolute?: boolean
  origin?: UiMenuOrigin
}

withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
  absolute: false,
  origin: 'top left',
})

const $menu = shallowRef<null | HTMLElement>(null)
const modelValue = defineModel<boolean>({ default: false })

const onBackdropClick = () => {
  if (!modelValue.value) {
    return
  }

  if (useAttrs().closeOnBackdrop === false) {
    return
  }

  modelValue.value = false
}

onMounted(() => {
  if (!$menu.value) {
    return
  }

  onClickOutside($menu.value, onBackdropClick)
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/menu' as v;

.ui-menu {
  position: fixed;
  inset: 0;
  z-index: v.$z-index;

  &__backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    margin: 0;
    background: transparent;
    cursor: default;
  }

  &__surface {
    position: absolute;
    top: v.$surface-top;
    right: v.$surface-right;
    min-width: v.$surface-min-width;
    max-width: v.$surface-max-width;
    border-radius: v.$surface-border-radius;
    background-color: v.$surface-bg-color;
    color: v.$surface-color;
    box-shadow: v.$surface-shadow;

    // Animation properties
    transform-origin: var(--ui-menu-origin);
    will-change: transform, opacity;
  }

  &__item {
    width: 100%;
    min-height: v.$item-min-height;
    padding: v.$item-padding;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: v.$item-gap;
    border: none;
    background: transparent;
    cursor: pointer;

    @include typescale(v.$item-text-type);

    color: v.$item-text-color;
    text-align: left;
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:hover {
      background-color: v.$item-hover-bg;
    }

    &:active {
      background-color: v.$item-active-bg;
    }
  }

  &__item-label {
    flex: 1;
  }

  &__item-shortcut {
    color: v.$item-shortcut-color;

    @include typescale(v.$item-shortcut-type);
  }

  &--absolute {
    position: absolute;
    inset: unset;
    width: 100%;
    height: auto;
    z-index: 10;

    .ui-menu__surface {
      position: relative;
      top: 0;
      right: 0;
      width: 100%;
      max-width: none;
      margin: 0;
    }
  }

  &-anim-enter-active,
  &-anim-leave-active {
    transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1);

    .ui-menu__surface {
      transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
    }
  }

  &-anim-enter-from,
  &-anim-leave-to {
    opacity: 0;

    .ui-menu__surface {
      transform: scale(0.8);
    }
  }
}
</style>
