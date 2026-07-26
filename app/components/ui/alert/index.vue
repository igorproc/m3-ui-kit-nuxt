<template>
  <MSurface
    v-if="model"
    class="ui-alert"
    :class="[`ui-alert--${type}`, `ui-alert--${variant}`]"
    :role="role"
    :aria-live="live"
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-describedby="hasBody ? bodyId : undefined"
  >
    <span
      v-if="resolvedIcon"
      class="ui-alert__icon"
      aria-hidden="true"
    >
      <slot
        name="icon"
        :type="type"
        :icon="resolvedIcon"
      >
        <MIcon :name="resolvedIcon" />
      </slot>
    </span>

    <div class="ui-alert__main">
      <div class="ui-alert__content">
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

      <div
        v-if="$slots.actions"
        class="ui-alert__actions"
      >
        <slot
          name="actions"
          :type="type"
          :close="close"
        />
      </div>
    </div>

    <slot
      v-if="closable"
      name="close"
      v-bind="closeSlotProps"
    >
      <MButtonIcon
        class="ui-alert__close"
        :aria-label="closeLabel"
        @click="close"
      >
        <MIcon name="round-close" />
      </MButtonIcon>
    </slot>
  </MSurface>
</template>

<script setup lang="ts">
import MSurface from '~/components/ui/surface/index.vue'
import MIcon from '~/components/ui/icon/index.vue'
import MButtonIcon from '~/components/ui/button/icon/index.vue'
import type { MAlertCloseSlot, MAlertType } from './props'
import { mAlertProps } from './props'

const props = defineProps(mAlertProps)
const model = defineModel<boolean>({ default: true })
const emit = defineEmits<{
  (event: 'close'): void
}>()

/** Default severity glyphs from the `ic` collection `MIcon` resolves to. */
const DEFAULT_ICONS: Record<MAlertType, string> = {
  info: 'round-info',
  success: 'round-check-circle',
  warning: 'round-warning',
  error: 'round-error',
}

const slots = useSlots()
const titleId = useId()
const bodyId = useId()

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
const resolvedIcon = computed(() => (props.icon === false ? undefined : props.icon || DEFAULT_ICONS[props.type]))

// Only `error` interrupts by default: the rest report state politely.
const assertive = computed(() => props.announce === 'assertive' || (props.announce === 'auto' && props.type === 'error'))
// `off` keeps the named group semantics but stops announcements.
const role = computed(() => (props.announce === 'off' ? 'group' : assertive.value ? 'alert' : 'status'))
const live = computed(() => (props.announce === 'off' ? undefined : assertive.value ? 'assertive' : 'polite'))

function close() {
  if (!model.value) return
  emit('close')
  model.value = false
}

const closeSlotProps = computed<MAlertCloseSlot>(() => ({
  close,
  props: {
    type: 'button',
    // Alert owns the close geometry and severity state layers, so a replacement
    // control opts into the same tokens instead of restyling them.
    class: 'ui-alert__close',
    ariaLabel: props.closeLabel,
    disabled: false,
    onClick: close,
  },
}))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/alert/index' as t;

.ui-alert {
  $t: material-map(t.$tokens, 'md-alert');

  display: flex;
  align-items: flex-start;
  gap: g($t, 'root-gap');
  min-height: g($t, 'root-min-height');
  padding-block: g($t, 'root-padding-block');
  padding-inline: g($t, 'root-padding-inline');

  // Owns shape and outline: `MSurface` only provides the passive boundary.
  &.ui-surface {
    border-radius: g($t, 'root-shape');
    border-style: solid;
    border-width: 0;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    font-size: g($t, 'icon-size');
    line-height: 0;
  }

  // Actions sit in the same row while the content keeps its minimum width and
  // wrap beneath it once the container gets narrower.
  &__main {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: g($t, 'actions-gap');
    min-width: 0;
  }

  &__content {
    display: flex;
    flex: 1 1 g($t, 'content-min-width');
    flex-direction: column;
    gap: g($t, 'content-gap');
    min-width: 0;
  }

  &__title {
    @include apply-typography(g($t, 'title-typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body-typography'));
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    flex-shrink: 0;
    gap: g($t, 'actions-gap');
  }

  // Compounded with the root so the alert-owned box wins over the button
  // family defaults, and so a `close` slot control styles identically.
  & &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: g($t, 'close-size');
    height: g($t, 'close-size');
    padding: 0;
    border: none;
    border-radius: g($t, 'close-shape');
    background-color: transparent;
    cursor: pointer;

    .ui-icon { font-size: g($t, 'close-icon-size'); }
  }

  // Severity × variant token application. `.ui-alert--<variant>.ui-alert--<type>`
  // outranks the `.ui-surface` preset, so paint order stays deterministic.
  @each $variant in ('tonal', 'outlined') {
    @each $type in ('info', 'success', 'warning', 'error') {
      $base: '#{$variant}-#{$type}';

      &--#{$variant}.ui-alert--#{$type} {
        color: g($t, '#{$base}-content-color');
        background-color: g($t, '#{$base}-container-color');

        @if $variant == 'outlined' {
          border-width: g($t, 'outline-width');
          border-color: g($t, '#{$base}-outline-color');
        }

        .ui-alert__icon { color: g($t, '#{$base}-icon-color'); }

        .ui-alert__close {
          color: g($t, '#{$base}-close-color');
          transition: background-color g($t, 'motion-duration') g($t, 'motion-easing');

          &:hover:not(:disabled, .ui-button--disabled) { background-color: g($t, '#{$base}-close-hover-color'); }
          &:active:not(:disabled, .ui-button--disabled) { background-color: g($t, '#{$base}-close-pressed-color'); }

          &:focus-visible {
            outline: g($t, 'close-focus-width') solid g($t, '#{$base}-close-focus-color');
            outline-offset: g($t, 'close-focus-offset');
          }

          &:disabled,
          &.ui-button--disabled { color: g($t, '#{$base}-close-disabled-color'); }
        }
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    & &__close { transition: none; }
  }
}
</style>
