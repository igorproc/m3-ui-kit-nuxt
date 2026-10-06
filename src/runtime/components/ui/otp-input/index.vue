<template>
  <div
    v-bind="rootAttrs()"
    :class="rootClasses"
  >
    <label
      v-bind="labelAttrs"
      class="ui-otp-input__label"
    >
      <slot name="label">{{ label }}</slot>
    </label>

    <div class="ui-otp-input__visual">
      <template
        v-for="(cells, groupIndex) in groups"
        :key="groupIndex"
      >
        <span class="ui-otp-input__group">
          <slot
            name="group"
            :cells="cells"
            :index="groupIndex"
            :start="cells[0]?.index ?? 0"
            :end="(cells.at(-1)?.index ?? -1) + 1"
            :complete="isComplete"
          >
            <span
              v-for="cell in cells"
              :key="cell.index"
              v-bind="cellAttrs(cell.index)"
              :class="cellClasses(cell)"
            >
              <slot
                name="field"
                v-bind="cell"
              >
                <slot
                  v-if="cell.masked"
                  name="mask"
                  v-bind="cell"
                >{{ cell.maskCharacter }}</slot>
                <template v-else>{{ cell.character }}</template>
              </slot>
            </span>
          </slot>
        </span>

        <span
          v-if="groupIndex < groups.length - 1 && (separator || $slots.separator)"
          class="ui-otp-input__separator"
          aria-hidden="true"
        >
          <slot
            name="separator"
            :index="groupIndex"
          >{{ separator }}</slot>
        </span>
      </template>

      <input
        ref="element"
        v-bind="mergeProps(controlAttrs(), inputAttrs)"
        class="ui-otp-input__native"
      >
    </div>

    <!-- Always mounted and always the same live region: only its content changes. -->
    <p
      v-bind="supportAttrs"
      class="ui-otp-input__message"
    >
      <MIcon
        v-if="isError"
        :name="ICONS.error"
        class="ui-otp-input__message-icon"
        aria-hidden="true"
      />
      {{ message }}
    </p>

    <div
      v-if="$slots.support"
      class="ui-otp-input__support"
    >
      <slot name="support" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, mergeProps, useSlots, watchEffect } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useOtpControl } from '#kit/composables/otp-input/useOtpControl'
import type { OtpCell } from '#kit/composables/otp-input/useOtpControl'
import { mOtpInputProps } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native
// control. They are merged, not spread: a spread let the field's own focus, blur and
// input handlers silently replace a consumer's @focus/@blur/@input.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mOtpInputProps)
const slots = useSlots()

const model = defineModel<string>({ default: '' })
const focusedModel = defineModel<boolean>('focused', { default: false })

const emit = defineEmits<{
  (event: 'complete', value: string): void
  (event: 'invalid', input: string, rejected: string[]): void
  (event: 'clear'): void
}>()

const {
  element,
  groups,
  isComplete,
  isError,
  message,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  cellAttrs,
} = useOtpControl(model, focusedModel, props, {
  onComplete: value => emit('complete', value),
  onInvalid: (input, rejected) => emit('invalid', input, rejected),
  onClear: () => emit('clear'),
})

const rootClasses = computed(() => [
  'ui-otp-input',
  `ui-otp-input--label-${props.labelPlacement}`,
  {
    'ui-otp-input--focused': focusedModel.value,
    'ui-otp-input--disabled': props.disabled,
    'ui-otp-input--error': isError.value,
    'ui-otp-input--complete': isComplete.value,
  },
])

// The kit ships no default label: it would be English in a kit with no i18n.
// Silence would mean an unnamed field reaching a screen reader, so say it here,
// where it costs a build warning instead of a broken form.
if (import.meta.dev) {
  watchEffect(() => {
    if (!props.label && !slots.label) {
      console.warn('[m-otp-input] has no accessible name: pass `label` or fill the #label slot.')
    }
  })
}

