<template>
  <div :class="rootClasses">
    <!-- Plain variant: a classic static label sitting above the control. -->
    <label
      v-if="label && variant === 'plain'"
      :class="elementClasses('label')"
      :for="fieldId"
    >
      {{ label }}
    </label>

    <div :class="controlClasses">
      <div
        v-if="$slots.prepend"
        :class="iconClasses('prepend')"
      >
        <slot name="prepend" />
      </div>

      <!-- Filled / outlined: the floating MD3 label lives inside the control. -->
      <label
        v-if="label && variant !== 'plain'"
        :class="elementClasses('label')"
        :for="fieldId"
      >
        {{ label }}
      </label>

      <!-- Composite fields (e.g. a multiple combobox) render inline content such
           as chips before the input, on one non-wrapping row that scrolls. -->
      <div
        v-if="$slots['leading-content']"
        :class="elementClasses('field')"
      >
        <slot name="leading-content" />
        <slot />
      </div>
      <slot v-else />

      <div
        v-if="$slots.append"
        :class="iconClasses('append')"
      >
        <slot name="append" />
      </div>
    </div>

    <div
      v-if="message || $slots.supporting"
      :class="elementClasses('supporting')"
    >
      <slot
        v-if="error && $slots.error"
        name="error"
        :message="message"
      />
      <slot
        v-else-if="!error && $slots.helper"
        name="helper"
        :helper-text="message"
      />
      <p
        v-else-if="message"
        :id="messageId"
        :class="elementClasses(error ? 'error' : 'helper')"
      >
        {{ message }}
      </p>

      <slot name="supporting" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MTextFieldVariant } from '#kit/components/ui/text-field/props'

const props = defineProps<{
  classPrefix: string
  fieldId: string
  variant: MTextFieldVariant
  label?: string
  focused?: boolean
  populated?: boolean
  error?: boolean
  disabled?: boolean
  message?: string
  messageId?: string
}>()

const slots = useSlots()

defineSlots<{
  'default'(): unknown
  'prepend'?(): unknown
  'append'?(): unknown
  'leading-content'?(): unknown
  'helper'?(props: { helperText?: string }): unknown
  'error'?(props: { message?: string }): unknown
  'supporting'?(): unknown
}>()

const rootClasses = computed(() => [
  'ui-field',
  props.classPrefix,
  `ui-field--${props.variant}`,
  `${props.classPrefix}--${props.variant}`,
])

const controlClasses = computed(() => [
  'ui-field__control',
  `${props.classPrefix}__control`,
  `ui-field__control--${props.variant}`,
  `${props.classPrefix}__control--${props.variant}`,
  {
    'ui-field__control--prepend': Boolean(slots.prepend),
    'ui-field__control--append': Boolean(slots.append),
    [`${props.classPrefix}__control--has-prepend`]: Boolean(slots.prepend),
    [`${props.classPrefix}__control--has-append`]: Boolean(slots.append),
    'ui-field__control--focused': props.focused,
    'ui-field__control--populated': props.populated,
    'ui-field__control--error': props.error,
    'ui-field__control--disabled': props.disabled,
    [`${props.classPrefix}__control--focused`]: props.focused,
    [`${props.classPrefix}__control--populated`]: props.populated,
    [`${props.classPrefix}__control--error`]: props.error,
    [`${props.classPrefix}__control--disabled`]: props.disabled,
  },
])

const elementClasses = (element: string) => [
  `ui-field__${element}`,
  `${props.classPrefix}__${element}`,
]

const iconClasses = (position: 'prepend' | 'append') => [
  ...elementClasses('icon'),
  `ui-field__icon--${position}`,
  `${props.classPrefix}__icon--${position}`,
]
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/text-field' as t;

