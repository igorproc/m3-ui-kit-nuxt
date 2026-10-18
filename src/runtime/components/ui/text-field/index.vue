<template>
  <div
    v-bind="rootAttrs()"
    class="ui-text-field"
    :class="rootClasses"
  >
    <label
      v-if="label"
      v-bind="labelAttrs"
      class="ui-text-field__label"
    >
      {{ label }}

      <span
        v-if="required"
        class="ui-text-field__required"
        aria-hidden="true"
      >*</span>
    </label>

    <div
      ref="controlRef"
      class="ui-text-field__control"
    >
      <fieldset
        v-if="variant === 'outlined'"
        class="ui-text-field__outline"
        aria-hidden="true"
      >
        <legend
          v-if="label"
          class="ui-text-field__notch"
        >
          <span class="ui-text-field__notch-text">{{ notchText }}</span>
        </legend>
      </fieldset>

      <span
        v-if="hasPrepend"
        class="ui-text-field__icon ui-text-field__icon--prepend"
      >
        <slot name="prepend" />
      </span>

      <div
        v-if="hasRow"
        class="ui-text-field__field ui-text-field__row"
      >
        <span
          v-if="$slots['leading-content']"
          class="ui-text-field__leading"
        >
          <slot name="leading-content" />
        </span>

        <span
          v-if="prefix"
          v-bind="prefixAttrs"
          class="ui-text-field__affix ui-text-field__affix--prefix"
        >{{ prefix }}</span>

        <input
          ref="inputRef"
          v-model="modelValue"
          v-bind="inputBindings()"
          class="ui-text-field__input"
        >

        <span
          v-if="suffix"
          v-bind="suffixAttrs"
          class="ui-text-field__affix ui-text-field__affix--suffix"
        >{{ suffix }}</span>
      </div>

      <input
        v-else
        ref="inputRef"
        v-model="modelValue"
        v-bind="inputBindings()"
        class="ui-text-field__input ui-text-field__row"
      >

      <span
        v-if="hasAppend"
        class="ui-text-field__icon ui-text-field__icon--append"
      >
        <slot name="append" />
      </span>
    </div>

    <!-- Always rendered: the line keeps its height, and the alert region exists
         before an error is written into it, so the first one is announced. -->
    <p
      v-bind="supportAttrs"
      class="ui-text-field__support"
      :class="isError ? 'ui-text-field__support--error' : 'ui-text-field__support--helper'"
    >
      <MIcon
        v-if="isError && !$slots.error"
        :name="ICONS.error"
        class="ui-text-field__support-icon"
        aria-hidden="true"
      />

      <span
        v-bind="alertAttrs"
        class="ui-text-field__alert"
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
  </div>
</template>

<script setup lang="ts">
import { mergeProps } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { mTextFieldProps } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useFieldShape } from '#kit/components/ui/text-field/useFieldShape'
import { useTextFieldControl } from '#kit/composables/text-field/useTextFieldControl'
import { useRetiredPropWarning, useRetiredValueWarning } from '#kit/composables/button/useRetiredValueWarning'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mTextFieldProps)
const slots = useSlots()

const controlRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const modelValue = defineModel<string>({ default: '' })
const isFocused = defineModel<boolean>('focused', { default: false })

const {
  isError,
  message,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  alertAttrs,
  prefixAttrs,
  suffixAttrs,
} = useTextFieldControl(modelValue, isFocused, props)

const shape = useFieldShape('m-text-field', props)
useRetiredValueWarning('m-text-field', 'type', () => props.type, { number: '`<MNumberInput>`' })
useRetiredPropWarning('m-text-field', 'populated', () => props.populated, 'nothing — the label no longer moves')

const hasPrepend = computed(() => Boolean(slots.prepend))
const hasAppend = computed(() => Boolean(slots.append))
const hasRow = computed(() => Boolean(slots['leading-content'] || props.prefix || props.suffix))

// The notch is sized by this copy of the label, so it carries the asterisk too.
const notchText = computed(() => props.required ? `${props.label} *` : props.label)

const rootClasses = computed(() => [
  `ui-text-field--${props.variant}`,
  `ui-text-field--shape-${shape.value}`,
  `ui-text-field--label-${props.labelPlacement}`,
  `ui-text-field--density-${props.density}`,
  {
    'ui-text-field--focused': isFocused.value,
    'ui-text-field--error': isError.value,
    'ui-text-field--disabled': props.disabled,
    'ui-text-field--prepend': hasPrepend.value,
    'ui-text-field--append': hasAppend.value,
  },
])

// A composite's bag (`inputAttrs`) merges under the field's own, and the
// consumer's fallthrough under both: the field's own values win a clash,
// listeners from all three are chained. Called from the template, because
// fallthrough attributes are current on every render but not reactive.
const inputBindings = () => controlAttrs(mergeProps({ ...props.inputAttrs }, inputAttrs.value))

/**
 * The two boxes a composite field needs to reach: `control` is the drawn
 * container — what a popover anchors to, since the support line sits outside it
 * — and `input` is where focus belongs.
 */
