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
      <fieldset
        v-if="variant === 'outlined'"
        class="ui-textarea__outline"
        aria-hidden="true"
      >
        <legend
          v-if="label"
          class="ui-textarea__notch"
        >
          <span class="ui-textarea__notch-text">{{ notchText }}</span>
        </legend>
      </fieldset>

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
          :name="ICONS.error"
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
import { ICONS } from '#kit/shared/constants/icons'
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

// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)

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

  --ui-textarea-inset: #{g($t, 'container.padding.inline')};

  position: relative;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule below reads them once ──
  @each $r in sharp, small, medium, large, pill {
    &--#{$r} {
      --ui-textarea-radius: #{g($t, 'rounded.#{$r}')};
    }
  }

  // A filled box has a flat bottom, so a full radius would dome it — cap `pill`
  // at the large tier for filled only.
  &--filled.ui-textarea--pill {
    --ui-textarea-radius: #{g($t, 'rounded.large')};
  }

  &--outlined {
    --ui-textarea-inset: #{g($t, 'outlined.inset')};
  }

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
    .ui-textarea__label {
      position: absolute;
      left: var(--ui-textarea-inset);
      top: g($t, 'label.inset.top');
      z-index: 1;
      max-width: g($t, 'label.max-width');
      pointer-events: none;
      transform: scale(g($t, 'label.active.scale'));
      transform-origin: left top;
    }
  }

  // Notch: on `outlined` the raised label lands on the top border, into the gap
  // the outline's legend opens for it.
  &--label-float.ui-textarea--outlined {
    .ui-textarea__label {
      top: 0;
      transform: translateY(-50%) scale(g($t, 'label.active.scale'));
      transform-origin: left center;
    }

    .ui-textarea__notch {
      max-width: 100%;
    }
  }

  &--label-hidden .ui-textarea__label {
    @include sr-only;
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
    border-radius: var(--ui-textarea-radius);
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
    padding: g($t, 'container.padding.block') var(--ui-textarea-inset);
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
    padding-top: g($t, 'container.padding.block');
  }

  // The handle sits inside the text box, so a composer footer keeps its own row
  // and the submit action is never covered by the drag target.
  &--resizable &__body {
    padding-bottom: g($t, 'grip.body.padding.bottom');
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

  // ── outline · rendered by the outlined shape only ─────────────
  // A `<fieldset>` over the control's frame, so the browser cuts the notch: the
  // hidden `<legend>` holds the label text at the raised size, and the border
  // breaks exactly where it sits. No patch is painted behind the label, so the
  // field reads right on any surface, and the gap is correct in the
  // server-rendered HTML — nothing is measured. Its colour is the control's own
  // border colour, so every state below writes one property for both shapes.
  &__outline {
    position: absolute;
    inset: 0;
    min-width: 0;
    padding-block: 0;
    padding-inline: g($t, 'outlined.outline.padding.start') 0;
    margin: 0;
    border-width: g($t, 'container.border.width');
    border-style: solid;
    border-color: inherit;
    border-radius: inherit;
    pointer-events: none;
    transition: border-color g($t, 'state.duration') g($t, 'state.easing');
  }

  // As tall as the border it sits on, so the fieldset never shifts its top edge
  // to centre a taller legend. Its width is the only thing that matters.
  &__notch {
    display: block;
    width: auto;
    max-width: 0.01rem;
    height: g($t, 'container.border.width');
    padding: 0;
    overflow: hidden;
    visibility: hidden;
    white-space: nowrap;

    @include typescale(g($t, 'typography.label'));
  }

  &__notch-text {
    display: inline-block;
    padding-inline: g($t, 'outlined.notch.padding.inline');
    font-size: g($t, 'outlined.notch.font-size');
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

    @include can-hover {
      &:hover {
        background-color: g($t, 'grip.hover.color');

        &::before {
          opacity: g($t, 'layer.hover');
        }
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
    min-height: g($t, 'growth.min-height');
    transition: height g($t, 'state.grow.duration') g($t, 'state.grow.easing');
  }

  &--capped &__input {
    max-height: g($t, 'growth.max-height');
    overflow-y: auto;
  }

  &--resizing &__input {
    transition: none;
  }

  // ── shapes · base → hover → focused → error → disabled ──
  // Hover and focus answer an editable field only. `:where()` gates them on
  // `--interactive` without adding weight, so every state rule in a shape
  // carries the same weight and the later one wins.
  &--filled {
    .ui-textarea__control {
      border-color: transparent;
      border-bottom-color: g($t, 'filled.border.color');
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
      background-color: g($t, 'filled.surface');
    }

    // `filled` sits on the highest surface already — there is no tone above
    // it, so the footer's step is a state layer over the container instead.
    .ui-textarea__footer {
      background-color: g($t, 'footer.filled.surface');
    }

    @include can-hover {
      &:where(.ui-textarea--interactive) .ui-textarea__control:hover {
        border-bottom-color: g($t, 'filled.hover.border.color');
      }
    }

    &.ui-textarea--focused:where(.ui-textarea--interactive) .ui-textarea__control {
      border-bottom-color: g($t, 'focused.border.color');
    }

    &.ui-textarea--error .ui-textarea__control {
      border-bottom-color: g($t, 'error.border.color');
    }

    &.ui-textarea--disabled .ui-textarea__control {
      border-bottom-color: g($t, 'disabled.border.color');
      background-color: g($t, 'filled.disabled.surface');
    }
  }

  &--outlined {
    .ui-textarea__control {
      padding: g($t, 'outlined.frame');
      border-width: 0;
    }

    @include can-hover {
      &:where(.ui-textarea--interactive) .ui-textarea__control:hover {
        border-color: g($t, 'outlined.hover.border.color');
      }
    }

    &.ui-textarea--focused:where(.ui-textarea--interactive) .ui-textarea__control {
      border-color: g($t, 'focused.border.color');
    }

    &.ui-textarea--error .ui-textarea__control {
      border-color: g($t, 'error.border.color');
    }

    &.ui-textarea--disabled .ui-textarea__control {
      border-color: g($t, 'disabled.border.color');
      background-color: g($t, 'disabled.surface');
    }
  }

  // The state layer comes up on hover in every shape.
  @include can-hover {
    &--interactive .ui-textarea__control:hover::before {
      opacity: g($t, 'layer.hover');
    }
  }

  // ── content · the same ink in every shape, states ascending ──
  &--focused:where(.ui-textarea--interactive) .ui-textarea__label {
    color: g($t, 'focused.label.color');
  }

  &--error {
    .ui-textarea__label,
    .ui-textarea__support {
      color: g($t, 'error.color');
    }
  }

  // ── disabled · the surface recedes and nothing responds ──
  &--disabled {
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
  }

  // ── read-only · the container stays, the interaction does not ──
  &--readonly {
    .ui-textarea__body,
    .ui-textarea__grip {
      cursor: default;
    }
  }

  // Motion is feedback only: colour, and the height of a growing box. Nothing
  // in the field moves position, so there is nothing else to switch off here.
  @media (prefers-reduced-motion: reduce) {
    &__control,
    &__control::before,
    &__outline,
    &__grip,
    &__grip::before,
    &__input {
      transition: none;
    }
  }
}
</style>
