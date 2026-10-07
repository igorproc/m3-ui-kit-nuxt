<template>
  <div
    class="ui-split-button"
    :class="`ui-split-button--${density}`"
  >
    <div class="ui-split-button__wrapper">
      <UiButton
        class="ui-split-button__action"
        :variant="variant"
        :color="color"
        :density="density"
        :disabled="disabled"
        :loading="loading"
        @click="emit('click')"
      >
        <template
          v-if="$slots.prepend"
          #prepend
        >
          <slot name="prepend" />
        </template>
        <slot />
      </UiButton>

      <UiButton
        ref="trailing"
        class="ui-split-button__trailing"
        :variant="variant"
        :color="color"
        :density="density"
        :disabled="disabled || loading"
        :aria-label="trailingLabel"
        :aria-haspopup="hasMenu ? 'menu' : undefined"
        :aria-expanded="hasMenu ? String(isMenuOpen) : undefined"
        @click="onTrailing"
      >
        <template #prepend>
          <slot
            name="trailing"
            :open="isMenuOpen"
          >
            <UiIcon :name="isMenuOpen ? ICONS.keyboardArrowUp : ICONS.keyboardArrowDown" />
          </slot>
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
      <slot
        name="menu"
        :close="closeMenu"
      />
    </UiMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, useSlots, useTemplateRef, watch } from 'vue'

import UiButton from '#kit/components/ui/button/index.vue'
import UiIcon from '#kit/components/ui/icon/index.vue'
import UiMenu from '#kit/components/ui/menu/index.vue'
import { useButtonNameWarning } from '#kit/composables/button/useButtonNameWarning'
import { useRetiredPropWarning, useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import { ICONS } from '#kit/shared/constants/icons'
import { mSplitButtonProps } from './props'

const props = defineProps(mSplitButtonProps)

const emit = defineEmits<{
  /** @deprecated Listen to `trailing`. Still emitted for one release. */
  (e: 'click' | 'trailing' | 'dropdown'): void
}>()

const slots = useSlots()
const isMenuOpen = ref(false)
const hasMenu = computed(() => !!slots.menu)
const trailingLabel = computed(() => props.trailingAriaLabel ?? props.dropdownAriaLabel)
const trailing = useTemplateRef<{ $el: HTMLElement }>('trailing')

useButtonNameWarning('m-button-split', () => trailingLabel.value)
useRetiredValueWarning('m-button-split', 'variant', () => props.variant, { text: '`outlined`' })
useRetiredPropWarning('m-button-split', 'dropdownAriaLabel', () => props.dropdownAriaLabel, '`trailingAriaLabel`')
if (import.meta.dev && getCurrentInstance()?.vnode.props?.onDropdown) {
  console.warn('[m-button-split] the `dropdown` event is retired: listen to `trailing`.')
}

function onTrailing() {
  if (props.disabled || props.loading) return

  if (hasMenu.value) isMenuOpen.value = !isMenuOpen.value
  emit('trailing')
  emit('dropdown')
}

function closeMenu() {
  isMenuOpen.value = false
}

// The menu returns focus to its parent element, which here is the wrapper div
// and cannot take it. When the menu closes with focus left nowhere (an item
// picked, Escape), it goes back to the trailing button that opened it; a click
// that moved focus elsewhere is left alone.
watch(isMenuOpen, async (open) => {
  if (open) return

  await nextTick()
  const active = document.activeElement
  if (!active || active === document.body) trailing.value?.$el.focus()
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/button/_index' as t;

$t: material-map(t.$tokens, 'md-button');
$densities: ('compact', 'default', 'comfortable');

.ui-split-button {
  display: inline-flex;
  flex-direction: column;
  position: relative;

  // Not clipped: each button rounds its own corners, so a focus ring drawn
  // outside either one stays visible.
  &__wrapper {
    display: inline-flex;
    align-items: stretch;
    gap: g($t, 'split.gap');
    isolation: isolate;
  }

  // The wrapper's child combinator outranks `.ui-button`'s own radius, padding
  // and icon-only box without `!important`; a focused button rises over its
  // neighbour so its ring shows. Corners stay put on hover, press and open.
  &__wrapper > &__action.ui-button,
  &__wrapper > &__trailing.ui-button {
    &:focus-visible {
      z-index: 1;
    }
  }

  &__wrapper > &__action.ui-button {
    min-width: g($t, 'split.min-width');
    border-start-end-radius: g($t, 'split.inner');
    border-end-end-radius: g($t, 'split.inner');
  }

  &__wrapper > &__trailing.ui-button {
    padding-inline: 0;
    border-start-start-radius: g($t, 'split.inner');
    border-end-start-radius: g($t, 'split.inner');
  }

  @each $step in $densities {
    &--#{$step} {
      $d: 'split.density.#{$step}';

      .ui-split-button__wrapper > .ui-split-button__action.ui-button {
        padding-inline-end: g($t, '#{$d}.leading.end');
      }

      .ui-split-button__wrapper > .ui-split-button__trailing.ui-button {
        width: g($t, '#{$d}.trailing.width');

        .ui-button__icon,
        .ui-button__spinner {
          font-size: g($t, '#{$d}.trailing.icon');
        }
      }
    }
  }

  // The menu teleports out and positions itself (fixed / CSS anchor); only
  // its intrinsic sizing belongs here, never layout offsets.
  &__menu-container {
    min-width: g($t, 'split.menu.min-width');
  }
}
</style>
