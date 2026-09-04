<template>
  <div :class="rootClasses">
    <label
      v-if="label"
      v-bind="labelAttrs"
      class="ui-textarea__label"
    >
      {{ label }}

      <span
        v-if="required"
        class="ui-textarea__required"
        aria-hidden="true"
      >*</span>
    </label>

    <div class="ui-textarea__control">
      <div
        class="ui-textarea__body"
        @pointerdown="focusFromBox"
      >
        <span
          v-if="$slots.prepend"
          class="ui-textarea__adornment ui-textarea__adornment--prepend"
        >
          <slot name="prepend" />
        </span>

        <textarea
          ref="element"
          v-model="modelValue"
          v-bind="inputAttrs"
          class="ui-textarea__input"
        />

        <span
          v-if="$slots.append"
          class="ui-textarea__adornment ui-textarea__adornment--append"
        >
          <slot name="append" />
        </span>

        <span
          v-if="resizable"
          v-bind="gripAttrs"
          class="ui-textarea__grip"
        />
      </div>

      <slot name="footer" />
    </div>

    <div class="ui-textarea__support">
      <p
        v-bind="supportAttrs"
        class="ui-textarea__message"
      >
        <MIcon
          v-if="isError && !$slots.error"
          name="round-error"
          class="ui-textarea__message-icon"
          aria-hidden="true"
        />

        <slot
          v-if="isError && $slots.error"
          name="error"
          :message="message"
        />
        <slot
          v-else-if="!isError && $slots.helper"
          name="helper"
          :message="message"
        />
        <template v-else>
          {{ message }}
        </template>
      </p>

      <span
        v-if="counter"
        v-bind="counterAttrs"
        class="ui-textarea__counter"
      >
        <slot
          name="counter"
          v-bind="counter"
        >
          {{ counter.text }}
        </slot>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { textareaFieldStateKey, useTextareaControl } from '#kit/composables/textarea/useTextareaControl'
import { mTextareaProps } from './props'

const props = defineProps(mTextareaProps)
const slots = useSlots()

const modelValue = defineModel<string>({ default: '' })
const focusedModel = defineModel<boolean>('focused', { default: false })

const {
  element,
  isFocused,
  isPopulated,
  isError,
  message,
  counter,
  fieldState,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  counterAttrs,
  gripAttrs,
  isResizing,
} = useTextareaControl(modelValue, focusedModel, props)

// Anything rendered inside the container — the footer and its actions — goes
// inert with the field instead of staying live inside a dead box.
provide(textareaFieldStateKey, fieldState)

const rootClasses = computed(() => [
  'ui-textarea',
  `ui-textarea--${props.variant}`,
  `ui-textarea--${props.rounded}`,
  `ui-textarea--label-${props.labelPlacement}`,
  {
    'ui-textarea--interactive': !props.disabled && !props.readonly,
    'ui-textarea--focused': isFocused.value,
    'ui-textarea--populated': isPopulated.value,
    'ui-textarea--error': isError.value,
    'ui-textarea--disabled': props.disabled,
    'ui-textarea--readonly': props.readonly,
    'ui-textarea--auto-grow': props.autoGrow,
    'ui-textarea--capped': props.maxRows !== undefined,
    'ui-textarea--resizable': props.resizable,
    'ui-textarea--resizing': isResizing.value,
    'ui-textarea--composer': Boolean(slots.footer),
  },
])

