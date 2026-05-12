<template>
  <div
    v-click-outside="closeMenu"
    class="ui-split-button"
  >
    <div class="ui-split-button__wrapper">
      <m-button
        class="ui-split-button__action"
        :variant="variant"
        :color="color"
        :disabled="disabled"
        @click="$emit('click')"
      >
        <slot />
      </m-button>

      <m-button
        class="ui-split-button__dropdown"
        :variant="variant"
        :color="color"
        :disabled="disabled"
        @click="toggleMenu"
      >
        <template #prepend>
          <m-icon
            name="ic:outline-plus"
            style="transform: rotate(45deg);"
          />
        </template>
      </m-button>
    </div>

    <m-menu
      v-if="items && items.length > 0"
      v-model="isMenuOpen"
      absolute
      origin="top"
      class="ui-split-button__menu-container"
    >
      <button
        v-for="(item, index) in items"
        :key="item.value || index"
        class="ui-menu__item"
        @click="handleItemClick(item)"
      >
        <span class="ui-menu__item-label">{{ item.label }}</span>
        <m-icon
          v-if="item.icon"
          :name="item.icon"
        />
      </button>
    </m-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface UiSplitMenuItem {
  label: string
  icon?: string
  value?: string | number
  action?: () => void
}

interface Props {
  variant?: 'elevated' | 'filled' | 'outlined' | 'text' | 'tonal'
  color?: 'primary' | 'accent' | 'warn'
  disabled?: boolean
  items?: UiSplitMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  color: 'primary',
  disabled: false,
  items: () => [],
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'dropdown'): void
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
    border-left: 1rem solid color-mix(in srgb, var(--color-surface) 30%, transparent) !important;

    .ui-button__label {
      display: none; // Hide label, we only show icon
    }
  }

  &__menu-container {
    position: absolute;
    top: 100%;
    right: 0; // Align right side by default or let ui-menu handle it
    margin-top: 4rem;
    min-width: 150rem;
  }
}
</style>
