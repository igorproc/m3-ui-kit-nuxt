<template>
  <div
    ref="rootRef"
    class="ui-fab-menu"
    :class="[`ui-fab-menu--${size}`, `ui-fab-menu--${align}`, `ui-fab-menu--${color}`]"
    :style="{ zIndex: isOpen ? stackTicket.zIndex.value : undefined }"
  >
    <!--
      Activator. Defaults to a circular FAB whose icon morphs plus -> close.
      Override via #activator to supply any trigger (e.g. an extended FAB);
      the slot receives the open/close API so the consumer wires it up.
    -->
    <slot
      name="activator"
      :is-open="isOpen"
      :toggle="toggle"
      :open="open"
      :close="close"
      :disabled="disabled"
    >
      <m-button-fab
        class="ui-fab-menu__activator"
        :size="size"
        :color="color"
        :variant="variant"
        :disabled="disabled"
        @click="toggle"
      >
        <div
          class="ui-fab-menu__icon-wrapper"
          :class="{ 'is-open': isOpen }"
        >
          <transition name="ui-fab-menu-icon">
            <m-icon
              v-if="isOpen"
              :name="closeIcon"
              class="ui-fab-menu__icon ui-fab-menu__icon--close"
            />
            <m-icon
              v-else
              :name="openIcon"
              class="ui-fab-menu__icon ui-fab-menu__icon--open"
            />
          </transition>
        </div>
      </m-button-fab>
    </slot>

    <!--
      Drawer. Default renders `items` as click-to-act pills with a staggered
      reveal. Supply the default slot to own the content entirely (dropdown-like,
      but acting on click rather than emitting a selection).
    -->
    <transition name="ui-fab-menu-drawer">
      <div
        v-if="isOpen"
        class="ui-fab-menu__drawer"
      >
        <slot
          :close="close"
          :select="selectItem"
        >
          <transition-group
            name="ui-fab-menu-item"
            tag="div"
            class="ui-fab-menu__list"
            appear
          >
            <button
              v-for="(item, index) in items"
              :key="item.value ?? index"
              class="ui-fab-menu__item"
              :style="{ '--ui-fab-stagger': items.length - 1 - index }"
              @click="selectItem(item)"
            >
              <span
                v-if="item.label"
                class="ui-fab-menu__label"
              >{{ item.label }}</span>
              <m-icon
                v-if="item.icon"
                :name="item.icon"
                class="ui-fab-menu__item-icon"
              />
            </button>
          </transition-group>
        </slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFabMenu } from '#kit/composables/useFabMenu'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { useStack } from '#kit/composables/useStack'
import { mFabMenuProps } from './props'
import type { MFabMenuItem } from './props'

// Re-exported for backwards compatibility with existing imports.
export type { MFabMenuItem } from './props'

const props = defineProps(mFabMenuProps)

const emit = defineEmits<{
  (e: 'select', item: MFabMenuItem): void
}>()

const rootRef = ref<HTMLElement | null>(null)

const { isOpen, open, toggle, close, select } = useFabMenu<MFabMenuItem>({
  disabled: () => props.disabled,
})

const selectItem = (item: MFabMenuItem) => select(item, emit)

// Lift the whole cluster above sticky/fixed page chrome while open (no teleport
// needed for the canonical free-floating FAB — a high z-index clears headers).
const stackTicket = useStack().register({ onDismiss: () => close() })

watch(
  isOpen,
  (value) => {
    if (value) stackTicket.select()
    else stackTicket.unselect()
  },
  { immediate: true },
)

useClickOutside(rootRef, () => close())
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/fab-menu/index' as t;