defineExpose({ control: controlRef, input: inputRef })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/text-field' as t;
@use '#kit/assets/stylesheet/components/text-field/label' as label;
@use '#kit/assets/stylesheet/components/text-field/states' as states;

.ui-text-field {
  $t: material-map(t.$tokens, 'm-text-field');

  --ui-text-field-inset: #{g($t, 'container.padding.inline')};

  // The physical side the label scales from: transform-origin has no logical
  // keyword, so the writing direction picks it here.
  --ui-text-field-start: left;

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: g($t, 'container.gap');
  min-width: 0;

  // ── axes · a modifier only picks values; every rule reads them once ──
  @each $d in compact, default, comfortable {
    &--density-#{$d} {
      --ui-text-field-height: #{g($t, 'density.#{$d}.height')};
      --ui-text-field-label-top: #{g($t, 'density.#{$d}.label.top')};
      --ui-text-field-label-raised-inside: #{g($t, 'density.#{$d}.label.transform.inside')};
      --ui-text-field-label-raised-notch: #{g($t, 'density.#{$d}.label.transform.notch')};
      --ui-text-field-input-padding-top: #{g($t, 'density.#{$d}.input.padding.top')};
      --ui-text-field-input-padding-bottom: #{g($t, 'density.#{$d}.input.padding.bottom')};
    }
  }

  @each $shape in none, extra-small, medium, large, full {
    &--shape-#{$shape} {
      --ui-text-field-radius: #{g($t, 'shape.#{$shape}')};
    }
  }

  // A filled box has a flat bottom, so a full-radius top would dome it on a short
  // field — cap `full` at the large tier for filled only.
  &--filled#{&}--shape-full {
    --ui-text-field-radius: #{g($t, 'shape.large')};
  }

  &--outlined {
    --ui-text-field-inset: #{g($t, 'outlined.inset')};
  }

  &:dir(rtl) {
    --ui-text-field-start: right;
  }

  @include label.label($t);

  &__control {
    position: relative;

    // Contains the filled state layer, so its negative z-index cannot slip
    // behind an ancestor's background.
    isolation: isolate;
    display: flex;
    align-items: center;
    min-height: var(--ui-text-field-height);
    padding-inline: var(--ui-text-field-inset);
    border: g($t, 'container.border.width') solid transparent;
    border-radius: var(--ui-text-field-radius);
    transition:
      border-color g($t, 'state.duration') g($t, 'state.easing'),
      background-color g($t, 'state.duration') g($t, 'state.easing');
  }

  &--prepend .ui-text-field__control {
    padding-inline-start: g($t, 'container.padding.prepend');
  }

  &--append .ui-text-field__control {
    padding-inline-end: g($t, 'container.padding.append');
  }

  &__input {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    outline: none;
    background-color: transparent;
    color: g($t, 'input.color');
    caret-color: g($t, 'input.caret.color');

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

  // Composite input row: inline content (chips), affixes and the native input
  // on one scrolling row. Spacing is per part, not a flex gap: an affix hugs
  // the value closer than the chips do.
  &__field {
    display: flex;
    flex: 1;
    flex-wrap: nowrap;
    align-items: center;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .ui-text-field__input {
      flex: 1 0 g($t, 'container.field.input-min-width');
      width: auto;
    }
  }

  // Holds the consumer's inline content (chips) at its natural width, so it
  // never shrinks under the input.
  &__leading {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: g($t, 'container.field.gap');
    margin-inline-end: g($t, 'container.field.gap');
  }

  &__affix {
    flex: 0 0 auto;
    color: g($t, 'affix.color');
    white-space: nowrap;

    @include typescale(g($t, 'typography.affix'));

    &--prefix {
      margin-inline-end: g($t, 'affix.gap');
    }

    &--suffix {
      margin-inline-start: g($t, 'affix.gap');
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: g($t, 'icon.width');
    color: g($t, 'icon.color');
    font-size: g($t, 'icon.size');
    transition: color g($t, 'state.duration') g($t, 'state.easing');

    &--prepend {
      margin-inline-end: g($t, 'icon.prepend.margin');
    }

    &--append {
      margin-inline-start: g($t, 'icon.append.margin');
    }
  }

  // ── support line · reserved height so valid ⇄ invalid never reflows ──
  &__support {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: g($t, 'support.min-height');
    padding-inline: g($t, 'support.padding.inline');
    margin-top: g($t, 'support.margin.top');

    // A URL or an address in a message has no break opportunity of its own.
    overflow-wrap: anywhere;

    @include typescale(g($t, 'typography.support'));

    &--helper {
      color: g($t, 'support.color');
    }

    &--error {
      color: g($t, 'error.color');
    }
  }

  // Validity has to survive without colour (WCAG 1.4.1), and an `error` with no
  // message has nothing but this glyph to say it. A margin, not a flex gap: the
  // alert region beside it is empty whenever the helper is shown.
  &__support-icon {
    flex: 0 0 auto;
    margin-inline-end: g($t, 'support.icon.gap');
    font-size: g($t, 'support.icon.size');
  }

  &__alert {
    min-width: 0;
  }

  @include states.states($t);
}
</style>
