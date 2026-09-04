<template>
  <MSurface
    v-if="model"
    shape="medium"
    class="ui-alert"
    :class="alertClasses"
    v-bind="alertA11y"
  >
    <span
      v-if="hasIcon"
      class="ui-alert__icon"
      aria-hidden="true"
    >
      <slot
        name="icon"
        :type="type"
        :icon="icon"
      >
        <MIcon
          v-if="icon"
          :name="icon"
        />
      </slot>
    </span>

    <div
      v-if="hasContent"
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
      :type="type"
      :close="close"
    />

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
import MSurface from '#kit/components/ui/surface/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import { mAlertProps } from './props'
import type { MAlertCloseSlot, MAlertSlots } from './props'

interface Emits {
  (event: 'close'): void
}

const props = defineProps(mAlertProps)
const emit = defineEmits<Emits>()
const slots = defineSlots<MAlertSlots>()
const model = defineModel<boolean>({ default: true })

const titleId = useId()
const bodyId = useId()

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
const hasContent = computed(() => hasTitle.value || hasBody.value)
const hasIcon = computed(() => Boolean(slots.icon || props.icon))

const alertClasses = computed(() => [
  `ui-alert--${props.type}`,
  `ui-alert--${props.variant}`,
  { 'ui-alert--closable': props.closable },
])

const alertA11y = computed(() => {
  const assertive = props.announce === 'assertive'
    || (props.announce === 'auto' && props.type === 'error')

  return {
    'role': props.announce === 'off' ? 'group' : assertive ? 'alert' : 'status',
    'aria-live': props.announce === 'off' ? undefined : assertive ? 'assertive' : 'polite',
    'aria-labelledby': hasTitle.value ? titleId : undefined,
    'aria-describedby': hasBody.value ? bodyId : undefined,
  }
})

const closeSlotProps = computed<MAlertCloseSlot>(() => ({
  close,
  props: {
    type: 'button',
    class: 'ui-alert__close',
    ariaLabel: props.closeLabel,
    disabled: false,
    onClick: close,
  },
}))

const close = () => {
  if (!model.value) {
    return
  }

  emit('close')
  model.value = false
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/alert/index' as *;

.ui-alert {
  $t: material-map($tokens, 'md-alert');

  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: g($t, 'root.gap');
  padding: g($t, 'root.padding');

  &__icon {
    font-size: g($t, 'icon.size');
  }

  &__content {
    flex: 1 1 g($t, 'content.min.width');
    min-width: 0;
  }

  &__title {
    @include apply-typography(g($t, 'title.typography'));
  }

  &__body {
    @include apply-typography(g($t, 'body.typography'));
  }

  &__title + &__body {
    margin-block-start: g($t, 'content.gap');
  }

  &--closable {
    padding-inline-end: g($t, 'root.closable.padding-inline-end');
  }

  @at-root #{&} > .ui-alert__close {
    position: absolute;
    inset-block-start: g($t, 'close.inset.block');
    inset-inline-end: g($t, 'close.inset.inline');
  }

  @each $variant in ('tonal', 'outlined') {
    @each $type in ('info', 'success', 'warning', 'error') {
      $base: '#{$variant}.#{$type}';

      &--#{$variant}.ui-alert--#{$type} {
        color: g($t, '#{$base}.content.color');
        background-color: g($t, '#{$base}.container.color');

        @if $variant == 'outlined' {
          border-width: g($t, 'outline.width');
          border-color: g($t, '#{$base}.outline.color');
        }

        .ui-alert__icon { color: g($t, '#{$base}.icon.color'); }

        .ui-alert__close {
          color: g($t, '#{$base}.close.color');

          &:hover:not(:disabled, .ui-button--disabled) {
            background-color: g($t, '#{$base}.close.hover.color');
          }

          &:active:not(:disabled, .ui-button--disabled) {
            background-color: g($t, '#{$base}.close.pressed.color');
          }

          &:focus-visible {
            outline: g($t, 'close.focus.width') solid g($t, '#{$base}.close.focus.color');
            outline-offset: g($t, 'close.focus.offset');
          }
        }
      }
    }
  }
}
</style>
