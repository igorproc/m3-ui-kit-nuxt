<template>
  <slot
    name="activator"
    :props="control.triggerAttrs.value"
    :is-open="modelValue"
    :open="menu.open"
    :close="menu.close"
    :toggle="menu.toggle"
  />

  <!-- Finds the trigger: without an `anchor`, the menu's parent element. -->
  <div
    v-if="!$slots.activator"
    ref="anchorRef"
    class="ui-menu-anchor"
    style="display: none;"
  />

  <!--
    Client-only: each menu teleports into the shared #ui-overlay-host (or the
    overlay it sits in — see useOverlayTeleportTarget). Rendering teleports
    during SSR leaves mismatched teleport anchor comments in the host, so
    hydration only wires up the first menu and silently breaks the rest
    ("only one menu opens"). Overlays need no SSR, so skip it entirely. A
    `v-if` leaves a comment in place, where <client-only> renders a <span>
    into the trigger.
  -->
  <teleport
    v-if="isMounted"
    :to="teleportTarget"
  >
    <transition
      name="ui-menu-anim"
      appear
      @enter="onEnter"
      @after-enter="menu.onAfterEnter"
      @after-leave="menu.onAfterLeave"
    >
      <div
        v-if="modelValue"
        ref="$positioned"
        :popover.attr="usesPopoverLayer ? 'manual' : undefined"
        class="ui-menu"
        :dir="menu.surfaceDir.value"
        :style="[menu.menuStyle.value, { zIndex: ticket.zIndex.value }]"
        v-bind="wrapperAttrs"
      >
        <div
          ref="$menu"
          class="ui-menu__surface"
          :class="[`ui-menu__surface--${variant}`, {
            'ui-menu__surface--grouped': groupCount > 0,
            'ui-menu__surface--matched': matchWidth,
            'ui-menu__surface--panel': hostsWidget,
          }]"
          v-bind="surfaceBindings"
        >
          <slot />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useAttrs, useId, watch } from 'vue'
import { useMenu } from '#kit/composables/menu/useMenu'
import { useMenuControl } from '#kit/composables/menu/useMenuControl'
import { useStack } from '#kit/composables/useStack'
import { useScrollLock } from '#kit/composables/overlay/useScrollLock'
import { supportsPopover } from '#kit/shared/utils/support'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useClickOutside } from '#kit/composables/useClickOutside'
import { splitMenuAttrs } from '#kit/utils/menu/attrs'
import { provideMenuContext } from './context'
import { mMenuProps } from './props'
import type { MMenuActivatorScope } from './types'

// Multiple root nodes (activator + anchor + teleport): fallthrough attrs are
// split by hand between the positioned wrapper and the `role="menu"` surface.
defineOptions({ inheritAttrs: false })

const props = defineProps(mMenuProps)

const emit = defineEmits<{
  (e: 'click-outside'): void
}>()

const slots = defineSlots<{
  /** The element that opens the menu; bind `props` on it. */
  activator?: (scope: MMenuActivatorScope) => unknown
  default?: () => unknown
}>()

const $menu = shallowRef<null | HTMLElement>(null)
const $positioned = shallowRef<null | HTMLElement>(null)
const modelValue = defineModel<boolean>({ default: false })
const anchorRef = shallowRef<HTMLElement | null>(null)
const activatorEl = shallowRef<HTMLElement | null>(null)

const attrs = useAttrs()
const split = computed(() => splitMenuAttrs(attrs))
const wrapperAttrs = computed(() => split.value.wrapper)
const surfaceAttrs = computed(() => split.value.surface)

// Slotted into a button's label, the parent is a <span>; the button around it
// is the trigger. Elsewhere the parent element is.
const parentTrigger = () => {
  const parent = anchorRef.value?.parentElement ?? null
  return parent?.closest<HTMLElement>('button, a[href], [role="button"]') ?? parent
}
const trigger = () => activatorEl.value ?? parentTrigger()
/** The explicit anchor wins; otherwise the trigger is. */
const anchorEl = computed<HTMLElement | null>(() => props.anchor ?? activatorEl.value ?? parentTrigger())

// Top layer: above a modal <dialog> (which makes everything else inert) and
// free of any ancestor's overflow. Without the Popover API the stack z-index
// keeps the order instead.
const usesPopoverLayer = supportsPopover()
const teleportTarget = useOverlayTeleportTarget()

const triggerId = useId()
const menuIdFallback = useId()
const isMounted = shallowRef(false)
onMounted(() => {
  isMounted.value = true
  if (slots.activator) activatorEl.value = document.getElementById(triggerId)
})

