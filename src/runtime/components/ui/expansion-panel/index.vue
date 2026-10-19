<template>
  <div
    v-bind="rootAttrs()"
    class="ui-expansion-panel"
    :class="{
      'ui-expansion-panel--expanded': isOpen,
      'ui-expansion-panel--disabled': disabled,
      'ui-expansion-panel--grouped': isGrouped,
    }"
  >
    <OptionalHeading
      :tag="headingTag"
      class="ui-expansion-panel__heading"
    >
      <button
        v-bind="controlAttrs(buttonAttrs)"
        class="ui-expansion-panel__header"
        :class="{ 'ui-expansion-panel__header--locked': isLocked }"
      >
        <span class="ui-expansion-panel__header-content">
          <slot name="header">
            <span class="ui-expansion-panel__title">{{ title }}</span>
            <span
              v-if="description"
              class="ui-expansion-panel__description"
            >
              {{ description }}
            </span>
          </slot>
        </span>

        <span class="ui-expansion-panel__trailing">
          <slot
            name="trailing"
            :expanded="isOpen"
          >
            <MIcon
              class="ui-expansion-panel__chevron"
              :name="ICONS.keyboardArrowDown"
            />
          </slot>
        </span>
      </button>
    </OptionalHeading>

    <div
      v-bind="regionAttrs"
      class="ui-expansion-panel__content-wrapper"
    >
      <div class="ui-expansion-panel__content-inner">
        <div class="ui-expansion-panel__content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAttrs, watchEffect } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useExpansionPanelControl } from '#kit/composables/expansion-panel/useExpansionPanelControl'
import { OptionalHeading } from './heading'
import { mExpansionPanelProps } from './props'
import type { MExpansionPanelSlots } from './props'

// The root is a container; `id`, `aria-*` and listeners belong on the header button.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mExpansionPanelProps)
const slots = defineSlots<MExpansionPanelSlots>()
const attrs = useAttrs()

const modelValue = defineModel<boolean>({ default: false })

const { isOpen, isLocked, isGrouped, headingTag, buttonAttrs, regionAttrs } = useExpansionPanelControl(modelValue, props, {
  id: typeof attrs.id === 'string' ? attrs.id : undefined,
})

