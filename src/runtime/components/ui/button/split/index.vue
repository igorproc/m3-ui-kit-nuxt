<template>
  <div
    class="ui-split-button"
    :class="`ui-split-button--${density}`"
    v-bind="rootAttrs()"
  >
    <div class="ui-split-button__wrapper">
      <UiButton
        class="ui-split-button__action"
        :variant="variant"
        :color="color"
        :density="density"
        :disabled="disabled"
        :loading="loading"
        :type="type"
        :tag="tag"
        :to="to"
        v-bind="controlAttrs()"
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
        :class="{ 'ui-button--disabled': loading && !disabled }"
        :variant="variant"
        :color="color"
        :density="density"
        :disabled="disabled"
        :aria-disabled="loading && !disabled ? 'true' : undefined"
        :aria-label="trailingAriaLabel"
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
import { computed, nextTick, ref, useSlots, useTemplateRef, watch } from 'vue'

import UiButton from '#kit/components/ui/button/index.vue'
import UiIcon from '#kit/components/ui/icon/index.vue'
import UiMenu from '#kit/components/ui/menu/index.vue'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useButtonNameWarning } from '#kit/utils/button/useButtonNameWarning'
import { ICONS } from '#kit/shared/constants/icons'
import { mSplitButtonProps } from './props'

defineOptions({ inheritAttrs: false })

const props = defineProps(mSplitButtonProps)

const emit = defineEmits<{
  (e: 'click' | 'trailing'): void
}>()

const slots = useSlots()
const { rootAttrs, controlAttrs } = useControlAttrs()
const isMenuOpen = ref(false)
const hasMenu = computed(() => !!slots.menu)
const trailing = useTemplateRef<{ $el: HTMLElement }>('trailing')

useButtonNameWarning('m-button-split', () => props.trailingAriaLabel)

// While the action loads, the trailing button is inert like it (В-6): it keeps
// focus through `aria-disabled` instead of a native `disabled` that would
// throw focus to <body>, and its click is ignored here.
function onTrailing() {
  if (props.disabled || props.loading) return

  if (hasMenu.value) isMenuOpen.value = !isMenuOpen.value
  emit('trailing')
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
$icon-only: '.ui-button--icon-only';

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

  // A focused button rises over its neighbour so its ring shows.
  &__action:focus-visible,
  &__trailing:focus-visible {
    z-index: 1;
  }

  &__action {
    min-width: g($t, 'split.min-width');
  }

  // The step class outranks `.ui-button`'s own corners and padding. The outer
  // corners are the step's half height, not `full`: next to a 4 corner, 999rem
  // would scale the whole set down until the 4 is gone. Corners stay put on
  // hover, press and open. The trailing button is icon-only, whose box it
  // resizes, hence the extra class.
  @each $step in $densities {
    $d: 'split.density.#{$step}';
    $round: g($t, 'density.#{$step}.round');
    $inner: g($t, 'split.inner');

    &--#{$step} {
      .ui-split-button__action {
        border-start-start-radius: $round;
        border-end-start-radius: $round;
        border-start-end-radius: $inner;
        border-end-end-radius: $inner;
        padding-inline-end: g($t, '#{$d}.leading.end');

        &.ui-button--outlined {
          padding-inline-end: g($t, '#{$d}.leading.outlined.end');
        }
      }

      .ui-split-button__trailing#{$icon-only} {
        width: g($t, '#{$d}.trailing.width');
        border-start-start-radius: $inner;
        border-end-start-radius: $inner;
        border-start-end-radius: $round;
        border-end-end-radius: $round;

        .ui-button__icon {
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