.ui-fab-menu {
  $prefix: 'md-fab-menu';
  $t: material-map(t.$tokens, $prefix);

  position: relative;
  display: inline-flex;
  flex-direction: column;

  // Default edge = right; the `--left` modifier flips the FAB + items.
  align-items: flex-end;

  &--left {
    align-items: flex-start;
  }

  &__activator {
    position: relative;
    z-index: 2;
  }

  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: g($t, 'icon-size');
    height: g($t, 'icon-size');
    transition: transform g($t, 'motion-icon-duration') g($t, 'motion-icon-easing');

    &.is-open {
      transform: rotate(90deg);
    }
  }

  &__icon {
    position: absolute;
    font-size: g($t, 'icon-size');

    &.ui-fab-menu-icon-enter-active,
    &.ui-fab-menu-icon-leave-active {
      transition: opacity g($t, 'motion-icon-duration') g($t, 'motion-icon-easing'),
                  transform g($t, 'motion-icon-duration') g($t, 'motion-icon-easing');
    }

    &.ui-fab-menu-icon-enter-from {
      opacity: 0;
      transform: scale(0.5) rotate(-45deg);
    }

    &.ui-fab-menu-icon-leave-to {
      opacity: 0;
      transform: scale(0.5) rotate(45deg);
    }
  }

  &__drawer {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: g($t, 'drawer-margin-bottom');
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 1;

    // Pin to the chosen edge so item edges stay flush with the FAB.
    .ui-fab-menu--left & {
      right: auto;
      left: 0;
      align-items: flex-start;
    }

    &.ui-fab-menu-drawer-enter-active,
    &.ui-fab-menu-drawer-leave-active {
      transition: opacity g($t, 'motion-drawer-duration') g($t, 'motion-drawer-easing');
    }

    &.ui-fab-menu-drawer-enter-from,
    &.ui-fab-menu-drawer-leave-to {
      opacity: 0;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: g($t, 'list-gap');
    align-items: flex-end;

    .ui-fab-menu--left & {
      align-items: flex-start;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: g($t, 'item-gap');
    border: none;
    border-radius: g($t, 'item-border-radius');
    padding: g($t, 'item-padding');
    cursor: pointer;
    box-shadow: g($t, 'item-shadow');
    white-space: nowrap;
    position: relative;

    // Resting clip is a generous negative inset so the drop shadow is never
    // cut; the reveal animates the LEFT edge in from 100% (unfolds from right).
    clip-path: inset(-40rem -40rem -40rem -40rem);

    @include typescale(g($t, 'item-type'));

    &-icon {
      font-size: g($t, 'item-icon-size');
    }

    // Staggered reveal — bottom-most item (nearest the FAB) leads via the
    // inline `--ui-fab-stagger` index; step + easing come from $tokens.
    &.ui-fab-menu-item-enter-active {
      transition: opacity g($t, 'motion-item-duration') g($t, 'motion-item-easing'),
                  clip-path g($t, 'motion-item-duration') g($t, 'motion-item-easing'),
                  transform g($t, 'motion-item-duration') g($t, 'motion-item-easing');
      transition-delay: calc(#{g($t, 'motion-item-stagger')} * var(--ui-fab-stagger, 0));
    }

    &.ui-fab-menu-item-leave-active {
      transition: opacity g($t, 'motion-item-leave-duration') g($t, 'motion-item-leave-easing'),
                  clip-path g($t, 'motion-item-leave-duration') g($t, 'motion-item-leave-easing'),
                  transform g($t, 'motion-item-leave-duration') g($t, 'motion-item-leave-easing');
      transition-delay: calc(#{g($t, 'motion-item-stagger')} * var(--ui-fab-stagger, 0));
    }

    &.ui-fab-menu-item-enter-from,
    &.ui-fab-menu-item-leave-to {
      opacity: 0;
      clip-path: inset(-40rem -40rem -40rem 100%);
      transform: translateX(g($t, 'motion-item-shift'));

      // Mirror the unfold so it grows from whichever edge items align to.
      .ui-fab-menu--left & {
        clip-path: inset(-40rem 100% -40rem -40rem);
        transform: translateX(calc(-1 * #{g($t, 'motion-item-shift')}));
      }
    }

  }

  // Drawer-item pill scheme per MD3 color role.
  @mixin apply-item-scheme($scheme) {
    .ui-fab-menu__item {
      background-color: g($t, 'item-scheme-#{$scheme}-bg-color');
      color: g($t, 'item-scheme-#{$scheme}-text-color');

      &:hover {
        background-color: g($t, 'item-scheme-#{$scheme}-hover-color');
      }

      &:active {
        background-color: g($t, 'item-scheme-#{$scheme}-pressed-color');
      }
    }
  }

  &--primary { @include apply-item-scheme('primary'); }
  &--secondary { @include apply-item-scheme('secondary'); }
  &--tertiary { @include apply-item-scheme('tertiary'); }
  &--error { @include apply-item-scheme('error'); }
}
</style>
