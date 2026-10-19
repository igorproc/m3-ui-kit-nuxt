<template>
  <component
    :is="rootTag"
    class="ui-card"
    :class="rootClass"
    v-bind="rootAttrs"
  >
    <div
      v-if="$slots.media"
      ref="media"
      class="ui-card__media"
      :style="mediaStyle"
    >
      <slot name="media" />
    </div>

    <component
      :is="headerTag"
      v-if="$slots.header || hasTitle || subtitle"
      ref="header"
      class="ui-card__header"
    >
      <slot name="header">
        <component
          :is="titleTag"
          v-if="hasTitle"
          v-bind="titleAttrs"
          class="ui-card__title"
        >
          <slot name="title">
            {{ title }}
          </slot>
        </component>

        <p
          v-if="subtitle"
          class="ui-card__subtitle"
        >
          {{ subtitle }}
        </p>
      </slot>
    </component>

    <div
      v-if="$slots.default"
      ref="content"
      class="ui-card__content"
    >
      <slot />
    </div>

    <component
      :is="footerTag"
      v-if="$slots.actions"
      ref="actions"
      class="ui-card__actions"
    >
      <slot name="actions" />
    </component>
  </component>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { mCardProps } from './props'
import type { MCardSlots } from './props'
import { useCard } from '#kit/composables/card/useCard'
import { useCardWarnings } from './useCardWarnings'

const props = defineProps(mCardProps)
const slots = defineSlots<MCardSlots>()

const hasTitle = computed(() => Boolean(props.title || slots.title))

const { isLink, isDisabled, rootTag, rootAttrs, titleTag, titleAttrs } = useCard(props, {
  hasTitle: () => hasTitle.value && !slots.header,
})

const rootClass = computed(() => [
  `ui-card--${props.variant}`,
  { 'ui-card--link': isLink.value, 'ui-card--disabled': isDisabled.value },
])

// `<header>` / `<footer>` are scoped by the article; inside a link they would
// become page-level banner and contentinfo landmarks.
const headerTag = computed(() => (isLink.value ? 'div' : 'header'))
const footerTag = computed(() => (isLink.value ? 'div' : 'footer'))

const mediaStyle = computed(() => (props.mediaAspectRatio ? { aspectRatio: props.mediaAspectRatio } : undefined))

const parts = [useTemplateRef<Element>('media'), useTemplateRef<Element>('header'), useTemplateRef<Element>('content'), useTemplateRef<Element>('actions')]

useCardWarnings({
  tag: () => props.tag,
  disabled: () => props.disabled,
  parts: () => parts.map(part => part.value),
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/card/index' as t;
@use '#kit/assets/stylesheet/components/card/states' as states;

$t: t.$tokens;
$variants: ('elevated', 'filled', 'outlined');

.ui-card {
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;
  padding: g($t, 'container.padding');
  border: g($t, 'container.outline.width') solid transparent;
  border-radius: g($t, 'container.shape');
  color: g($t, 'content.color');
  overflow-wrap: anywhere;

  @each $variant in $variants {
    &--#{$variant} {
      background-color: g($t, '#{$variant}.container.color');
      box-shadow: g($t, '#{$variant}.elevation.rest');
    }
  }

  &--outlined {
    border-color: g($t, 'outlined.outline.color');
  }

  // Set apart by a shadow or a tone; their border is already there, transparent.
  &--elevated,
  &--filled {
    @include forced-colors {
      border-color: CanvasText;
    }
  }

  // Full-bleed: the media runs to the card's edges, over its padding.
  &__media {
    // `clip` is no scroll container, so without this the box would keep its
    // content-based minimum: a tall image would stretch the reserved ratio.
    min-height: 0;
    overflow: clip;
    margin: g($t, 'media.margin') g($t, 'media.margin') 0;
    border-radius: g($t, 'container.shape') g($t, 'container.shape') 0 0;
    background-color: g($t, 'media.placeholder');

    // The clip widens only while a focus ring shows inside, so at rest the top
    // corners still round the image; a margin at rest would leave them square.
    &:has(:focus-visible) {
      overflow-clip-margin: g($t, 'media.ring');
    }

    // `:where()`: the slot's own media is normalised at the weight of the
    // block alone, so a consumer's class still wins.
    :where(img, video) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: g($t, 'header.gap');
  }

  &__title {
    margin: 0;

    @include typescale(g($t, 'title.type'));
  }

  &__subtitle {
    margin: 0;
    color: g($t, 'subtitle.color');

    @include typescale(g($t, 'subtitle.type'));
  }

  &__content {
    flex: 1 1 auto;

    @include typescale(g($t, 'body.type'));
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: g($t, 'actions.gap');
    margin-block-start: g($t, 'actions.margin');
  }

  @include states.link-card($t, $variants);
}
</style>
