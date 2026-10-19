<template>
  <div
    ref="root"
    class="ui-fab-menu"
    :class="[`ui-fab-menu--${align}`, `ui-fab-menu--${color}`]"
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
          @transitionrun.self="onMorphStart"
          @transitionend.self="onMorphEnd"
          @transitioncancel.self="onMorphEnd"
        >
          <span
            class="ui-fab-menu__glyph"
            :style="morph.icon"
          >
            <MIcon
              :name="openIcon"
              class="ui-fab-menu__icon ui-fab-menu__icon--open"
            />
            <MIcon
              :name="closeIcon"
              class="ui-fab-menu__icon ui-fab-menu__icon--close"
            />
          </span>
        </MButtonFab>
      </slot>
    </span>

    <!-- The actions live in the top layer, anchored to the FAB, so no ancestor clips them. -->
    <client-only>
      <div
        v-if="popover.isOpen.value"
        ref="drawer"
        :popover.attr="supportsPopover() ? 'manual' : undefined"
        class="ui-fab-menu__drawer"
        :class="[`ui-fab-menu__drawer--${edge}`, { 'ui-fab-menu__drawer--open': expanded }]"
        :style="popover.popoverStyle.value"
        :inert="!expanded"
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
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, shallowRef, useSlots, useTemplateRef, watch, watchEffect } from 'vue'
import MButtonFab from '#kit/components/ui/button/fab/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import FabMenuActions from '#kit/components/fragments/fab-menu/Actions.vue'
import { useFabMenu } from '#kit/composables/useFabMenu'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { useStack } from '#kit/composables/useStack'
import { useRaf } from '#kit/composables/useRaf'
import { usePopover } from '#kit/composables/popover/usePopover'
import { useTopLayer } from '#kit/composables/overlay/useTopLayer'
import { supportsPopover } from '#kit/shared/utils/support'
import { useFabMenuMorph } from './morph'
import { mFabMenuProps } from './props'
import type { MFabMenuItem } from './props'

const props = defineProps(mFabMenuProps)
const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'select', item: MFabMenuItem): void
}>()

const slots = useSlots()
const root = useTemplateRef<HTMLElement>('root')
const anchor = useTemplateRef<HTMLElement>('anchor')
const drawer = useTemplateRef<HTMLElement>('drawer')

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
const edge = ref<'left' | 'right'>(props.align === 'end' ? 'right' : 'left')
const popover = usePopover(isOpen, {
  trigger: anchor,
  surface: drawer,
  placement: () => (edge.value === 'right' ? 'top-end' : 'top-start'),
})
const topLayer = useTopLayer(drawer, () => false)
const morph = useFabMenuMorph()

// `popover.isOpen` keeps the drawer mounted while the actions leave;
// `expanded` is the state they move to, so a reversal mid-way continues from
// where they are instead of rebuilding the list. Opened from the server, the
// drawer appears in place, without an entrance.
const expanded = ref(isOpen.value)

function showDrawer() {
  if (root.value) isRtl.value = getComputedStyle(root.value).direction === 'rtl'
  edge.value = (props.align === 'end') !== isRtl.value ? 'right' : 'left'
  topLayer.show()
  // Measuring also commits the actions' closed style, so they move from it.
  popover.reposition()
}

/** Resolves when the drawer's finite animations end (none in a test DOM). */
async function settled() {
  const el = drawer.value
  if (!el || typeof el.getAnimations !== 'function') return
  const running = el.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity)
  await Promise.allSettled(running.map(animation => animation.finished))
}

watch(isOpen, async (value) => {
  if (value) {
    await nextTick()
    showDrawer()
    expanded.value = true
    await nextTick()
    await settled()
    popover.onAfterEnter()
    return
  }

  expanded.value = false
  await nextTick()
  await settled()
  popover.onAfterLeave()
})

onMounted(async () => {
  if (!isOpen.value) return
  await nextTick()
  showDrawer()
})

// The JS position path (no CSS anchor positioning) measures the FAB once; while
// it morphs to the 56 circle, the column follows it frame by frame.
const following = shallowRef(false)
const follow = useRaf(() => {
  popover.reposition()
  if (following.value) follow()
})

function onMorphStart(event: TransitionEvent) {
  if (event.propertyName !== 'width' || popover.isAnchorSupported.value || !popover.isOpen.value) return
  following.value = true
  follow()
}

function onMorphEnd(event: TransitionEvent) {
  if (event.propertyName !== 'width') return
  following.value = false
  if (!popover.isAnchorSupported.value && popover.isOpen.value) popover.reposition()
}

// Lift the cluster above sticky/fixed page chrome while open.
const stackTicket = useStack().register({ onDismiss: () => close() })

watch(isOpen, (value) => {
  if (value) stackTicket.select()
  else stackTicket.unselect()
}, { immediate: true })

useClickOutside(root, () => close())

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
  $icon: g($t, 'motion.icon.duration') g($t, 'motion.icon.easing');

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
  }

  // Both glyphs stay mounted and cross over by state, so a reversal mid-way
  // continues from where they are.
  &__icon {
    position: absolute;
    transition: opacity $icon, rotate $icon;

    &--close {
      opacity: 0;
      rotate: -90deg;
    }
  }

  // The open FAB: a 56 circle of the role, whatever the closed step. The
  // doubled class outranks the FAB's own step and set; its states are the
  // FAB's layer.
  .ui-fab-menu__activator--open.ui-fab {
    width: g($t, 'open.size');
    height: g($t, 'open.size');
    border-radius: g($t, 'open.shape');

    .ui-fab-menu__glyph {
      font-size: g($t, 'open.icon.size');
    }

    .ui-fab-menu__icon--open {
      opacity: 0;
      rotate: 90deg;
    }

    .ui-fab-menu__icon--close {
      opacity: 1;
      rotate: none;
    }
  }

  @each $role in $roles {
    &--#{$role} .ui-fab-menu__activator--open.ui-fab {
      background-color: g($t, '#{$role}.open.container');
      color: g($t, '#{$role}.open.content');
    }
  }

  // Top-layer surface: the UA popover box is reset, and the list keeps room
  // around the actions for their shadow. That room is shifted back past the
  // FAB's edge so the actions line up with it.
  // Sized by its actions, not by the room left where it happens to sit: the JS
  // path measures it before placing it, and a box squeezed against the
  // viewport edge would measure narrow and land past the FAB's edge.
  &__drawer {
    inline-size: max-content;
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

    // Content of the consumer's own (no default actions) fades as one block.
    &:not(:has(.ui-fab-menu__list)) {
      opacity: 0;
      transition: opacity g($t, 'motion.item.leave.duration') g($t, 'motion.item.leave.easing');
    }

    &--open:not(:has(.ui-fab-menu__list)) {
      opacity: 1;
      transition: opacity g($t, 'motion.item.duration') g($t, 'motion.item.easing');
    }
  }
}
</style>
