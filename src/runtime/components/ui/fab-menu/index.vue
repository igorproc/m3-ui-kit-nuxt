<template>
  <div
    ref="root"
    class="ui-fab-menu"
    :class="[`ui-fab-menu--${resolvedAlign}`, `ui-fab-menu--${color}`]"
    :style="{ zIndex: isOpen ? stackTicket.zIndex.value : undefined }"
  >
    <!--
      Activator: the default FAB morphs into the close button while open. Supply
      `#activator` for any other trigger; spread `activatorAttrs` on it.
    -->
    <span
      ref="anchor"
      class="ui-fab-menu__anchor"
      :style="popover.anchorStyle.value"
      @transitionend.self="popover.reposition()"
    >
      <slot
        name="activator"
        :is-open="isOpen"
        :toggle="toggle"
        :open="open"
        :close="close"
        :disabled="disabled"
        :activator-attrs="activatorAttrs"
      >
        <MButtonFab
          class="ui-fab-menu__activator"
          :class="{ 'ui-fab-menu__activator--open': isOpen }"
          :density="density"
          :color="color"
          variant="tonal"
          :disabled="disabled"
          :aria-label="ariaLabel"
          :style="morph.container"
          v-bind="activatorAttrs"
          @click="toggle"
        >
          <span
            class="ui-fab-menu__glyph"
            :style="morph.icon"
          >
            <transition name="ui-fab-menu-icon">
              <MIcon
                v-if="isOpen"
                :name="closeIcon"
                class="ui-fab-menu__icon"
              />
              <MIcon
                v-else
                :name="openIcon"
                class="ui-fab-menu__icon"
              />
            </transition>
          </span>
        </MButtonFab>
      </slot>
    </span>

    <!-- The actions live in the top layer, anchored to the FAB, so no ancestor clips them. -->
    <client-only>
      <transition
        name="ui-fab-menu-drawer"
        appear
        @enter="topLayer.show"
        @after-enter="popover.onAfterEnter"
        @after-leave="popover.onAfterLeave"
      >
        <div
          v-if="isOpen"
          ref="drawer"
          :popover.attr="supportsPopover() ? 'manual' : undefined"
          class="ui-fab-menu__drawer"
          :class="`ui-fab-menu__drawer--${edge}`"
          :style="popover.popoverStyle.value"
          v-bind="listAttrs"
        >
          <slot
            :close="close"
            :select="selectItem"
          >
            <FabMenuActions
              :items="items"
              @select="selectItem"
            />
          </slot>
        </div>
      </transition>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, useTemplateRef, watch, watchEffect } from 'vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import FabMenuActions from '#kit/components/fragments/fab-menu/Actions.vue'
import { FAB_SIZE_TO_DENSITY } from '#kit/components/ui/button/fab/props'
import { useRetiredPropWarning, useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'
import { useFabMenu } from '#kit/composables/useFabMenu'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { useStack } from '#kit/composables/useStack'
import { usePopover } from '#kit/composables/popover/usePopover'
import { useTopLayer } from '#kit/composables/overlay/useTopLayer'
import { supportsPopover } from '#kit/shared/utils/support'
import { useFabMenuMorph } from './morph'
import { mFabMenuProps } from './props'
import type { MFabMenuItem } from './props'

// Re-exported for backwards compatibility with existing imports.
export type { MFabMenuItem } from './props'

const props = defineProps(mFabMenuProps)
const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'select', item: MFabMenuItem): void
}>()

const slots = useSlots()
const root = useTemplateRef<HTMLElement>('root')
const anchor = useTemplateRef<HTMLElement>('anchor')
const drawer = useTemplateRef<HTMLElement>('drawer')

const density = computed(() => (props.size ? FAB_SIZE_TO_DENSITY[props.size] : props.density))
const resolvedAlign = computed(() => {
  if (props.align === 'left') return 'start'
  if (props.align === 'right') return 'end'
  return props.align
})

const { open, toggle, close, select, activatorAttrs, listAttrs } = useFabMenu<MFabMenuItem>({
  open: isOpen,
  disabled: () => props.disabled,
  hasContent: () => props.items.length > 0 || !!slots.default,
  activator: () => anchor.value?.querySelector<HTMLElement>('button, a[href], [tabindex]'),
  list: () => drawer.value,
})

const selectItem = (item: MFabMenuItem) => select(item, emit)

