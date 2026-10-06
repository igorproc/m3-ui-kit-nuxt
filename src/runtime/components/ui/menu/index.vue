<template>
  <!-- Dummy element to find original position and parent trigger -->
  <div
    ref="anchorRef"
    class="ui-menu-anchor"
    style="display: none;"
  />

  <!--
    Client-only: each menu teleports into the shared #ui-overlay-host (or the
    overlay it sits in — see useOverlayTeleportTarget). Rendering teleports
    during SSR leaves mismatched teleport anchor comments in the host, so
    hydration only wires up the first menu and silently breaks the rest
    ("only one menu opens"). Overlays need no SSR, so skip it entirely.
  -->
  <client-only>
    <teleport :to="teleportTarget">
      <transition
        name="ui-menu-anim"
        @enter="showInTopLayer"
        @after-enter="menu.onAfterEnter"
        @after-leave="menu.onAfterLeave"
      >
        <div
          v-if="modelValue"
          ref="$positioned"
          :popover.attr="usesPopoverLayer ? 'manual' : undefined"
          class="ui-menu"
          :class="{ 'ui-menu--absolute': absolute }"
          :style="[menu.menuStyle.value, { zIndex: ticket.zIndex.value }]"
          v-bind="$attrs"
        >
          <div
            v-if="!absolute"
            class="ui-menu__backdrop"
            aria-hidden="true"
            @click="requestClose"
          />

          <div
            ref="$menu"
            class="ui-menu__surface"
            role="menu"
            tabindex="-1"
            @keydown="onSurfaceKeydown"
          >
            <slot />
          </div>
        </div>
      </transition>
    </teleport>
  </client-only>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue'
import { useMenu } from '#kit/composables/menu/useMenu'
import { useStack } from '#kit/composables/useStack'
import { useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { supportsPopover } from '#kit/shared/utils/support'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useFocusTrap } from '#kit/composables/overlay/useFocusTrap'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { mMenuProps } from './props'

// Multiple root nodes (anchor + teleport): forward fallthrough attrs (class,
// etc.) explicitly onto the surface wrapper instead of letting Vue warn.
defineOptions({ inheritAttrs: false })

const props = defineProps(mMenuProps)

const emit = defineEmits<{
  (e: 'click-outside'): void
}>()

const $menu = shallowRef<null | HTMLElement>(null)
const $positioned = shallowRef<null | HTMLElement>(null)
const modelValue = defineModel<boolean>({ default: false })
const anchorRef = ref<HTMLElement | null>(null)

/** The explicit anchor wins; otherwise the parent element is the trigger. */
const anchorEl = computed<HTMLElement | null>(() => props.anchor ?? anchorRef.value?.parentElement ?? null)

// Top layer: above a modal <dialog> (which makes everything else inert) and
// free of any ancestor's overflow. Without the Popover API the stack z-index
// keeps the order instead.
const usesPopoverLayer = supportsPopover()
const teleportTarget = useOverlayTeleportTarget()

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
}

// The composable owns placement: native anchoring, or — when unsupported —
// measuring these two elements and re-measuring on scroll/resize.
const menu = useMenu(modelValue, {
  absolute: () => props.absolute,
  origin: () => props.origin,
  matchWidth: () => props.matchWidth,
  trigger: () => anchorEl.value,
  surface: () => $positioned.value,
})

// --- Menu keyboard navigation (APG menu pattern) --------------------------
// Items are slotted by the consumer (typically `<button class="ui-menu__item">`).
// On open the focus trap moves focus onto the menu surface and keeps Tab
// inside it; the menu then decides inner focus itself: it promotes the items
// to `role="menuitem"`, makes them roving-tabbable and focuses the first one.
// Arrow/Home/End move focus, Esc closes.
// When the menu hosts another composite widget (e.g. the dropdown's
// `role="listbox"`), that consumer owns keyboard/focus — the menu must not
// promote items or steal focus.
const hostsForeignWidget = (): boolean =>
  !!$menu.value?.querySelector('[role="listbox"], [role="option"]')

const getMenuItems = (): HTMLElement[] => {
  const surface = $menu.value
  if (!surface || hostsForeignWidget()) return []

  const nodes = surface.querySelectorAll<HTMLElement>('[role="menuitem"], button')
  return Array.from(nodes).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true')
}

const prepareMenuItems = (): HTMLElement[] => {
  const items = getMenuItems()
  items.forEach((el, index) => {
    if (!el.hasAttribute('role')) el.setAttribute('role', 'menuitem')
    el.tabIndex = index === 0 ? 0 : -1
  })
  return items
}

const focusItemAt = (items: HTMLElement[], index: number) => {
  items.forEach((el, i) => {
    el.tabIndex = i === index ? 0 : -1
  })
  items[index]?.focus()
}

const getTriggerEl = (): HTMLElement | null => anchorRef.value?.parentElement ?? null

const closeAndRestoreFocus = () => {
  const trigger = getTriggerEl()
  menu.close()
  nextTick(() => trigger?.focus())
}

const focusNextItem = (items: HTMLElement[]) => {
  const current = items.findIndex(el => el === document.activeElement)
  focusItemAt(items, current < 0 ? 0 : (current + 1) % items.length)
}

