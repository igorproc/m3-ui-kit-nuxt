<template>
  <transition name="ui-alert-fade">
    <MSurface
      v-if="model"
      ref="root"
      shape="medium"
      class="ui-alert"
      :class="alertClasses"
      role="group"
      :aria-labelledby="hasTitle ? titleId : undefined"
      :aria-describedby="hasBody ? bodyId : undefined"
    >
      <span
        v-if="hasIcon"
        class="ui-alert__icon"
        aria-hidden="true"
      >
        <slot
          name="icon"
          :color="color"
          :icon="resolvedIcon"
        >
          <MIcon
            v-if="resolvedIcon"
            :name="resolvedIcon"
          />
        </slot>
      </span>

      <div
        v-if="hasContent"
        ref="content"
        class="ui-alert__content"
      >
        <div
          v-if="hasTitle"
          :id="titleId"
          class="ui-alert__title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </div>

        <div
          v-if="hasBody"
          :id="bodyId"
          class="ui-alert__body"
        >
          <slot>{{ text }}</slot>
        </div>
      </div>

      <slot
        v-if="slots.actions"
        name="actions"
        :color="color"
        :close="close"
      />

      <slot
        v-if="closable"
        name="close"
        v-bind="closeSlotProps"
      >
        <MButtonIcon
          class="ui-alert__close"
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
import { computed, useId, useTemplateRef, watchEffect } from 'vue'
import MSurface from '#kit/components/ui/surface/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import LiveRegion from '#kit/components/fragments/live-region/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { closeNameWithTitle, useBlockAnnouncement, useBlockDismiss } from '#kit/utils/feedback/useFeedbackBlock'
import { mAlertProps } from './props'
import type { MAlertCloseSlot, MAlertColor, MAlertSlots } from './props'
import type { MIconName } from '#kit/components/ui/icon/props'

interface Emits {
  (event: 'close'): void
}

const props = defineProps(mAlertProps)
const emit = defineEmits<Emits>()
const slots = defineSlots<MAlertSlots>()
const model = defineModel<boolean>({ default: true })

const SEVERITY_ICONS: Record<MAlertColor, MIconName> = {
  info: ICONS.info,
  success: ICONS.checkCircle,
  warning: ICONS.warning,
  error: ICONS.error,
}

const titleId = useId()
const bodyId = useId()
const root = useTemplateRef<{ $el: HTMLElement }>('root')
const content = useTemplateRef<HTMLElement>('content')

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
const hasContent = computed(() => hasTitle.value || hasBody.value)
// The severity's own icon unless the caller names another or turns it off:
// the severity is never told by colour alone.
const resolvedIcon = computed(() => (props.icon === false ? false : props.icon || SEVERITY_ICONS[props.color]))
const hasIcon = computed(() => Boolean(slots.icon || resolvedIcon.value))

const alertClasses = computed(() => [
  `ui-alert--${props.color}`,
  `ui-alert--${props.variant}`,
  { 'ui-alert--closable': props.closable },
])

const announcement = useBlockAnnouncement({
  shown: model,
  content,
  politeness: () => {
    if (props.announce === 'off') return 'off'
    const assertive = props.announce === 'assertive' || (props.announce === 'auto' && props.color === 'error')
    return assertive ? 'assertive' : 'polite'
  },
})

const close = useBlockDismiss({
  shown: model,
  root: () => root.value?.$el,
  returnFocus: () => props.returnFocus,
  onClose: () => emit('close'),
})

const closeName = computed(() => closeNameWithTitle(props.closeLabel, props.title))

const closeSlotProps = computed<MAlertCloseSlot>(() => ({
  close,
  props: {
    'type': 'button',
    'class': 'ui-alert__close',
    'aria-label': closeName.value,
    'disabled': false,
    'onClick': close,
  },
}))

if (import.meta.dev) {
  watchEffect(() => {
    if (!props.closable || props.closeLabel || slots.close) return
    console.warn('[m-alert] the close control has no accessible name: pass `close-label`.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/alert/index' as *;

.ui-alert {
  $t: material-map($tokens, 'md-alert');

  position: relative;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: g($t, 'root.gap');
  padding-block: g($t, 'root.padding.block');
  padding-inline: g($t, 'root.padding.inline');

  // The root is an MSurface, whose own `display: block` weighs one class; in a
  // production build its stylesheet may load after this one.
  &.ui-surface {
    display: flex;
  }

  &__icon {
    font-size: g($t, 'icon.size');
  }

  &__content {
    display: flex;
    flex: 1 1 g($t, 'content.min.width');
    flex-direction: column;
    gap: g($t, 'content.gap');
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &__title {
    @include apply-typography(g($t, 'title.typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body.typography'));
  }

  &--closable {
    padding-inline-end: g($t, 'root.closable.padding-inline-end');
  }

  // Compound with the root so it outranks the close button's own `.ui-button`
  // root in any stylesheet order.
  & &__close {
    position: absolute;
    inset-block-start: g($t, 'close.inset.block');
    inset-inline-end: g($t, 'close.inset.inline');
  }

  @each $variant in ('tonal', 'outlined') {
    @each $color in ('info', 'success', 'warning', 'error') {
      $base: '#{$variant}.#{$color}';

      &--#{$variant}.ui-alert--#{$color} {
        color: g($t, '#{$base}.content.color');
        background-color: g($t, '#{$base}.container.color');

        @if $variant == 'outlined' {
          border-width: g($t, 'outline.width');
          border-color: g($t, '#{$base}.outline.color');
        }

        .ui-alert__icon { color: g($t, '#{$base}.icon.color'); }

        .ui-alert__close {
          color: g($t, '#{$base}.close.color');

          &:focus-visible {
            outline: g($t, 'close.focus.width') solid g($t, '#{$base}.close.focus.color');
            outline-offset: g($t, 'close.focus.offset');
          }
        }
      }
    }
  }

  // Tonal is set apart by its fill alone. `.ui-surface` outweighs the
  // surface's own `border-width: 0` whichever stylesheet loads last.
  &--tonal.ui-surface {
    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }
}

// Fade in and out; the block's place in the flow is not animated.
.ui-alert-fade {
  $t: material-map($tokens, 'md-alert');

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
