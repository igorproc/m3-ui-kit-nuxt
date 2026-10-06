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
        ref="dropdown"
        class="ui-split-button__dropdown"
        :variant="variant"
        :color="color"
        :disabled="disabled"
        :aria-label="dropdownAriaLabel"
        :aria-haspopup="hasMenu ? 'menu' : undefined"
        :aria-expanded="hasMenu ? String(isMenuOpen) : undefined"
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
      v-if="hasMenu"
      v-model="isMenuOpen"
      absolute
      origin="top"
      class="ui-split-button__menu-container"
      @click-outside="closeMenu"
    >
      <button
        v-for="(item, index) in items"
        :key="item.value || index"
        type="button"
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
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import UiButton from '#kit/components/ui/button/index.vue'
import UiIcon from '#kit/components/ui/icon/index.vue'
import UiMenu from '#kit/components/ui/menu/index.vue'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { mSplitButtonProps } from './props'
import type { UiSplitMenuItem } from './props'

const props = defineProps(mSplitButtonProps)

const emit = defineEmits<{
  (e: 'click' | 'dropdown'): void
  (e: 'select', item: UiSplitMenuItem): void
}>()

const isMenuOpen = ref(false)
const hasMenu = computed(() => props.items.length > 0)
const dropdown = useTemplateRef<{ $el: HTMLElement }>('dropdown')

useButtonNameWarning('m-button-split', () => props.dropdownAriaLabel)

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

// The menu returns focus to its parent element, which here is the wrapper div
// and cannot take it. When the menu closes with focus left nowhere (an item
// picked, Escape), it goes back to the dropdown that opened it; a click that
// moved focus elsewhere is left alone.
watch(isMenuOpen, async (open) => {
  if (open) return

  await nextTick()
  const active = document.activeElement
  if (!active || active === document.body) dropdown.value?.$el.focus()
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;

$t: material-map(t.$tokens, 'md-button');

.ui-split-button {
  display: inline-flex;
  flex-direction: column;
  position: relative;

  // Not clipped: each half rounds its own outer corners, so a focus ring drawn
  // outside either half stays visible.
  &__wrapper {
    display: inline-flex;
    align-items: stretch;
    isolation: isolate;
  }

  // The doubled class outranks `.ui-button`'s own radius and padding without
  // `!important`; a focused half rises over its neighbour so its ring shows.
  &__action.ui-button,
  &__dropdown.ui-button {
    &:focus-visible {
      z-index: 1;
    }
  }

  &__action.ui-button {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  &__wrapper > &__dropdown.ui-button {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    padding-inline: g($t, 'split.dropdown.padding.inline');
    border-inline-start: g($t, 'split.divider.width') solid g($t, 'split.divider.color');
  }

  // The menu teleports out and positions itself (fixed / CSS anchor); only
  // its intrinsic sizing belongs here, never layout offsets.
  &__menu-container {
    min-width: g($t, 'split.menu.min-width');
  }
}
</style>
