<template>
  <div :class="rootClasses">
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
        v-bind="inputAttrs"
        class="ui-otp-input__native"
      >
    </div>

    <p
      v-if="message"
      v-bind="supportAttrs"
      class="ui-otp-input__message"
    >
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
import { useOtpControl } from '#kit/composables/otp-input/useOtpControl'
import type { OtpCell } from '#kit/composables/otp-input/useOtpControl'
import { mOtpInputProps } from './props'

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

  display: inline-flex;
  flex-direction: column;

  &__label {
    margin-bottom: g($t, 'root.gap');
  }

  // The name has to exist even when it is not shown: `hidden` takes it out of
  // the layout, never out of the accessibility tree.
  &--label-hidden > &__label {
    position: absolute;
    width: 1rem;
    height: 1rem;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  &__visual {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: g($t, 'root.gap');
  }

  &__group {
    display: inline-flex;
    align-items: center;
    gap: g($t, 'group.gap');
  }

  &__field {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'field.size');
    height: g($t, 'field.size');
    border: 1rem solid g($t, 'field.outline');
    border-radius: g($t, 'field.shape');
    color: g($t, 'field.color');
    cursor: text;

    @include typescale(g($t, 'field.typography'));

    &--filled {
      background: g($t, 'field.filled-container');
    }

    &--active {
      border-width: g($t, 'field.active-width');
      border-color: g($t, 'field.active-outline');
    }

    &--error {
      border-color: g($t, 'field.error-outline');
    }

    &--disabled {
      opacity: g($t, 'field.disabled-opacity');
      cursor: default;
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
    margin-top: g($t, 'message.margin-top');
  }

  &__message {
    margin: g($t, 'message.margin-top') 0 0;
    color: g($t, 'message.color');

    @include typescale(g($t, 'message.typography'));
  }
}
</style>