const focusPreviousItem = (items: HTMLElement[]) => {
  const current = items.findIndex(el => el === document.activeElement)
  focusItemAt(items, current <= 0 ? items.length - 1 : current - 1)
}

const focusTrap = useFocusTrap($menu, { initialFocus: () => $menu.value ?? false })

const onSurfaceKeydown = (event: KeyboardEvent) => {
  const items = getMenuItems()

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (items.length) focusNextItem(items)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (items.length) focusPreviousItem(items)
      break
    case 'Home':
      event.preventDefault()
      if (items.length) focusItemAt(items, 0)
      break
    case 'End':
      event.preventDefault()
      if (items.length) focusItemAt(items, items.length - 1)
      break
    case 'Escape':
      event.preventDefault()
      closeAndRestoreFocus()
      break
  }
}

watch(modelValue, async (val) => {
  if (!val) {
    focusTrap.deactivate()
    return
  }

  await nextTick()
  // A hosted composite (dropdown listbox) keeps focus in its own field.
  if (hostsForeignWidget()) return
  focusTrap.activate()
  prepareMenuItems()[0]?.focus()
})

// Inject the anchor-name onto the trigger when CSS anchor positioning is
// supported. The previous element gives the name back, so a changed anchor
// cannot leave two elements claiming it.
watch(anchorEl, (el, previous) => {
  if (!menu.isAnchorSupported.value) return
  previous?.style.removeProperty('anchor-name')
  el?.style.setProperty('anchor-name', menu.anchorName)
}, { immediate: true })

// Menu is autonomous: it owns outside-click detection and notifies consumers
// (e.g. Dropdown, SplitButton) via `click-outside` so they can sync their own
// state without binding a duplicate listener.
const requestClose = () => {
  emit('click-outside')

  if (props.closeOnBackdrop) {
    menu.close()
  }
}

// Overlay stacking: derive z-index from activation order instead of a magic
// number, and dismiss via the shared stack so the topmost overlay closes first.
const ticket = useStack().register({ onDismiss: requestClose })

// Shared, reference-counted lock (same holder type as MOverlay): a menu opened
// inside a modal does not release the page when it closes.
const scrollLock = useScrollLock()

watch(modelValue, (val) => {
  if (val) {
    ticket.select()
    if (props.lockScroll) scrollLock.lock()
  } else {
    ticket.unselect()
    scrollLock.unlock()
  }
}, { immediate: true })

// Pass the ref (not its value): the surface is rendered behind a v-if, so it
// is null at setup. The composable resolves the element at click time, and
// ignoring the trigger lets a re-click toggle instead of double-firing
// (outside-close then the trigger's own open).
useClickOutside($menu, requestClose, {
  ignore: [() => anchorRef.value?.parentElement],
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/menu/index' as t;

.ui-menu {
  $t: material-map(t.$tokens, 'md-menu');

  position: fixed;
  inset: 0;

  // Neutralise the UA [popover] box; the surface below draws the menu.
  pointer-events: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;
  width: auto;
  height: auto;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: transparent;
    cursor: default;
  }

  &__surface {
    position: absolute;
    top: g($t, 'surface-top');
    right: g($t, 'surface-right');
    min-width: g($t, 'surface-min-width');
    max-width: g($t, 'surface-max-width');
    border-radius: g($t, 'surface-border-radius');
    background-color: g($t, 'surface-bg-color');
    color: g($t, 'surface-color');
    box-shadow: g($t, 'surface-shadow');

    // Animation properties
    transform-origin: var(--ui-menu-origin);
    will-change: transform, opacity;

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &__item {
    width: 100%;
    min-height: g($t, 'item-min-height');
    padding: g($t, 'item-padding');
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: g($t, 'item-gap');
    border: none;
    background: transparent;
    cursor: pointer;

    @include typescale(g($t, 'item-text-type'));

    color: g($t, 'item-text-color');
    text-align: left;
    transition: background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

    @include can-hover {
      &:hover {
        background-color: g($t, 'item-hover-bg');
      }
    }

    &:active {
      background-color: g($t, 'item-active-bg');
    }
  }

  &__item-label {
    flex: 1;
  }

  &__item-shortcut {
    color: g($t, 'item-shortcut-color');

    @include typescale(g($t, 'item-shortcut-type'));
  }

  &--absolute {
    position: fixed;
    inset: auto;

    // Hug the content by default; `match-width` overrides via inline width
    // (rect width in the JS fallback, anchor-size() under CSS anchoring).
    width: max-content;
    height: auto;

    .ui-menu__surface {
      position: relative;
      top: 0;
      right: 0;
      width: 100%;
      max-width: none;
      margin: 0;
    }
  }

  &-anim-enter-active,
  &-anim-leave-active {
    transition: opacity 200ms cubic-bezier(0.2, 0, 0, 1);

    .ui-menu__surface {
      transition: transform 250ms cubic-bezier(0.2, 0, 0, 1);
    }
  }

  &-anim-enter-from,
  &-anim-leave-to {
    opacity: 0;

    .ui-menu__surface {
      transform: scale(0.8);
    }
  }
}

// Items fill a surface that clips: the ring goes inside.
.ui-menu__item:focus-visible {
  @include focus-ring(inset);
}
</style>
