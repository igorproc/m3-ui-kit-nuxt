<template>
  <ListRow :wrap="wrapped">
    <component
      :is="rowTag"
      v-ripple="isInteractive && !disabled"
      v-bind="rowAttrs"
      class="ui-list-item"
      :class="rowClasses"
    >
      <div
        v-if="$slots.leading || leadingIcon"
        class="ui-list-item__leading"
      >
        <slot name="leading">
          <MIcon
            v-if="leadingIcon"
            :name="leadingIcon"
          />
        </slot>
      </div>

      <div class="ui-list-item__body">
        <div
          v-if="overline || $slots.overline"
          class="ui-list-item__overline"
          :title="clampTitle(overline, !!$slots.overline)"
        >
          <slot name="overline">
            {{ overline }}
          </slot>
        </div>

        <div
          v-if="headline || $slots.headline"
          class="ui-list-item__headline"
          :title="clampTitle(headline, !!$slots.headline)"
        >
          <slot name="headline">
            {{ headline }}
          </slot>
        </div>

        <slot />

        <div
          v-if="supportingText || $slots.supporting"
          class="ui-list-item__supporting"
          :title="clampTitle(supportingText, !!$slots.supporting)"
        >
          <slot name="supporting">
            {{ supportingText }}
          </slot>
        </div>
      </div>

      <div
        v-if="$slots.trailing || trailingIcon || trailingSupportingText || $slots.trailingSupporting"
        class="ui-list-item__trailing"
      >
        <div
          v-if="trailingSupportingText || $slots.trailingSupporting"
          class="ui-list-item__trailing-supporting"
        >
          <slot name="trailingSupporting">
            {{ trailingSupportingText }}
          </slot>
        </div>
        <slot name="trailing">
          <MIcon
            v-if="trailingIcon"
            :name="trailingIcon"
          />
        </slot>
      </div>
    </component>
  </ListRow>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import { mListItemProps } from './props'
import { ListRow } from './ListRow'
import { useListItemControl } from '#kit/composables/list/useListItemControl'
import { LIST_CONTEXT_FALLBACK, provideListContext, useListContext } from '../context'
import { useRetiredPropWarning } from '#kit/composables/button/useRetiredValueWarning'
import MIcon from '#kit/components/ui/icon/index.vue'

// Consumer attributes belong to the row element, which is not the root when an
// `li` wraps it.
defineOptions({ inheritAttrs: false })

const props = defineProps(mListItemProps)
const attrs = useAttrs()
const slots = useSlots()

useRetiredPropWarning('m-list-item', 'loading', () => props.loading, 'a progress indicator in the `#trailing` slot')

// The row's own prop wins; absent, the enclosing `<MList>` decides. A row with
// no list ancestor gets the context's fallback.
const list = useListContext()
const resolvedDensity = computed(() => props.density ?? list.density.value)

// What the row's content holds is not a direct child of the list: a divider or
// a subheader placed inside it must not render as a list item.
provideListContext({ ...list, present: false, semantic: LIST_CONTEXT_FALLBACK.semantic })

const { isInteractive, wrapped, tag: rowTag, rowAttrs } = useListItemControl({
  props,
  attrs: () => attrs,
  semantic: () => list.semantic.value,
})

const computedLines = computed(() => {
  if (props.lines !== 'auto') {
    return props.lines
  }
  const hasSupporting = props.supportingText || slots.supporting || slots.default
  const hasOverline = props.overline || slots.overline

  if (hasOverline && hasSupporting) {
    return 3
  }
  if (hasSupporting) {
    return 2
  }
  return 1
})

const clamped = computed(() => props.lines !== 'auto')

// A clamped line keeps its full text reachable (CT-02). Slotted content is the
// consumer's to label.
const clampTitle = (text: string, slotted: boolean) => (clamped.value && !slotted && text) || undefined