.ui-field {
  $t: material-map(t.$tokens, 'm-text-field');

  display: flex;
  flex-direction: column;
  gap: g($t, 'container-gap');
  min-width: 0;

  &--outlined {
    padding-top: 8rem;
  }

  // Plain: the label is a static block above the control, and the placeholder
  // stays visible since there is no floating label to double as it.
  &--plain {
    gap: g($t, 'plain-label-gap');

    > .ui-field__label {
      max-width: 100%;
      overflow: hidden;
      color: g($t, 'plain-label-color');
      text-overflow: ellipsis;
      white-space: nowrap;

      @include typescale(g($t, 'typography-label'));
    }

    .ui-field__input::placeholder {
      opacity: 1;
    }
  }

  &__control {
    position: relative;
    display: flex;
    align-items: center;
    min-height: g($t, 'container-height');
    padding-inline: g($t, 'container-padding-inline');
    border-width: g($t, 'container-border-width');
    border-style: solid;
    transition:
      border-color g($t, 'state-duration') g($t, 'state-easing'),
      background-color g($t, 'state-duration') g($t, 'state-easing'),
      box-shadow g($t, 'state-duration') g($t, 'state-easing');

    .ui-field__label {
      position: absolute;
      left: g($t, 'label-left');
      top: 50%;
      z-index: 1;
      max-width: calc(100% - 32rem);
      overflow: hidden;
      color: g($t, 'label-color');
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      transform: translateY(-50%);
      transform-origin: left top;
      transition:
        transform g($t, 'state-duration') g($t, 'state-easing'),
        top g($t, 'state-duration') g($t, 'state-easing'),
        font-size g($t, 'state-duration') g($t, 'state-easing'),
        color g($t, 'state-duration') g($t, 'state-easing');

      @include typescale(g($t, 'typography-label'));
    }

    .ui-field__input {
      flex: 1;
      width: 100%;
      height: 100%;
      padding: 0;
      border: none;
      outline: none;
      background-color: transparent;
      color: g($t, 'input-color');

      @include typescale(g($t, 'typography-input'));

      &::placeholder {
        opacity: 0;
        transition: opacity g($t, 'state-duration') g($t, 'state-easing');
      }
    }

    // Composite input row: inline content (chips) + the native input on a single
    // non-wrapping line that scrolls horizontally instead of growing the field.
    .ui-field__field {
      display: flex;
      flex: 1;
      flex-wrap: nowrap;
      align-items: center;
      gap: g($t, 'container.field.gap');
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      > :not(.ui-field__input) {
        flex: 0 0 auto;
      }

      .ui-field__input {
        flex: 1 0 g($t, 'container.field.input-min-width');
        width: auto;
      }
    }

    .ui-field__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: g($t, 'icon-width');
      color: g($t, 'icon-color');
      font-size: g($t, 'icon-size');

      &--prepend {
        margin-right: g($t, 'icon-prepend-margin');
      }

      &--append {
        margin-left: g($t, 'icon-append-margin');
      }
    }

    &.ui-field__control--prepend {
      padding-left: g($t, 'container-padding-prepend');

      .ui-field__label {
        left: g($t, 'label-prepend-left');
      }
    }

    &.ui-field__control--append {
      padding-right: g($t, 'container-padding-append');
    }

    &.ui-field__control--filled {
      align-items: center;
      border-color: transparent;
      border-bottom: g($t, 'container-border-width') solid g($t, 'filled-border-bottom-color');
      border-radius: g($t, 'filled-radius');
      background-color: g($t, 'filled-bg');

      .ui-field__input {
        padding-top: g($t, 'filled-input-padding-top');
        padding-bottom: g($t, 'filled-input-padding-bottom');
      }

      &:hover {
        border-bottom-color: g($t, 'filled-hover-border-bottom-color');
        background-color: g($t, 'filled-hover-bg');
      }
    }

    &.ui-field__control--outlined {
      border-color: g($t, 'outlined-border-color');
      border-radius: g($t, 'outlined-radius');
      background-color: transparent;

      .ui-field__label {
        padding-inline: g($t, 'outlined-label-padding-inline');
        margin-left: g($t, 'outlined-label-margin-left');
      }

      &:hover {
        border-color: g($t, 'outlined-hover-border-color');
      }
    }

    // Classic full border. The resting chrome reads --m-field-* hooks first and
    // falls back to tokens, so consumers can restyle the box (e.g. a pill radius
    // via `--m-field-radius: 999px`) without touching SCSS. States keep tokens.
    &.ui-field__control--plain {
      border-width: var(--m-field-border-width, #{g($t, 'plain-border-width')});
      border-color: var(--m-field-border-color, #{g($t, 'plain-border-color')});
      border-radius: var(--m-field-radius, #{g($t, 'plain-radius')});
      background-color: var(--m-field-bg, #{g($t, 'plain-bg')});

      &:hover {
        border-color: g($t, 'plain-hover-border-color');
      }

      &.ui-field__control--focused {
        border-width: g($t, 'plain-focused-border-width');
        border-color: g($t, 'plain-focused-border-color');
      }
    }

    &.ui-field__control--error {
      border-color: g($t, 'filled-error-border-bottom-color') !important;

      .ui-field__label {
        color: g($t, 'filled-error-label-color') !important;
      }

      &.ui-field__control--outlined {
        border-color: g($t, 'outlined-error-border-color');
      }
    }

    &.ui-field__control--disabled {
      border-color: g($t, 'filled-disabled-border-bottom-color');
      background-color: transparent;
      color: g($t, 'filled-disabled-input-color');
      cursor: default;

      .ui-field__label {
        color: g($t, 'filled-disabled-label-color');
      }

      .ui-field__input {
        color: g($t, 'filled-disabled-input-color');
      }

      .ui-field__icon {
        color: g($t, 'filled-disabled-icon-color');
      }

      &.ui-field__control--filled {
        border-bottom-color: g($t, 'filled-disabled-border-bottom-color');
        background-color: g($t, 'filled-disabled-bg');
      }

      &.ui-field__control--outlined {
        border-color: g($t, 'outlined-disabled-border-color');

        .ui-field__label {
          color: g($t, 'outlined-disabled-label-color');
        }

        .ui-field__input {
          color: g($t, 'outlined-disabled-input-color');
        }
      }
    }

    &.ui-field__control--focused,
    &.ui-field__control--populated {
      &.ui-field__control--filled {
        .ui-field__label {
          top: g($t, 'filled-active-label-top');
          transform: translateY(0) scale(g($t, 'label-active-scale'));
        }
      }

      &.ui-field__control--outlined {
        .ui-field__label {
          top: 0;
          background-color: g($t, 'outlined-label-bg');
          transform: translateY(-50%) scale(g($t, 'label-active-scale'));
        }
      }

      .ui-field__input::placeholder {
        opacity: 1;
      }
    }

    &.ui-field__control--focused {
      &.ui-field__control--filled {
        border-bottom-color: g($t, 'filled-focused-border-bottom-color');
        border-bottom-width: g($t, 'filled-focused-border-width');
        background-color: g($t, 'filled-focused-bg');

        .ui-field__label {
          color: g($t, 'filled-focused-label-color');
        }

        &.ui-field__control--error {
          border-bottom-color: g($t, 'filled-error-focused-border-bottom-color');
        }
      }

      &.ui-field__control--outlined {
        padding-inline: g($t, 'outlined-focused-padding-inline');
        border-width: g($t, 'outlined-focused-border-width');
        border-color: g($t, 'outlined-focused-border-color');

        .ui-field__label {
          color: g($t, 'outlined-focused-label-color');
        }

        &.ui-field__control--error {
          border-color: g($t, 'outlined-error-focused-border-color') !important;
        }
      }
    }
  }

  &__supporting {
    display: flex;
    justify-content: space-between;
    gap: g($t, 'container-gap');
  }

  &__helper,
  &__error {
    padding-inline: g($t, 'helper-padding-inline');
    margin-top: g($t, 'helper-margin-top');

    @include typescale(g($t, 'typography-helper'));
  }

  &__helper {
    color: g($t, 'helper-color');
  }

  &__error {
    color: g($t, 'filled-error-helper-color');
  }
}
</style>
