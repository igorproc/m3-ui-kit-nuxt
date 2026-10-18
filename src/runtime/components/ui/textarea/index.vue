<template>
  <div
    v-bind="rootAttrs()"
    :class="rootClasses"
  >
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
          v-bind="controlAttrs(inputAttrs)"
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

        <!-- Mounted whether or not there is an error: a region that appears
             together with its text is not reliably announced. -->
        <span
          v-bind="alertAttrs"
          class="ui-textarea__alert"
        >
          <slot
            v-if="isError"
            name="error"
            :message="message"
          >
            {{ message }}
          </slot>
        </span>

        <slot
          v-if="!isError"
          name="helper"
          :message="message"
        >
          {{ message }}
        </slot>
      </p>

      <template v-if="counter">
        <span
          v-bind="counterAttrs"
          class="ui-textarea__counter"
          :class="{ 'ui-textarea__counter--over': counter.over }"
        >
          <slot
            name="counter"
            v-bind="counter"
          >
            {{ counter.text }}
          </slot>
        </span>

        <span
          v-bind="counterLiveAttrs"
          class="ui-textarea__counter-live"
        >{{ counterAnnouncement }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { textareaFieldStateKey, useTextareaControl } from '#kit/composables/textarea/useTextareaControl'
import { mTextareaProps } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useFieldShape } from '#kit/components/ui/text-field/useFieldShape'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

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
  counterAnnouncement,
  fieldState,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  alertAttrs,
  counterAttrs,
  counterLiveAttrs,
  gripAttrs,
  isResizing,
} = useTextareaControl(modelValue, focusedModel, props)

// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)

// Anything rendered inside the container — the footer and its actions — goes
// inert with the field instead of staying live inside a dead box.
provide(textareaFieldStateKey, fieldState)

const shape = useFieldShape('m-textarea', props)

const rootClasses = computed(() => [
  'ui-textarea',
  `ui-textarea--${props.variant}`,
  `ui-textarea--shape-${shape.value}`,
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
@use '#kit/assets/stylesheet/components/textarea/label' as label;
@use '#kit/assets/stylesheet/components/textarea/states' as states;
@use '#kit/assets/stylesheet/components/textarea/parts' as parts;

.ui-textarea {
  $t: material-map(t.$tokens, 'm-textarea');

  --ui-textarea-inset: #{g($t, 'container.padding.inline')};

  // The physical side the label scales from: transform-origin has no logical
  // keyword, so the writing direction picks it here.
  --ui-textarea-start: left;

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule below reads them once ──
  @each $shape in none, extra-small, medium, large, full {
    &--shape-#{$shape} {
      --ui-textarea-radius: #{g($t, 'shape.#{$shape}')};
    }
  }

  // A filled box has a flat bottom, so a full radius would dome it — cap `full`
  // at the large tier for filled only.
  &--filled#{&}--shape-full {
    --ui-textarea-radius: #{g($t, 'shape.large')};
  }

  &--outlined {
    --ui-textarea-inset: #{g($t, 'outlined.inset')};
  }

  &:dir(rtl) {
    --ui-textarea-start: right;
  }

  @include label.label($t);

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
    // the surface and under the value. Only `filled` raises it: `outlined` has
    // no surface in any other state, so its hover is the edge alone.
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
    caret-color: g($t, 'input.caret.color');
    line-height: g($t, 'input.line-height');
    resize: none;

    @include typescale(g($t, 'typography.input'));

    &::placeholder {
      color: g($t, 'input.placeholder.color');
    }

    // Autofill paints an !important background and text colour of its own,
    // light even in a dark theme. Clipping that background to the glyphs —
    // which the fill colour then covers — lets the container show through.
    &:autofill {
      // Safari clips to text only under the prefix.
      /* stylelint-disable-next-line property-no-vendor-prefix */
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: g($t, 'input.color');
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

  @include parts.parts($t);
  @include states.states($t);
}
</style>
