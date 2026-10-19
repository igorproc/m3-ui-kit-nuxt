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

      <span
        v-if="required"
        class="ui-otp-input__required"
        aria-hidden="true"
      >*</span>
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
                <span
                  v-else-if="cell.hint"
                  class="ui-otp-input__hint"
                >{{ cell.hint }}</span>
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
        v-bind="nativeAttrs()"
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
      <!-- The check in progress is announced by `aria-busy` on the input; the
           indicator only shows it, in the line an error would take. -->
      <MLoading
        v-else-if="loading"
        inline
        class="ui-otp-input__loading"
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
import MLoading from '#kit/components/ui/loading/index.vue'
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
  focusAt,
  selectAll,
  inputAttrs,
  labelAttrs,
  supportAttrs,
  cellAttrs,
} = useOtpControl(model, focusedModel, props, {
  onComplete: value => emit('complete', value),
  onInvalid: (input, rejected) => emit('invalid', input, rejected),
  onClear: () => emit('clear'),
})

// Focused with the caret past the last cell (a code typed to the end): no
// cell is active, so the whole code shows the focus instead.
const caretPast = computed(() => focusedModel.value && !groups.value.some(cells => cells.some(cell => cell.active)))

const rootClasses = computed(() => [
  'ui-otp-input',
  `ui-otp-input--${props.variant}`,
  `ui-otp-input--label-${props.labelPlacement}`,
  {
    'ui-otp-input--focused': focusedModel.value,
    'ui-otp-input--caret-past': caretPast.value,
    'ui-otp-input--disabled': props.disabled,
    'ui-otp-input--error': isError.value,
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

// The field's own attributes win on a clash; listeners from both sides run.
const nativeAttrs = () => mergeProps(controlAttrs(), inputAttrs.value as unknown as Record<string, unknown>)

/**
 * `focus()` puts the caret after the last character; `select()` focuses the
 * field with the whole code selected, so the next keystroke starts a new code —
 * what a form wants after the server rejected one.
 */
defineExpose({
  focus: () => focusAt(model.value.length),
  select: selectAll,
})

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
@use '#kit/assets/stylesheet/components/otp-input/cells' as cells;

.ui-otp-input {
  $t: material-map(t.$tokens, 'm-otp-input');

  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;

  // As a grid or flex item the root would otherwise keep its content width as
  // a minimum, and a code in a narrow column would run out of it (LY-07).
  min-width: 0;
  max-width: 100%;

  &__label {
    max-width: 100%;
    margin-block-end: g($t, 'root.gap');
    color: g($t, 'label.color');
    overflow-wrap: anywhere;

    @include typescale(g($t, 'label.typography'));
  }

  &__required {
    color: g($t, 'label.required.color');
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

  @include cells.cells($t);

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

    // iOS zooms the page into an input whose text is under 16 CSS px. The
    // keyword is the UA's 16px default, so the page stays put on focus.
    font-size: medium;
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

  // Sized by the line it stands in, like the glyph an error would put there.
  // Outranks the indicator's own colour: its sheet may load later in production.
  & &__loading {
    flex: 0 0 auto;
    color: g($t, 'message.loading.color');
    font-size: g($t, 'message.icon.size');
  }
}
</style>
