<template>
  <div
    class="ui-extended-fab-menu"
    :class="[`ui-extended-fab-menu--${size}`]"
    v-click-outside="closeMenu"
  >
    <!-- Activator Extended FAB -->
    <m-button-extended-fab
      class="ui-extended-fab-menu__activator"
      :size="size"
      :color="color"
      :disabled="disabled"
      @click="toggleMenu"
    >
      <template #prepend>
        <div class="ui-extended-fab-menu__icon-wrapper" :class="{ 'is-open': isOpen }">
          <!-- Transition between open/close icons -->
          <transition name="ui-extended-fab-menu-icon">
            <m-icon
              v-if="isOpen"
              :name="closeIcon"
              class="ui-extended-fab-menu__icon ui-extended-fab-menu__icon--close"
            />
            <m-icon
              v-else
              :name="openIcon"
              class="ui-extended-fab-menu__icon ui-extended-fab-menu__icon--open"
            />
          </transition>
        </div>
      </template>
      <slot>{{ label }}</slot>
    </m-button-extended-fab>

    <!-- Drawer with Menu Items -->
    <transition name="ui-extended-fab-menu-drawer">
      <div v-if="isOpen" class="ui-extended-fab-menu__drawer">
        <transition-group
          name="ui-extended-fab-menu-item"
          tag="div"
          class="ui-extended-fab-menu__list"
        >
          <button
            v-for="(item, index) in items"
            :key="item.value || index"
            class="ui-extended-fab-menu__item"
            :style="{ transitionDelay: `${(items.length - 1 - index) * 0.05}s` }"
            @click="handleItemClick(item)"
          >
            <span v-if="item.label" class="ui-extended-fab-menu__label">{{ item.label }}</span>
            <m-icon v-if="item.icon" :name="item.icon" class="ui-extended-fab-menu__item-icon" />
          </button>
        </transition-group>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface UiExtendedFabMenuItem {
  label?: string
  icon?: string
  value?: string | number
  action?: () => void
}

interface Props {
  items: UiExtendedFabMenuItem[]
  label?: string
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'surface' | 'secondary' | 'tertiary'
  openIcon?: string
  closeIcon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Menu',
  size: 'medium',
  color: 'primary',
  openIcon: 'asset:ui-test-plus',
  closeIcon: 'asset:ui-test-close',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'select', item: UiExtendedFabMenuItem): void
}>()

const isOpen = ref(false)

function toggleMenu() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleItemClick(item: UiExtendedFabMenuItem) {
  if (item.action) {
    item.action()
  }
  emit('select', item)
  closeMenu()
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/extended-fab-menu' as v;

.ui-extended-fab-menu {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  &__activator {
    position: relative;
    z-index: 2;
  }

  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: v.$icon-size;
    height: v.$icon-size;
    transition: transform var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__icon {
    position: absolute;
    font-size: v.$icon-size;

    &.ui-extended-fab-menu-icon-enter-active,
    &.ui-extended-fab-menu-icon-leave-active {
      transition: opacity var(--sys-motion-duration-medium-1) var(--sys-motion-easing-standard),
                  transform var(--sys-motion-duration-medium-1) var(--sys-motion-easing-standard);
    }

    &.ui-extended-fab-menu-icon-enter-from {
      opacity: 0;
      transform: scale(0.5) rotate(-45deg);
    }

    &.ui-extended-fab-menu-icon-leave-to {
      opacity: 0;
      transform: scale(0.5) rotate(45deg);
    }
  }

  &__drawer {
    position: absolute;
    bottom: 100%;
    margin-bottom: v.$drawer-margin-bottom;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 1;

    &.ui-extended-fab-menu-drawer-enter-active,
    &.ui-extended-fab-menu-drawer-leave-active {
      transition: opacity var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);
    }

    &.ui-extended-fab-menu-drawer-enter-from,
    &.ui-extended-fab-menu-drawer-leave-to {
      opacity: 0;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: v.$list-gap;
    align-items: flex-end;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: v.$item-gap;
    background-color: v.$item-bg-color;
    color: v.$item-text-color;
    border: none;
    border-radius: v.$item-border-radius;
    padding: v.$item-padding;
    cursor: pointer;
    box-shadow: v.$item-shadow;
    white-space: nowrap;
    position: relative;
    overflow: hidden;

    @include typescale(v.$item-text-type);

    &-icon {
      font-size: v.$item-icon-size;
    }

    &.ui-extended-fab-menu-item-enter-active,
    &.ui-extended-fab-menu-item-leave-active {
      transition: opacity var(--sys-motion-duration-medium-4) var(--sys-motion-easing-emphasized-decelerate),
                  transform var(--sys-motion-duration-medium-4) var(--sys-motion-easing-emphasized-decelerate);
    }

    &.ui-extended-fab-menu-item-enter-from,
    &.ui-extended-fab-menu-item-leave-to {
      opacity: 0;
      transform: translateY(20rem) scale(0.9);
    }

    &:hover {
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, v.$item-bg-color);
    }
    
    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, v.$item-bg-color);
    }
  }
}
</style>