// Only a press on the padding itself focuses the control; anything with its own
// target — the textarea, the grip, an adornment's button — handles its own.
function focusFromBox(event: PointerEvent) {
  if (event.target !== event.currentTarget) {
    return
  }

  event.preventDefault()
  element.value?.focus()
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/textarea' as t;

.ui-textarea {
  $t: material-map(t.$tokens, 'm-textarea');
  $pad-block: g($t, 'container.padding.block');
  $pad-inline: g($t, 'container.padding.inline');

  position: relative;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── label · base is `top`, a block above the box ──
  &__label {
    min-width: 0;
    overflow: hidden;
    color: g($t, 'label.color');
    text-overflow: ellipsis;
    white-space: nowrap;

    @include typescale(g($t, 'typography.label'));
  }

  // ── label placement · an axis of its own, independent of the shape ──
  // A multi-line box has no free first line, so an overlaid label never rests
  // over the value the way it does in a text field: it is raised from the
  // start. `float` and `inset` therefore differ only on `outlined`, where one
  // notches the top border and the other sits inside it.
  &--label-float,
  &--label-inset {
    > .ui-textarea__label {
      position: absolute;
      left: $pad-inline;
      top: g($t, 'label.inset.top');
      z-index: 1;
      max-width: calc(100% - 32rem);
      pointer-events: none;
      transform: scale(g($t, 'label.active.scale'));
      transform-origin: left top;
    }
  }

  // Notch: on `outlined` the raised label lands on the top border, with a
  // surface patch behind it so the outline reads as notched, not crossed out.
  &--label-float.ui-textarea--outlined > &__label {
    top: 0;
    padding-inline: g($t, 'label.notch.padding.inline');
    background-color: g($t, 'label.notch.surface');
    margin-left: g($t, 'label.notch.margin.left');
    transform: translateY(-50%) scale(g($t, 'label.active.scale'));
    transform-origin: left center;
  }

  &__required {
    color: g($t, 'label.required.color');
  }

  // ── container · owns the border and the surface ──
  &__control {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;

    // Contains the state layer below, so a negative z-index cannot slip behind
    // an ancestor's background.
    isolation: isolate;
    overflow: hidden;
    border: g($t, 'container.border.width') solid g($t, 'container.border.color');
    background-color: g($t, 'container.surface');
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing');

    // MD3 state layer: the element's own ink at a fixed opacity, painted over
    // the surface and under the value. One layer replaces the pre-mixed hover
    // colours the shapes used to carry one each — and unlike a mixed colour it
    // also works over a transparent container.
    &::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      background-color: g($t, 'input.color');
      content: '';
      opacity: 0;
      pointer-events: none;
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }
  }

  &__body {
    position: relative;
    display: flex;
    flex: 1;
    align-items: flex-start;
    gap: g($t, 'adornment.gap');
    min-width: 0;
    padding: $pad-block $pad-inline;
    cursor: text;
  }

  // Everything that shifts that padding lives right below it — the label
  // placements and the drag handle both do, and they must not fight over
  // source order.

  // The value has to start below a label that sits inside the box — unless the
  // label went onto the border instead, where it takes no room.
  &--label-float &__body,
  &--label-inset &__body {
    padding-top: g($t, 'label.inset.body-padding');
  }

  &--label-float.ui-textarea--outlined &__body {
    padding-top: $pad-block;
  }

  // The handle sits inside the text box, so a composer footer keeps its own row
  // and the submit action is never covered by the drag target.
  &--resizable &__body {
    padding-bottom: calc(#{$pad-block} + #{g($t, 'grip.band')});
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    outline: none;
    background-color: transparent;
    color: g($t, 'input.color');
    line-height: g($t, 'input.line-height');
    resize: none;

    @include typescale(g($t, 'typography.input'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
    }
  }

  &__adornment {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    color: g($t, 'adornment.color');
    font-size: g($t, 'adornment.size');
    line-height: g($t, 'input.line-height');

    &--append {
      align-self: flex-end;
    }
  }

  // ── drag handle · centred on the bottom edge, keyboard-operable ──
  // A bar, not the native corner glyph: Material has no resize corner, and at
  // 10rem the old mark was too small to find or to focus visibly.
  &__grip {
    position: absolute;
    left: 50%;
    bottom: g($t, 'grip.inset');
    width: g($t, 'grip.width');
    height: g($t, 'grip.height');
    border-radius: g($t, 'rounded.pill');
    background-color: g($t, 'grip.color');
    cursor: ns-resize;
    touch-action: none;
    transform: translateX(-50%);
    transition: background-color g($t, 'state.duration') g($t, 'state.easing');

    // The bar is the mark; the target is the band around it. Pointer and touch
    // both aim at 72×16, not at the 5rem the eye sees.
    &::before {
      position: absolute;
      left: 50%;
      top: 50%;
      width: g($t, 'grip.hit.width');
      height: g($t, 'grip.hit.height');
      border-radius: g($t, 'rounded.pill');
      background-color: currentcolor;
      content: '';
      opacity: 0;
      transform: translate(-50%, -50%);
      transition: opacity g($t, 'state.duration') g($t, 'state.easing');
    }

    &:hover {
      background-color: g($t, 'grip.hover.color');

      &::before {
        opacity: g($t, 'layer.hover');
      }
    }

    // Focus is colour here, as everywhere else in this family. On a bar that
    // wide the hue carries on its own, so the ring the corner mark needed is
    // gone with it.
    &:focus-visible {
      outline: none;
      background-color: g($t, 'grip.focus.color');
    }
  }

  // ── support row · message left, counter right, height reserved ──
  &__support {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: g($t, 'support.gap');
    min-height: g($t, 'support.min-height');
    padding-inline: g($t, 'support.padding.inline');
    margin-top: g($t, 'support.margin.top');
    color: g($t, 'support.color');

    @include typescale(g($t, 'typography.support'));
  }

  &__message {
    display: flex;
    align-items: center;
    gap: g($t, 'support.icon.gap');
    min-width: 0;
    margin: 0;
  }

  // Validity has to survive without colour (WCAG 1.4.1), and an `error` with no
  // message has nothing but this glyph to say it.
  &__message-icon {
    flex: 0 0 auto;
    font-size: g($t, 'support.icon.size');
  }

  &__counter {
    flex: 0 0 auto;
    color: g($t, 'counter.color');
    font-variant-numeric: tabular-nums;
  }

  // ── growth · one mechanism per browser, never two ──
  &--auto-grow &__input {
    field-sizing: content;
    min-height: calc(var(--m-textarea-rows, #{g($t, 'input.rows')}) * 1lh + #{$pad-block} * 2);
    transition: height g($t, 'state.grow.duration') g($t, 'state.grow.easing');
  }

  &--capped &__input {
    max-height: calc(var(--m-textarea-max-rows) * 1lh + #{$pad-block} * 2);
    overflow-y: auto;
  }

  &--resizing &__input {
    transition: none;
  }

  // `filled` sits on the highest surface already — there is no tone above it,
  // so the footer's step is a state layer over the container instead.
  &--filled &__footer {
    background-color: g($t, 'footer.filled.surface');
  }

  // ── shape · filled ──
  &--filled &__control {
    border-color: transparent;
    border-bottom-color: g($t, 'filled.border.color');
    background-color: g($t, 'filled.surface');
  }

  // ── hover · the border tone moves, and the state layer comes up ──
  &--interactive {
    .ui-textarea__control:hover {
      border-color: g($t, 'outlined.hover.border.color');

      &::before {
        opacity: g($t, 'layer.hover');
      }
    }

    &.ui-textarea--filled .ui-textarea__control:hover {
      border-color: transparent;
      border-bottom-color: g($t, 'filled.hover.border.color');
    }
  }

  // ── focus · the border hue moves, and nothing else ──
  &--focused:not(.ui-textarea--readonly) {
    .ui-textarea__control {
      border-color: g($t, 'focused.border.color');
    }

    .ui-textarea__label {
      color: g($t, 'focused.label.color');
    }

    &.ui-textarea--filled .ui-textarea__control {
      border-color: transparent;
      border-bottom-color: g($t, 'focused.border.color');
    }
  }

  // ── validity · moves the border hue and adds a glyph ──
  &--error {
    .ui-textarea__control {
      border-color: g($t, 'error.border.color');
    }

    .ui-textarea__label,
    .ui-textarea__support {
      color: g($t, 'error.color');
    }

    &.ui-textarea--filled .ui-textarea__control {
      border-color: transparent;
      border-bottom-color: g($t, 'error.border.color');
    }
  }

  // ── disabled · the surface recedes and nothing responds ──
  &--disabled {
    .ui-textarea__control {
      border-color: g($t, 'disabled.border.color');
      background-color: g($t, 'disabled.surface');
    }

    .ui-textarea__body,
    .ui-textarea__grip {
      cursor: default;
    }

    .ui-textarea__label,
    .ui-textarea__support,
    .ui-textarea__adornment,
    .ui-textarea__input,
    .ui-textarea__counter {
      color: g($t, 'disabled.color');
    }

    .ui-textarea__grip {
      border-color: g($t, 'disabled.color');
    }

    &.ui-textarea--filled .ui-textarea__control {
      border-color: transparent;
      border-bottom-color: g($t, 'disabled.border.color');
      background-color: g($t, 'filled.disabled.surface');
    }
  }

  // ── read-only · the container stays, the interaction does not ──
  &--readonly {
    .ui-textarea__body,
    .ui-textarea__grip {
      cursor: default;
    }
  }

  &--label-hidden > &__label {
    position: absolute;
    width: 1rem;
    height: 1rem;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  // ── corner radius (rounded prop) · pulled from the shape scale ──
  // filled keeps a flat bottom (MD3), so its top corners carry the tier alone.
  @each $r in sharp, small, medium, large, pill {
    &--#{$r} .ui-textarea__control {
      border-radius: g($t, 'rounded.#{$r}');
    }

    &--#{$r}.ui-textarea--filled .ui-textarea__control {
      border-radius: g($t, 'rounded.#{$r}') g($t, 'rounded.#{$r}') 0 0;
    }
  }

  // A filled box has a flat bottom, so a full radius would dome it — cap `pill`
  // at the large tier for filled only.
  &--pill.ui-textarea--filled .ui-textarea__control {
    border-radius: g($t, 'rounded.large') g($t, 'rounded.large') 0 0;
  }

  // Motion is feedback only: colour, and the height of a growing box. Nothing
  // in the field moves position, so there is nothing else to switch off here.
  @media (prefers-reduced-motion: reduce) {
    &__control,
    &__control::before,
    &__grip,
    &__grip::before,
    &__input {
      transition: none;
    }
  }
}
</style>
