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

export type UiMenuOrigin = 'top left' | 'top right' | 'bottom left' | 'bottom right' | 'center' | 'top' | 'bottom'

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
.ui-menu {
  position: fixed;
  inset: 0;
  z-index: 40;

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
    top: 72rem;
    right: 32rem;
    min-width: 112rem;
    max-width: 280rem;
    padding-block: 8rem;
    border-radius: var(--sys-shape-corner-extra-small, 4rem);
    background-color: var(--color-surface-container, var(--color-surface));
    color: var(--color-on-surface);
    box-shadow: 0 2rem 6rem 2rem rgb(0 0 0 / 15%), 0 1rem 2rem rgb(0 0 0 / 30%); // Elevation 2

    // Animation properties
    transform-origin: var(--ui-menu-origin);
    will-change: transform, opacity;
  }

  &__item {
    width: 100%;
    min-height: 48rem;
    padding: 0 12rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12rem;
    border: none;
    background: transparent;
    cursor: pointer;

    @include typescale('label-large');

    color: var(--color-on-surface);
    text-align: left;
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-on-surface) 8%,
        transparent
      );
    }

    &:active {
      background-color: color-mix(
        in srgb,
        var(--color-on-surface) 12%,
        transparent
      );
    }
  }

  &__item-label {
    flex: 1;
  }

  &__item-shortcut {
    color: var(--color-on-surface-variant);

    @include typescale('body-small');
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