// `usePopover` places by physical side, so the logical edge is resolved
// against the direction the menu is laid out in when it opens.
const isRtl = ref(false)
const edge = computed(() => ((resolvedAlign.value === 'end') !== isRtl.value ? 'right' : 'left'))
const popover = usePopover(isOpen, {
  trigger: anchor,
  surface: drawer,
  placement: () => (edge.value === 'right' ? 'top-end' : 'top-start'),
})
const topLayer = useTopLayer(drawer, () => false)
const morph = useFabMenuMorph()

watch(isOpen, (value) => {
  if (value && root.value) isRtl.value = getComputedStyle(root.value).direction === 'rtl'
})

// Lift the cluster above sticky/fixed page chrome while open.
const stackTicket = useStack().register({ onDismiss: () => close() })

watch(isOpen, (value) => {
  if (value) stackTicket.select()
  else stackTicket.unselect()
}, { immediate: true })

useClickOutside(root, () => close())

useRetiredPropWarning('m-fab-menu', 'size', () => props.size, '`density`')
useRetiredValueWarning('m-fab-menu', 'align', () => props.align, { left: '`start`', right: '`end`' })

if (import.meta.dev) {
  watchEffect(() => {
    if (props.items.length <= 6) return

    console.warn('[m-fab-menu] more than 6 actions: M3 keeps a FAB menu to 2–6.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/fab-menu/index' as t;

$roles: ('primary', 'secondary', 'tertiary', 'error');

.ui-fab-menu {
  $t: material-map(t.$tokens, 'md-fab-menu');
  $item-in: g($t, 'motion.item.duration') g($t, 'motion.item.easing');

  position: relative;
  isolation: isolate;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;

  &--start {
    align-items: flex-start;
  }

  &__anchor {
    display: inline-flex;
  }

  // Sized by the FAB's own icon step; shrinks to the close icon while open.
  &__glyph {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 1em;
    height: 1em;
    font-size: inherit;
    transition: transform g($t, 'motion.icon.duration') g($t, 'motion.icon.easing');
  }

  &__icon {
    position: absolute;

    &.ui-fab-menu-icon-enter-active,
    &.ui-fab-menu-icon-leave-active {
      transition:
        opacity g($t, 'motion.icon.duration') g($t, 'motion.icon.easing'),
        transform g($t, 'motion.icon.duration') g($t, 'motion.icon.easing');
    }

    &.ui-fab-menu-icon-enter-from {
      opacity: 0;
      transform: rotate(-90deg);
    }

    &.ui-fab-menu-icon-leave-to {
      opacity: 0;
      transform: rotate(90deg);
    }
  }

  // The open FAB: a 56 circle of the role, whatever the closed step. The
  // doubled class outranks the FAB's own step and surface.
  .ui-fab-menu__activator--open.ui-fab {
    width: g($t, 'open.size');
    height: g($t, 'open.size');
    border-radius: g($t, 'open.shape');

    .ui-fab-menu__glyph {
      font-size: g($t, 'open.icon.size');
    }
  }

  @each $role in $roles {
    &--#{$role} .ui-fab-menu__activator--open.ui-fab {
      background-color: g($t, '#{$role}.open.container.color');
      color: g($t, '#{$role}.open.content.color');

      @include can-hover {
        &:hover:not(.ui-fab--disabled) {
          background-color: g($t, '#{$role}.open.container.hover.color');
        }
      }

      &:focus-visible:not(.ui-fab--disabled) {
        background-color: g($t, '#{$role}.open.container.focus.color');
      }

      &:active:not(.ui-fab--disabled) {
        background-color: g($t, '#{$role}.open.container.pressed.color');
      }
    }
  }

  // Top-layer surface: the UA popover box is reset, and the list keeps room
  // around the actions for their shadow. That room is shifted back past the
  // FAB's edge so the actions line up with it.
  &__drawer {
    inset: auto;
    margin: 0;
    padding: g($t, 'list.room');
    border: none;
    background: transparent;
    color: inherit;
    max-block-size: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;

    &--right {
      translate: g($t, 'list.room') 0;
    }

    &--left {
      translate: calc(-1 * #{g($t, 'list.room')}) 0;
    }

    &.ui-fab-menu-drawer-enter-active,
    &.ui-fab-menu-drawer-leave-active {
      transition: opacity $item-in;
    }

    &.ui-fab-menu-drawer-enter-from,
    &.ui-fab-menu-drawer-leave-to {
      opacity: 0;
    }
  }
}
</style>
