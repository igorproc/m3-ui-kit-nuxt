<template>
  <transition name="ui-banner-fade">
    <MSurface
      v-if="model"
      ref="root"
      tag="section"
      class="ui-banner"
      :class="[`ui-banner--${variant}`, `ui-banner--${layout}`, { 'ui-banner--actions': $slots.actions, 'ui-banner--icon': hasIcon }]"
      :aria-labelledby="hasTitle ? titleId : undefined"
      :aria-describedby="hasBody ? bodyId : undefined"
    >
      <span
        v-if="hasIcon"
        class="ui-banner__icon"
        aria-hidden="true"
      >
        <slot
          name="icon"
          :icon="resolvedIcon"
        >
          <MIcon
            v-if="resolvedIcon"
            :name="resolvedIcon"
          />
        </slot>
      </span>

      <div
        ref="content"
        class="ui-banner__content"
      >
        <div
          v-if="hasTitle"
          :id="titleId"
          class="ui-banner__title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </div>
        <div
          v-if="hasBody"
          :id="bodyId"
          class="ui-banner__body"
        >
          <slot>{{ text }}</slot>
        </div>
      </div>

      <BannerActions
        v-if="$slots.actions"
        class="ui-banner__actions"
        :layout="layout"
      >
        <slot
          name="actions"
          :close="close"
        />
      </BannerActions>

      <slot
        v-if="closable"
        name="close"
        v-bind="closeSlotProps"
      >
        <MButtonIcon
          class="ui-banner__close"
          :aria-label="closeName"
          @click="close"
        >
          <MIcon :name="ICONS.close" />
        </MButtonIcon>
      </slot>

      <teleport
        v-if="announcement.ownsRegion.value"
        :to="announcement.teleportTarget.value"
      >
        <LiveRegion />
      </teleport>
    </MSurface>
  </transition>
</template>

<script setup lang="ts">
import { computed, useId, useSlots, useTemplateRef, watchEffect } from 'vue'
import MSurface from '#kit/components/ui/surface/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import BannerActions from '#kit/components/fragments/banner/actions/index.vue'
import LiveRegion from '#kit/components/fragments/live-region/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { closeNameWithTitle, useBlockAnnouncement, useBlockDismiss } from '#kit/utils/feedback/useFeedbackBlock'
import type { MBannerCloseSlot } from './props'
import { mBannerProps } from './props'

const props = defineProps(mBannerProps)
const model = defineModel<boolean>({ default: true })
const emit = defineEmits<{
  (event: 'close'): void
}>()

const slots = useSlots()
const titleId = useId()
const bodyId = useId()
const root = useTemplateRef<{ $el: HTMLElement }>('root')
const content = useTemplateRef<HTMLElement>('content')

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
// No default icon exists: the banner carries no severity to infer one from.
const resolvedIcon = computed(() => (props.icon === false ? undefined : props.icon || undefined))
const hasIcon = computed(() => Boolean(resolvedIcon.value || slots.icon))

const announcement = useBlockAnnouncement({
  shown: model,
  content,
  politeness: () => (props.announce === 'polite' ? 'polite' : 'off'),
})

const close = useBlockDismiss({
  shown: model,
  root: () => root.value?.$el,
  returnFocus: () => props.returnFocus,
  onClose: () => emit('close'),
})

const closeName = computed(() => closeNameWithTitle(props.closeLabel, props.title))