// The composable owns placement: native anchoring, or — when unsupported —
// measuring these two elements and re-measuring on scroll/resize.
const menu = useMenu(modelValue, {
  placement: () => props.placement,
  matchWidth: () => props.matchWidth,
  trigger: () => anchorEl.value,
  surface: () => $positioned.value,
})

const labelledBy = shallowRef<string | undefined>(undefined)

const control = useMenuControl({
  open: modelValue,
  triggerId,
  menuId: () => (attrs.id as string | undefined) ?? menuIdFallback,
  surface: () => $menu.value,
  fallbackReturn: trigger,
  rendered: () => isMounted.value && modelValue.value,
  labelledBy: () => labelledBy.value,
})

const surfaceBindings = computed(() => ({ ...control.menuAttrs.value, ...surfaceAttrs.value }))

const groupCount = shallowRef(0)
provideMenuContext({
  getItemAttrs: control.getItemAttrs,
  registerGroup: () => {
    groupCount.value++
    return () => {
      groupCount.value--
    }
  },
})

const hostsWidget = shallowRef(false)

// APG: the menu is named by the button that opens it, unless the consumer
// names it. The trigger gets an id when it has none.
function resolveName() {
  const el = trigger()
  if (split.value.named || !el || hostsWidget.value) {
    labelledBy.value = undefined
    return
  }
  if (!el.id) el.id = triggerId
  labelledBy.value = el.id
  if (import.meta.dev && !el.textContent?.trim() && !el.getAttribute('aria-label'))
    console.warn('[m-menu] has no accessible name: give its trigger a label, or pass `aria-label` / `aria-labelledby`.')
}

watch(() => isMounted.value && modelValue.value, async (shown) => {
  if (!shown) return
  await nextTick()
  hostsWidget.value = control.hostsForeignWidget()
  resolveName()
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

function onEnter(el: Element) {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
  menu.reposition()
  if (props.lockScroll) scrollLock.lock()
}

watch(modelValue, (val) => {
  if (val) {
    ticket.select()
  } else {
    ticket.unselect()
    scrollLock.unlock()
  }
}, { immediate: true })

// Pass the ref (not its value): the surface is rendered behind a v-if, so it
// is null at setup. The composable resolves the element at click time, and
// ignoring the trigger lets a re-click toggle instead of double-firing
// (outside-close then the trigger's own open).
const outside = useClickOutside($menu, requestClose, {
  ignore: [trigger],
})

// A closed menu listens to nothing: a page of closed menus would otherwise
// run every one of their handlers on each press.
watch(modelValue, open => (open ? outside.resume() : outside.pause()), { immediate: true })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/menu/index' as t;
@use '#kit/assets/stylesheet/components/menu/colors' as colors;

.ui-menu {
  $t: material-map(t.$tokens, 'md-menu');

  // Neutralise the UA [popover] box; the surface below draws the menu.
  position: fixed;
  inset: auto;
  pointer-events: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;

  // Hug the content by default; `match-width` overrides via inline width
  // (rect width in the JS fallback, anchor-size() under CSS anchoring).
  width: max-content;
  height: auto;

  &__surface,
  &__group {
    padding: g($t, 'group.padding.block') g($t, 'group.padding.inline');
    box-shadow: g($t, 'surface.shadow');

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &__surface {
    position: relative;
    width: 100%;
    min-width: g($t, 'surface.min.width');
    max-width: g($t, 'surface.max.width');
    border-radius: g($t, 'group.shape.outer');

    // Animation properties
    transform-origin: var(--ui-menu-origin);
    will-change: transform, opacity;
  }

  &__group {
    border-radius: g($t, 'group.shape.inner');

    &:first-child {
      border-start-start-radius: g($t, 'group.shape.outer');
      border-start-end-radius: g($t, 'group.shape.outer');
    }

    &:last-child {
      border-end-start-radius: g($t, 'group.shape.outer');
      border-end-end-radius: g($t, 'group.shape.outer');
    }
  }

  @include colors.variants($t);

  &__surface--grouped {
    display: flex;
    flex-direction: column;
    gap: g($t, 'group.gap');
    padding: 0;
    border-radius: 0;
    background-color: transparent;
    box-shadow: none;

    @include forced-colors {
      border: 0;
    }
  }

  &__surface--matched {
    max-width: none;
  }

  &__surface--panel {
    max-width: none;
    padding: 0;
  }

  // Reduced motion shortens the system durations; the fade stays, the scale goes.
  &-anim-enter-active {
    transition: opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');

    .ui-menu__surface {
      transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
    }
  }

  &-anim-leave-active {
    transition: opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');

    .ui-menu__surface {
      transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
    }
  }

  &-anim-enter-from,
  &-anim-leave-to {
    opacity: 0;

    .ui-menu__surface {
      transform: scale(g($t, 'motion.scale.from'));

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }
}
</style>