const cellClasses = (cell: OtpCell) => [
  'ui-otp-input__field',
  {
    'ui-otp-input__field--filled': cell.filled,
    'ui-otp-input__field--active': cell.active,
    'ui-otp-input__field--error': cell.error,
    'ui-otp-input__field--disabled': cell.disabled,
  },
]
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/otp-input' as t;

.ui-otp-input {
  $t: material-map(t.$tokens, 'm-otp-input');
  $transition:
    border-color g($t, 'state.duration') g($t, 'state.easing'),
    background-color g($t, 'state.duration') g($t, 'state.easing'),
    color g($t, 'state.duration') g($t, 'state.easing');

  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 100%;

  &__label {
    max-width: 100%;
    margin-block-end: g($t, 'root.gap');
    color: g($t, 'label.color');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'label.typography'));
  }

  &--disabled &__label {
    color: g($t, 'field.disabled.color');
  }

  // The name has to exist even when it is not shown: `hidden` takes it out of
  // the layout, never out of the accessibility tree.
  &--label-hidden &__label {
    @include sr-only;
  }

  // A code reads left to right in every script, and the caret of the input
  // above has to agree with the order of the cells below it.
  &__visual {
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    gap: g($t, 'root.gap');
    direction: ltr;
  }

  // Cells keep their size while there is room and shrink, square, in a narrow
  // container instead of running out of it.
  &__group {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: g($t, 'group.gap');
  }

  &__field {
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    justify-content: center;
    width: g($t, 'field.size');
    min-width: 0;
    aspect-ratio: 1;
    border: g($t, 'field.border.width') solid g($t, 'field.outline');
    border-radius: g($t, 'field.shape');
    color: g($t, 'field.color');
    cursor: text;
    transition: $transition;

    @include typescale(g($t, 'field.typography'));

    &--filled {
      background: g($t, 'field.filled.container');
    }

    &--error {
      border-color: g($t, 'field.error.outline');
    }

    // After error: the active cell shows focus even in an invalid code; the
    // error stays in the message and the other cells.
    &--active {
      border-width: g($t, 'field.active.width');
      border-color: g($t, 'field.active.outline');
    }

    &--disabled {
      border-color: g($t, 'field.disabled.outline');
      color: g($t, 'field.disabled.color');
      cursor: default;
    }

    &--disabled#{&}--filled {
      background: g($t, 'field.disabled.container');
    }

    // Every cell edge turns CanvasText, so the cell states are restated in
    // system colours — the active cell after the error so focus stays visible.
    @include forced-colors {
      &--error {
        border-style: dashed;
        border-color: CanvasText;
      }

      &--active {
        border-color: Highlight;
      }

      &--disabled {
        border-color: GrayText;
      }
    }
  }

  @include can-hover {
    &:not(.ui-otp-input--disabled) &__visual:hover &__field:not(.ui-otp-input__field--active, .ui-otp-input__field--error) {
      border-color: g($t, 'field.hover.outline');
    }
  }

  &__separator {
    height: fit-content;
    color: g($t, 'separator.color');
  }

  // The real field, laid over the whole grid: one input, so paste, SMS autofill
  // and the caret work without being re-implemented per cell.
  &__native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: text;
  }

  // Whatever stands beside the field: a resend action, a countdown, a paste
  // button. Actions, not static text — which is why this is a slot, not a prop.
  &__support {
    display: flex;
    align-items: center;
    gap: g($t, 'group.gap');
    margin-block-start: g($t, 'message.margin.top');
  }

  // Reserved even when empty: an error that appears must not push the page down.
  &__message {
    display: flex;
    align-items: center;
    gap: g($t, 'message.gap');
    max-width: 100%;
    min-height: g($t, 'message.min-height');
    margin: 0;
    margin-block-start: g($t, 'message.margin.top');
    color: g($t, 'message.color');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'message.typography'));
  }

  // Validity has to survive without colour (WCAG 1.4.1), and an `error` with no
  // message has nothing but this glyph to say it.
  &__message-icon {
    flex: 0 0 auto;
    font-size: g($t, 'message.icon.size');
  }
}
</style>