const closeSlotProps = computed<MBannerCloseSlot>(() => ({
  close,
  props: {
    'type': 'button',
    // Banner owns the close geometry and state layers; a replacement control
    // opts into the same tokens instead of restyling them.
    'class': 'ui-banner__close',
    'aria-label': closeName.value,
    'onClick': close,
  },
}))

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.closable || props.closeLabel || slots.close) return
    console.warn('[m-banner] the close control has no accessible name: pass `close-label`.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/banner/index' as t;

.ui-banner {
  $t: material-map(t.$tokens, 'md-banner');

  align-items: start;
  gap: g($t, 'root.gap');
  min-height: g($t, 'root.min.height');
  padding-block: g($t, 'root.padding.block');
  padding-inline: g($t, 'root.padding.inline');

  // The root is an MSurface: whatever the surface also sets is written on
  // `.ui-surface`, because the surface's own rules weigh one class and in a
  // production build its stylesheet may load after this one.
  &.ui-surface {
    display: grid;
    border-radius: g($t, 'root.shape');
    border-style: solid;
    border-width: 0;
  }

  &__icon {
    grid-area: icon;
    display: inline-flex;
    flex-shrink: 0;
    font-size: g($t, 'icon.size');
    line-height: 0;
    color: g($t, 'icon.color');
  }

  &__content {
    grid-area: content;
    display: flex;
    flex-direction: column;
    gap: g($t, 'content.gap');
    min-width: 0;
  }

  &__title {
    @include apply-typography(g($t, 'title.typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body.typography'));
  }

  &__actions { grid-area: actions; }

  // Grid areas move the actions row visually; DOM and keyboard order stay
  // exactly as authored, so `order` is never used.
  @mixin inline-grid {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas: 'icon content actions close';
    align-items: center;
  }

  // With actions, the close control ends the actions row: on screen it comes
  // after them, as it does in the DOM and for Tab.
  @mixin stacked-grid {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon content close'
      'actions actions actions';
    align-items: start;

    &.ui-banner--actions {
      grid-template-areas:
        'icon content content'
        'actions actions close';

      // The actions row starts with its own top margin: the control lines up
      // with the actions' last line, not with the margin above them.
      .ui-banner__close {
        align-self: end;
      }
    }
  }

  &--inline { @include inline-grid; }
  &--stacked { @include stacked-grid; }

  &--auto {
    @include stacked-grid;

    @media only screen and (min-width: #{g($t, 'auto.threshold')}) {
      @include inline-grid;

      &.ui-banner--actions {
        grid-template-areas: 'icon content actions close';

        .ui-banner__close {
          align-self: auto;
        }
      }
    }
  }

  // A banner without an icon must not reserve the leading column.
  &:not(.ui-banner--icon) {
    &.ui-banner--inline {
      grid-template-columns: minmax(0, 1fr) auto auto;
      grid-template-areas: 'content actions close';
    }

    &.ui-banner--stacked {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'content close'
        'actions actions';

      &.ui-banner--actions {
        grid-template-areas:
          'content content'
          'actions close';
      }
    }

    &.ui-banner--auto {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'content close'
        'actions actions';

      &.ui-banner--actions {
        grid-template-areas:
          'content content'
          'actions close';
      }

      @media only screen and (min-width: #{g($t, 'auto.threshold')}) {
        grid-template-columns: minmax(0, 1fr) auto auto;
        grid-template-areas: 'content actions close';

        &.ui-banner--actions {
          grid-template-areas: 'content actions close';
        }
      }
    }
  }

  &--plain.ui-surface {
    color: g($t, 'plain.content.color');
    background-color: g($t, 'plain.container.color');

    // M3 separates a page-level banner from following content with a divider.
    box-shadow: inset 0 calc(-1 * #{g($t, 'plain.divider.width')}) 0 0 g($t, 'plain.divider.color');

    // Forced colours drop the shadow that draws the divider. Weighs what the
    // root's own `border-width: 0` above does, and comes after it.
    @include forced-colors {
      border-block-end: 1px solid CanvasText;
    }
  }

  &--tonal.ui-surface {
    color: g($t, 'tonal.content.color');
    background-color: g($t, 'tonal.container.color');

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  // Three classes: MButton's variant colours already weigh two
  // (`.ui-button.ui-button--text`), and its sheet may load later in production.
  &.ui-surface &__close {
    grid-area: close;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: g($t, 'close.size');
    height: g($t, 'close.size');
    padding: 0;
    border: none;
    border-radius: g($t, 'close.shape');
    background-color: transparent;
    color: g($t, 'close.color');
    cursor: pointer;
    transition: background-color g($t, 'motion.duration') g($t, 'motion.easing');

    .ui-icon { font-size: g($t, 'close.icon.size'); }

    &:focus-visible {
      @include focus-ring;
    }
  }

}

// Fade in and out; the banner's place in the flow is not animated. Reduced
// motion shortens the system durations.
.ui-banner-fade {
  $t: material-map(t.$tokens, 'md-banner');

  &-enter-active {
    transition: opacity g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &-leave-active {
    transition: opacity g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
