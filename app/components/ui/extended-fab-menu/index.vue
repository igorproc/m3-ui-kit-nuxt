<template>
  <div
    class="ui-extended-fab-menu"
    :class="[`ui-extended-fab-menu--${size}`]"
    v-click-outside="closeMenu"
  >
    <!-- Activator Extended FAB -->
    <ui-button-extended-fab
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
            <ui-icon
              v-if="isOpen"
              :name="closeIcon"
              class="ui-extended-fab-menu__icon ui-extended-fab-menu__icon--close"
            />
            <ui-icon
              v-else
              :name="openIcon"
              class="ui-extended-fab-menu__icon ui-extended-fab-menu__icon--open"
            />
          </transition>
        </div>
      </template>
      <slot>{{ label }}</slot>
    </ui-button-extended-fab>

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
            <ui-icon v-if="item.icon" :name="item.icon" class="ui-extended-fab-menu__item-icon" />
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
    width: 24rem;
    height: 24rem;
    transition: transform var(--sys-motion-duration-medium-2) var(--sys-motion-easing-standard);

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__icon {
    position: absolute;
    font-size: 24rem;

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
    margin-bottom: 16rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end; // Standard FAB menus align elements to the trailing edge
    z-index: 1;

    // The drawer container animation
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
    gap: 16rem;
    align-items: flex-end;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rem;
    background-color: var(--color-primary-container);
    color: var(--color-primary-container-contrast, var(--color-on-surface));
    border: none;
    border-radius: 16rem; // Standard M3 pill/fab rounding
    padding: 12rem 16rem;
    cursor: pointer;
    box-shadow: 0 4rem 8rem 3rem rgb(0 0 0 / 15%), 0 1rem 3rem rgb(0 0 0 / 30%); // Elevation 3
    white-space: nowrap;
    position: relative;
    overflow: hidden;

    @include typescale('label-large');

    &-icon {
      font-size: 24rem;
    }

    // Staggered list items animation
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
      background-color: color-mix(in srgb, var(--color-on-surface) 8%, var(--color-primary-container));
    }
    
    &:active {
      background-color: color-mix(in srgb, var(--color-on-surface) 12%, var(--color-primary-container));
    }
  }
}
</style>
