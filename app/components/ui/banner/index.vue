<template>
  <MSurface
    v-if="model"
    tag="section"
    class="ui-banner"
    :class="[`ui-banner--${variant}`, `ui-banner--${layout}`]"
    :aria-live="live"
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-describedby="hasBody ? bodyId : undefined"
  >
    <span
      v-if="resolvedIcon || $slots.icon"
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

    <div class="ui-banner__content">
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
import BannerActions from '~/components/fragments/banner/actions/index.vue'
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

const hasTitle = computed(() => Boolean(slots.title || props.title))
const hasBody = computed(() => Boolean(slots.default || props.text))
// No default icon exists: the banner carries no severity to infer one from.
const resolvedIcon = computed(() => (props.icon === false ? undefined : props.icon || undefined))
const live = computed(() => (props.announce === 'polite' ? 'polite' : undefined))

function close() {
  if (!model.value) return
  emit('close')
  model.value = false
}

const closeSlotProps = computed<MBannerCloseSlot>(() => ({
  close,
  props: {
    type: 'button',
    // Banner owns the close geometry and state layers; a replacement control
    // opts into the same tokens instead of restyling them.
    class: 'ui-banner__close',
    ariaLabel: props.closeLabel,
    onClick: close,
  },
}))
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/banner/index' as t;

.ui-banner {
  $t: material-map(t.$tokens, 'md-banner');

  display: grid;
  align-items: start;
  gap: g($t, 'root-gap');
  min-height: g($t, 'root-min-height');
  padding-block: g($t, 'root-padding-block');
  padding-inline: g($t, 'root-padding-inline');

  &.ui-surface {
    border-radius: g($t, 'root-shape');
    border-style: solid;
    border-width: 0;
  }

  &__icon {
    grid-area: icon;
    display: inline-flex;
    flex-shrink: 0;
    font-size: g($t, 'icon-size');
    line-height: 0;
    color: g($t, 'icon-color');
  }

  &__content {
    grid-area: content;
    display: flex;
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

  &__actions { grid-area: actions; }

  // Grid areas move the actions row visually; DOM and keyboard order stay
  // exactly as authored, so `order` is never used.
  @mixin inline-grid {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas: 'icon content actions close';
    align-items: center;
  }

  @mixin stacked-grid {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon content close'
      'actions actions actions';
    align-items: start;
  }

  &--inline { @include inline-grid; }
  &--stacked { @include stacked-grid; }

  &--auto {
    @include stacked-grid;

    @media only screen and (min-width: #{g($t, 'auto-threshold')}) {
      @include inline-grid;
    }
  }

  // A banner without an icon must not reserve the leading column.
  &:not(:has(> .ui-banner__icon)) {
    &.ui-banner--inline {
      grid-template-columns: minmax(0, 1fr) auto auto;
      grid-template-areas: 'content actions close';
    }

    &.ui-banner--stacked {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'content close'
        'actions actions';
    }

    &.ui-banner--auto {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'content close'
        'actions actions';

      @media only screen and (min-width: #{g($t, 'auto-threshold')}) {
        grid-template-columns: minmax(0, 1fr) auto auto;
        grid-template-areas: 'content actions close';
      }
    }
  }

  &--surface {
    color: g($t, 'surface-content-color');
    background-color: g($t, 'surface-container-color');

    // M3 separates a page-level banner from following content with a divider.
    box-shadow: inset 0 calc(-1 * #{g($t, 'surface-divider-width')}) 0 0 g($t, 'surface-divider-color');
  }

  &--tonal {
    color: g($t, 'tonal-content-color');
    background-color: g($t, 'tonal-container-color');
  }

  & &__close {
    grid-area: close;
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
    color: g($t, 'close-color');
    cursor: pointer;
    transition: background-color g($t, 'motion-duration') g($t, 'motion-easing');

    .ui-icon { font-size: g($t, 'close-icon-size'); }

    &:hover:not(:disabled, .ui-button--disabled) { background-color: g($t, 'close-hover-color'); }
    &:active:not(:disabled, .ui-button--disabled) { background-color: g($t, 'close-pressed-color'); }

    &:focus-visible {
      outline: g($t, 'close-focus-width') solid g($t, 'close-focus-color');
      outline-offset: g($t, 'close-focus-offset');
    }
  }

  @media (prefers-reduced-motion: reduce) {
    & &__close { transition: none; }
  }
}
</style>
