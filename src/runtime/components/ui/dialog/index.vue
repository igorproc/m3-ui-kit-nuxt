<template>
  <MOverlay
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? 'ui-dialog-pop'"
    :role="role === 'alertdialog' ? 'alertdialog' : undefined"
    :aria-labelledby="hasHeadline ? headlineId : undefined"
    :aria-describedby="role === 'alertdialog' ? contentId : undefined"
    @dismiss="result.onDismiss"
  >
    <div class="ui-dialog">
      <div
        v-if="$slots.icon"
        class="ui-dialog__icon"
      >
        <slot name="icon" />
      </div>

      <h2
        v-if="hasHeadline"
        :id="headlineId"
        class="ui-dialog__headline"
        :class="{ 'ui-dialog__headline--centered': $slots.icon }"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </h2>

      <div
        :id="contentId"
        class="ui-dialog__content"
      >
        <slot v-bind="scope" />
      </div>

      <div
        v-if="$slots.actions"
        class="ui-dialog__actions"
      >
        <slot
          name="actions"
          v-bind="scope"
        />
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useAttrs, useId, useSlots, useTemplateRef, watch } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { useModalResult } from '#kit/composables/modal/useModalResult'
import type { MModalResultEmits } from '#kit/composables/modal/useModalResult'
import { mDialogProps } from './props'

const props = defineProps(mDialogProps)

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<MModalResultEmits>()
const slots = useSlots()

// The native <dialog> root is the accessible dialog; the headline names it.
// Lifecycle events (`opened`, `closed`, …) fall through to <MOverlay>.
const headlineId = useId()
const contentId = useId()
const hasHeadline = computed(() => Boolean(props.title || slots.title))
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

const result = useModalResult(modelValue, emit)
const scope = computed(() => ({ confirm: result.confirm, cancel: result.cancel, close }))

// No English fallback name: an untitled dialog is named by its caller.
if (import.meta.dev) {
  const attrs = useAttrs()

  watch(modelValue, (open) => {
    if (!open || hasHeadline.value || attrs['aria-label'] || attrs['aria-labelledby']) return
    console.warn('[m-dialog] has no accessible name: pass `title`, `aria-label` or `aria-labelledby`.')
  }, { immediate: true })
}

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/dialog/index' as t;

$t: material-map(t.$tokens, 'md-dialog');

.ui-dialog {
  // A tall body scrolls between the pinned headline and actions. No
  // `overflow: hidden`: the corner holds without it, and it would clip the
  // focus rings of controls at the edge.
  display: flex;
  flex-direction: column;
  max-inline-size: g($t, 'max.inline-size');
  min-inline-size: g($t, 'min.inline-size');
  max-block-size: g($t, 'max.block-size');
  inline-size: fit-content;
  border-radius: g($t, 'border.radius');
  background-color: g($t, 'bg.color');
  color: g($t, 'text.color');
  box-shadow: g($t, 'shadow');
  padding: g($t, 'padding');
  margin: g($t, 'margin');
  position: relative;
  transform-origin: center;

  @include forced-colors {
    border: 1px solid CanvasText;
  }

  &__icon {
    display: flex;
    flex: none;
    justify-content: center;
    margin-block-end: g($t, 'icon.margin.block.end');
    color: g($t, 'icon.color');
    font-size: g($t, 'icon.size');
  }

  &__headline {
    flex: none;
    margin-block: 0 g($t, 'headline.margin.block.end');
    margin-inline: 0;
    color: g($t, 'headline.color');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'headline.text.type'));

    // M3 centres the headline only under a hero icon.
    &--centered {
      text-align: center;
    }
  }

  &__content {
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-wrap: anywhere;
    border-block: g($t, 'divider.thickness') solid transparent;
    color: g($t, 'content.color');

    @include typescale(g($t, 'content.text.type'));

    @supports (animation-timeline: scroll()) {
      animation:
        ui-dialog-divider-start auto g($t, 'divider.easing') both,
        ui-dialog-divider-end auto g($t, 'divider.easing') both;
      animation-timeline: scroll(self block);
      animation-range: 0 g($t, 'divider.reveal'), calc(100% - #{g($t, 'divider.reveal')}) 100%;
    }
  }

  // In a row Cancel comes first, OK last (DOM order); wrapped into a stack,
  // OK rises to the top without reordering the DOM.
  &__actions {
    display: flex;
    flex: none;
    flex-wrap: wrap-reverse;
    justify-content: flex-end;
    gap: g($t, 'actions.gap');
    margin-block-start: g($t, 'actions.margin.block.start');
  }
}

@keyframes ui-dialog-divider-start {
  to {
    border-block-start-color: g($t, 'divider.color');
  }
}

@keyframes ui-dialog-divider-end {
  from {
    border-block-end-color: g($t, 'divider.color');
  }
}

// M3 basic-dialog motion: the <MOverlay> root fades the scrim (opacity) while
// the nested `.ui-dialog` scales — one transition, differentiated by targeting
// the child (mirrors the menu pattern). Enter decelerates, exit accelerates.
// Reduced motion shortens the durations; the fade stays, the scale goes.
.ui-dialog-pop {
  &-enter-active {
    transition: opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');

    .ui-dialog {
      transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
    }
  }

  &-leave-active {
    transition: opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');

    .ui-dialog {
      transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .ui-dialog {
      transform: scale(g($t, 'motion.scale.from'));

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }
}
</style>