// No default name: copy the kit would invent cannot be in the app's language.
if (import.meta.dev) {
  watchEffect(() => {
    if (props.title || slots.header || attrs['aria-label'] || attrs['aria-labelledby']) return

    console.warn('[m-expansion-panel] has no accessible name: pass `title` or the `#header` slot.')
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/expansion-panel/index' as panel;

$t: panel.$tokens;

.ui-expansion-panel {
  display: flex;
  flex-direction: column;
  background-color: g($t, 'container.color.rest');
  border-radius: g($t, 'container.shape');

  // Rounds the header's state layer and the content to the panel's corners.
  // `clip` rather than `hidden`: the panel is no scroll container, so nothing
  // focused or scrolled to inside it can shift its content.
  overflow: clip;

  // Durations are motion tokens, which the global reduced-motion rule
  // shortens (`base/_animations.scss`); the panel needs no media query of its own.
  transition:
    background-color g($t, 'motion.state') g($t, 'motion.easing'),
    box-shadow g($t, 'motion.state') g($t, 'motion.easing');

  &__heading {
    margin: 0;
    border-radius: inherit;
    font: inherit;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    isolation: isolate;
    gap: g($t, 'header.gap');
    width: 100%;
    min-height: g($t, 'header.min-height');
    padding-block: g($t, 'header.padding.block');
    padding-inline: g($t, 'header.padding.inline');
    border: none;
    border-radius: inherit;
    outline: none;
    background: transparent;
    color: g($t, 'title.color');
    text-align: start;
    cursor: pointer;

    // State layer in the header's own content colour (craft.md, «Подмена фона»).
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background-color: currentcolor;
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'motion.state') g($t, 'motion.easing');
    }

    // A locked header (the open panel of a mandatory group) does nothing when
    // pressed, so it offers no hover or pressed feedback; focus still shows.
    @include can-hover {
      &:hover:not(:disabled, .ui-expansion-panel__header--locked)::before {
        opacity: g($t, 'state.hover');
      }
    }

    // Inset: the root clips, and an outer ring would lose three of its sides.
    // `:not(:disabled)` matches the hover rule's weight, so a hovered header
    // under keyboard focus shows the focus layer, not the lighter hover one.
    &:focus-visible {
      @include focus-ring(inset);

      &:not(:disabled)::before {
        opacity: g($t, 'state.focus');
      }
    }

    &:active:not(:disabled, .ui-expansion-panel__header--locked)::before {
      opacity: g($t, 'state.pressed');
    }

    &--locked {
      cursor: default;
    }

    &:disabled {
      color: g($t, 'disabled.title.color');
      cursor: default;
    }
  }

  &__header-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: g($t, 'header.content.gap');
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &__title {
    color: g($t, 'title.color');

    @include typescale(g($t, 'title.typescale'));
  }

  &__description {
    color: g($t, 'description.color');

    @include typescale(g($t, 'description.typescale'));
  }

  &__trailing {
    display: flex;
    align-items: center;
    justify-content: center;
    color: g($t, 'trailing.color.rest');
    font-size: g($t, 'trailing.size');
  }

  // Only the default chevron turns: content passed to `#trailing` keeps its orientation.
  &__chevron {
    transition: transform g($t, 'motion.state') g($t, 'motion.easing');
  }

  // Height animates through the grid row (0fr → 1fr); the inner box clips it.
  &__content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows g($t, 'motion.expand') g($t, 'motion.easing');
  }

  // `hidden`, not `clip`: only a scroll container lets the grid row shrink to 0.
  &__content-inner {
    overflow: hidden;
  }

  // `break-word`, not `anywhere`: it is inherited by the slotted content, and
  // `anywhere` would also shrink the min-content width of a table placed here.
  &__content {
    padding-block: 0 g($t, 'content.padding.block-end');
    padding-inline: g($t, 'content.padding.inline');
    color: g($t, 'content.color');
    opacity: 0;
    overflow-wrap: break-word;
    transition: opacity g($t, 'motion.state') g($t, 'motion.easing');

    @include typescale(g($t, 'content.typescale'));
  }

  &--expanded {
    background-color: g($t, 'container.color.expanded');
    box-shadow: g($t, 'container.elevation.expanded');

    // Meets its content square, so the state layer keeps the header's full width.
    .ui-expansion-panel__header {
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }

    .ui-expansion-panel__trailing {
      color: g($t, 'trailing.color.expanded');
    }

    .ui-expansion-panel__chevron {
      transform: rotate(180deg);
    }

    .ui-expansion-panel__content {
      opacity: 1;

      &-wrapper {
        grid-template-rows: 1fr;
      }
    }
  }

  // Static corners: neighbours meet small and the group is rounded at its ends,
  // with no shape change as panels open or close. The modifier, not a child
  // combinator: the panel knows it is grouped from the group's context.
  &--grouped {
    border-radius: g($t, 'group.shape.inner');

    &:first-child {
      border-start-start-radius: g($t, 'group.shape.outer');
      border-start-end-radius: g($t, 'group.shape.outer');
    }

    &:last-child {
      border-end-start-radius: g($t, 'group.shape.outer');
      border-end-end-radius: g($t, 'group.shape.outer');
    }
  }

  // After `--expanded`: an open disabled panel still dims its chevron.
  &--disabled {
    .ui-expansion-panel__title {
      color: g($t, 'disabled.title.color');
    }

    .ui-expansion-panel__description {
      color: g($t, 'disabled.description.color');
    }

    .ui-expansion-panel__trailing {
      color: g($t, 'disabled.icon.color');
    }
  }

  @include forced-colors {
    // The open panel is lifted only by tone and shadow, both dropped by forced
    // colors; an edge keeps its content visibly attached to its header.
    &--expanded {
      outline: 1px solid CanvasText;
      outline-offset: -1px;
    }

    &__header:focus-visible {
      outline-color: Highlight;
    }

    &--disabled .ui-expansion-panel__header,
    &--disabled .ui-expansion-panel__title,
    &--disabled .ui-expansion-panel__description,
    &--disabled .ui-expansion-panel__trailing {
      color: GrayText;
    }
  }
}
</style>
