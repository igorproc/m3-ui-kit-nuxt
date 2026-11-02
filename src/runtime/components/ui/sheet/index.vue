<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-sheet-pop'"
    :aria-label="ariaLabel"
    :swipe-target="handle"
    @dismiss="result.onDismiss"
  >
    <div class="ui-sheet">
      <div class="ui-sheet__container">
        <div
          v-if="canSwipe"
          ref="handle"
          class="ui-sheet__drag-handle"
          aria-hidden="true"
        />

        <div class="ui-sheet__content">
          <slot v-bind="scope" />
        </div>
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, watch } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { useModalResult } from '#kit/composables/modal/useModalResult'
import type { MModalResultEmits } from '#kit/composables/modal/useModalResult'
import { mSheetProps } from './props'

const props = defineProps(mSheetProps)

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<MModalResultEmits>()

// Stacking, scrim, scroll lock, focus and swipe-to-dismiss come from <MOverlay>;
// lifecycle events (`opened`, `closed`, …) fall through to it.
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')
const handle = useTemplateRef<HTMLElement>('handle')

// The handle promises the swipe: drawn only when the swipe is there (W36).
const canSwipe = computed(() => props.closeOnSwipe !== 'none' && !props.persistent)

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

const result = useModalResult(modelValue, emit)
const scope = computed(() => ({ confirm: result.confirm, cancel: result.cancel, close }))

if (import.meta.dev) {
  const attrs = useAttrs()

  watch(modelValue, (open) => {
    if (!open || props.ariaLabel || attrs['aria-labelledby']) return
    console.warn('[m-sheet] has no accessible name: pass `aria-label` or `aria-labelledby`.')
  }, { immediate: true })
}

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/sheet/index' as t;

$t: material-map(t.$tokens, 'md-sheet');

.ui-sheet {
  // Bottom-align inside the centered <MOverlay> panel. No `overflow: hidden`:
  // the corners hold without it, and it would clip focus rings at the edge.
  align-self: flex-end;
  inline-size: 100%;
  max-inline-size: g($t, 'max.inline-size');
  max-block-size: g($t, 'max.block-size');
  margin-inline: g($t, 'margin.inline');
  border-radius: g($t, 'border.radius');
  background-color: g($t, 'bg.color');
  box-shadow: g($t, 'shadow');

  @include forced-colors {
    border: 1px solid CanvasText;
  }

  // A tall body scrolls under the pinned handle; the bottom and the sides
  // keep clear of the window's safe area.
  &__container {
    display: flex;
    flex-direction: column;
    max-block-size: inherit;
    padding-inline: max(g($t, 'container.padding.inline'), env(safe-area-inset-left, 0rem)) max(g($t, 'container.padding.inline'), env(safe-area-inset-right, 0rem));
    padding-block-end: calc(#{g($t, 'container.padding.block.end')} + env(safe-area-inset-bottom, 0rem));
  }

  // The only place a swipe starts: the browser must not take it for a pan.
  // The 32 × 4 pill sits in the middle of its 48 target.
  &__drag-handle {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    align-self: center;
    inline-size: g($t, 'drag.handle.zone');
    block-size: g($t, 'drag.handle.zone');
    touch-action: none;

    &::before {
      content: '';
      inline-size: g($t, 'drag.handle.inline-size');
      block-size: g($t, 'drag.handle.block-size');
      border-radius: g($t, 'drag.handle.radius');
      background-color: g($t, 'drag.handle.color');

      @include forced-colors {
        forced-color-adjust: none;
        background-color: CanvasText;
      }
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    gap: g($t, 'content.gap');
    color: g($t, 'content.color');
  }
}

// Slide-up enter / slide-down exit: the <MOverlay> root fades the scrim while
// the nested `.ui-sheet` translates (one transition, child-targeted). Reduced
// motion shortens the durations and drops the slide; the fade stays.
.ui-sheet-pop {
  &-enter-active {
    transition: opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');

    .ui-sheet {
      transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
    }
  }

  &-leave-active {
    transition: opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');

    .ui-sheet {
      transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .ui-sheet {
      transform: translateY(100%);

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }
}
</style>
