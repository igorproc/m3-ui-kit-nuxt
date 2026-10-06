<template>
  <!--
    Client-only, like every overlay: teleports into the shared #ui-overlay-host
    (or the overlay it sits in). SSR teleport anchors in the host would break
    hydration of the other overlays rendered there.
  -->
  <client-only>
    <teleport :to="teleportTarget">
      <transition
        name="ui-snackbar-fade"
        @enter="showInTopLayer"
      >
        <div
          v-if="modelValue"
          ref="root"
          :popover.attr="usesPopoverLayer ? 'manual' : undefined"
          class="ui-snackbar"
          role="status"
          aria-live="polite"
          :style="{ zIndex: ticket.zIndex.value }"
        >
          <div class="ui-snackbar__surface">
            <p class="ui-snackbar__label">
              <slot>
                {{ label }}
              </slot>
            </p>

            <button
              v-if="actionLabel"
              type="button"
              class="ui-snackbar__action"
              @click="onAction"
            >
              {{ actionLabel }}
            </button>
          </div>
        </div>
      </transition>
    </teleport>
  </client-only>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useStack } from '#kit/composables/useStack'
import { supportsPopover } from '#kit/shared/utils/support'
import { useOverlayTeleportTarget } from '#kit/composables/overlay/useOverlayTarget'
import { useFocusTrap } from '#kit/composables/overlay/useFocusTrap'
import { mSnackbarProps } from './props'

const props = defineProps(mSnackbarProps)

const emit = defineEmits<{
  (e: 'action'): void
}>()

const modelValue = defineModel<boolean>({ default: false })

// Inside an overlay the snackbar renders into it (outside an open modal it would
// be inert); elsewhere into #ui-overlay-host with the other overlays.
const teleportTarget = useOverlayTeleportTarget()

// Overlay stacking: derive z-index from activation order instead of a magic number.
const stack = useStack()
const ticket = stack.register()

// Top layer keeps the snackbar visible above a modal <dialog>.
const root = shallowRef<HTMLElement | null>(null)
const usesPopoverLayer = supportsPopover()

const showInTopLayer = (el: Element) => {
  if (usesPopoverLayer) (el as HTMLElement).showPopover()
}

// The top layer stacks by opening order: a modal opened after the snackbar
// would cover it, so re-enter the top layer above the new modal.
watch(() => stack.topModal.value, () => {
  const el = root.value
  if (!el || !usesPopoverLayer || !el.matches(':popover-open')) return
  el.hidePopover()
  el.showPopover()
}, { flush: 'post' })

// The trap only moves focus onto the snackbar itself; Tab then cycles its actions.
const focusTrap = useFocusTrap(root, { initialFocus: () => root.value ?? false })

watch(modelValue, (val) => {
  if (val) {
    ticket.select()
  } else {
    ticket.unselect()
    focusTrap.deactivate()
  }
}, { immediate: true })

// Activate once the snackbar is actually in the DOM (it renders client-only).
watch(root, (el) => {
  if (el && props.trapFocus && modelValue.value) focusTrap.activate()
}, { flush: 'post' })

function onAction() {
  emit('action')
  modelValue.value = false
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/snackbar/index' as t;

.ui-snackbar {
  $t: material-map(t.$tokens, 'md-snackbar');

  position: fixed;
  inset-block-start: auto;
  inset-inline: 0;
  bottom: g($t, 'bottom-offset');

  // Neutralise the UA [popover] box.
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  overflow: visible;
  display: flex;
  justify-content: center;
  pointer-events: none;

  &__surface {
    pointer-events: auto;
    max-width: g($t, 'surface-max-width');
    margin-inline: g($t, 'surface-margin-inline');
    padding: g($t, 'surface-padding');
    border-radius: g($t, 'surface-border-radius');
    background-color: g($t, 'surface-bg-color');
    color: g($t, 'surface-color');
    box-shadow: g($t, 'surface-shadow');
    display: flex;
    align-items: center;
    gap: g($t, 'surface-gap');
  }

  &__label {
    margin: 0;

    @include typescale(g($t, 'label-text-type'));
  }

  &__action {
    border: none;
    background: transparent;
    padding: g($t, 'action-padding');
    border-radius: g($t, 'action-border-radius');
    cursor: pointer;

    @include typescale(g($t, 'action-text-type'));

    color: g($t, 'action-color');

    @include can-hover {
      &:hover {
        background-color: g($t, 'action-hover-bg');
      }
    }
  }
}

.ui-snackbar-fade-enter-active,
.ui-snackbar-fade-leave-active {
  transition:
    opacity var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard),
    transform var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);
}

.ui-snackbar-fade-enter-from,
.ui-snackbar-fade-leave-to {
  opacity: 0;
  transform: translateY(12rem);
}
</style>
