<template>
  <div class="ui-split-button">
    <div class="ui-split-button__wrapper">
      <UiButton
        class="ui-split-button__action"
        :variant="variant"
        :color="color"
        :disabled="disabled"
        @click="$emit('click')"
      >
        <slot />
      </UiButton>

      <UiButton
        class="ui-split-button__dropdown"
        :variant="variant"
        :color="color"
        :disabled="disabled"
        @click="toggleMenu"
      >
        <template #prepend>
          <UiIcon
            name="ic:outline-plus"
            style="transform: rotate(45deg);"
          />
        </template>
      </UiButton>
    </div>

    <UiMenu
      v-if="items && items.length > 0"
      v-model="isMenuOpen"
      absolute
      origin="top"
      class="ui-split-button__menu-container"
      @click-outside="closeMenu"
    >
      <button
        v-for="(item, index) in items"
        :key="item.value || index"
        class="ui-menu__item"
        @click="handleItemClick(item)"
      >
        <span class="ui-menu__item-label">{{ item.label }}</span>
        <UiIcon
          v-if="item.icon"
          :name="item.icon"
        />
      </button>
    </UiMenu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import UiButton from '~/components/ui/button/index.vue'
import UiIcon from '~/components/ui/icon/index.vue'
import UiMenu from '~/components/ui/menu/index.vue'
import { mSplitButtonProps } from './props'
import type { UiSplitMenuItem } from './props'

const props = defineProps(mSplitButtonProps)

const emit = defineEmits<{
  (e: 'click' | 'dropdown'): void
  (e: 'select', item: UiSplitMenuItem): void
}>()

const isMenuOpen = ref(false)

function toggleMenu() {
  if (props.disabled) return
  isMenuOpen.value = !isMenuOpen.value
  emit('dropdown')
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleItemClick(item: UiSplitMenuItem) {
  if (item.action) {
    item.action()
  }
  emit('select', item)
  closeMenu()
}
</script>

<style lang="scss">
@use 'sass:map';

.ui-split-button {
  display: inline-flex;
  flex-direction: column;
  position: relative;

  &__wrapper {
    display: inline-flex;
    align-items: stretch;
    border-radius: var(--sys-shape-corner-full, 100vmax);
    overflow: hidden;
  }

  // Adjust borders for the two pieces
  &__action {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  &__dropdown {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    padding-inline: 4rem !important; // Narrower for the icon

    // Add separator if it's a filled/tonal/elevated button
    border-left: 1rem solid color-mix(in srgb, #{map.get($theme-color-link, 'surface')} 30%, transparent) !important;

    .ui-button__label {
      display: none; // Hide label, we only show icon
    }
  }

  // The menu teleports out and positions itself (fixed / CSS anchor); only
  // its intrinsic sizing belongs here, never layout offsets.
  &__menu-container {
    min-width: 150rem;
  }
}
</style>