const rowClasses = computed(() => ({
  'ui-list-item--interactive': isInteractive.value,
  'ui-list-item--disabled': props.disabled,
  'ui-list-item--selected': Boolean(props.selected),
  'ui-list-item--clamped': clamped.value,
  [`ui-list-item--lines-${computedLines.value}`]: true,
  [`ui-list-item--density-${resolvedDensity.value}`]: true,
}))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/list/item/index' as t;
@use '#kit/assets/stylesheet/components/list/item/states' as states;

.ui-list-item {
  $t: t.$tokens;

  display: flex;
  align-items: center;
  gap: g($t, 'padding.between');
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  width: 100%;
  margin: 0;
  padding-block: g($t, 'padding.top') g($t, 'padding.bottom');
  padding-inline: g($t, 'padding.leading') g($t, 'padding.trailing');
  border: none;
  border-radius: g($t, 'container.shape');
  outline: none;
  background-color: g($t, 'container.color');
  color: g($t, 'label.text.color');
  text-align: start;
  text-decoration: none;
  overflow-wrap: anywhere;

  // The corner is left out: a selected row takes its shape at once (S3).
  transition:
    background-color g($t, 'motion.duration') g($t, 'motion.easing'),
    color g($t, 'motion.duration') g($t, 'motion.easing');

  // State layer in the row's own content colour (craft.md, «Подмена фона»).
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background-color: currentcolor;
    opacity: 0;
    pointer-events: none;
    transition: opacity g($t, 'motion.duration') g($t, 'motion.easing');
  }

  // Line count decides the shape of the row; density decides how tall that
  // shape is drawn. Emitted as one matrix so a density can never be
  // half-applied by a branch someone forgot to add.
  @each $d in compact, default, comfortable {
    @each $line, $key in (1: one, 2: two, 3: three) {
      &--density-#{$d}.ui-list-item--lines-#{$line} {
        min-height: g($t, 'density.#{$d}.height.#{$key}');
      }
    }
  }

  &--lines-3 {
    align-items: flex-start;

    &.ui-list-item--clamped .ui-list-item__supporting {
      -webkit-line-clamp: 2;
    }
  }

  // An explicit line count holds the row at that many lines; `auto` wraps.
  &--clamped {
    .ui-list-item__overline,
    .ui-list-item__headline,
    .ui-list-item__supporting {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
    }
  }

  &--interactive {
    cursor: pointer;

    @include can-hover {
      &:hover::before {
        opacity: g($t, 'state.hover');
      }
    }

    &:focus-visible {
      @include focus-ring(inset);

      &::before {
        opacity: g($t, 'state.focus');
      }
    }
  }

  &__leading {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'leading.icon.size');
    color: g($t, 'leading.icon.color');
    font-size: g($t, 'leading.icon.size');

    img {
      width: g($t, 'leading.image.width');
      height: g($t, 'leading.image.height');
      border-radius: g($t, 'leading.image.shape');
      object-fit: cover;
    }

    video {
      width: g($t, 'leading.video.width');
      height: g($t, 'leading.video.height');
      border-radius: g($t, 'leading.video.shape');
      object-fit: cover;
    }

    .ui-avatar {
      width: g($t, 'leading.avatar.size');
      height: g($t, 'leading.avatar.size');
      border-radius: g($t, 'leading.avatar.shape');
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__overline {
    margin-block-end: g($t, 'overline.gap');
    color: g($t, 'overline.color');

    @include apply-typography(g($t, 'overline.typography'));
  }

  &__headline {
    @include apply-typography(g($t, 'label.text.typography'));
  }

  &__supporting {
    margin-block-start: g($t, 'supporting.gap');
    color: g($t, 'supporting.text.color');

    @include apply-typography(g($t, 'supporting.text.typography'));
  }

  &__trailing {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: g($t, 'trailing.gap');
    color: g($t, 'trailing.icon.color');
    font-size: g($t, 'trailing.icon.size');
  }

  &__trailing-supporting {
    color: g($t, 'trailing.supporting.text.color');

    @include apply-typography(g($t, 'trailing.supporting.text.typography'));
  }

  @include states.selection-and-disabled($t);
}
</style>
