<template>
  <div
    v-bind="rootAttrs()"
    class="ui-checkbox"
    :class="checkboxClasses"
  >
    <label class="ui-checkbox__field">
      <input
        v-bind="controlAttrs(inputAttrs())"
        ref="input"
        :checked="modelValue"
        class="ui-checkbox__input"
        type="checkbox"
        :disabled="disabled"
        :required="required || undefined"
        @change="onChange"
      >

      <span class="ui-checkbox__container">
        <span class="ui-checkbox__control">
          <svg
            class="ui-checkbox__icon"
            :viewBox="CHECK_MARK.viewBox"
            aria-hidden="true"
            focusable="false"
          >
            <path
              class="ui-checkbox__mark"
              :d="indeterminate ? CHECK_MARK.dash : CHECK_MARK.check"
              pathLength="1"
            />
          </svg>
        </span>
        <span class="ui-checkbox__state-layer" />
      </span>

      <span
        v-if="label || $slots.default"
        class="ui-checkbox__label"
      >
        <slot>
          {{ label }}
        </slot>
        <span
          v-if="required"
          class="ui-checkbox__required"
          aria-hidden="true"
        > *</span>
      </span>
    </label>

    <!-- Outside the label: its text must neither name the box nor toggle it. -->
    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId()"
      class="ui-checkbox__support"
      :is-error="isError"
      :message="message"
    >
      <template
        v-if="$slots.helper"
        #helper="scope"
      >
        <slot
          name="helper"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.error"
        #error="scope"
      >
        <slot
          name="error"
          v-bind="scope"
        />
      </template>
    </ChoiceSupport>
  </div>
</template>

<script setup lang="ts">
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import { CHECK_MARK } from '#kit/utils/choice/checkMark'
import { useChoiceField } from '#kit/utils/choice/useChoiceField'
import { mCheckboxProps } from './props'
import type { MCheckboxSlots } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mCheckboxProps)
const slots = defineSlots<MCheckboxSlots>()

const modelValue = defineModel<boolean>({ default: false })
const indeterminate = defineModel<boolean>('indeterminate', { default: false })

const input = useTemplateRef<HTMLInputElement>('input')

// `indeterminate` is a DOM property with no attribute, so the server can only
// draw it (the modifier class); the native control learns it after mount.
function syncIndeterminate() {
  if (input.value) input.value.indeterminate = indeterminate.value
}

watch([input, indeterminate], syncIndeterminate, { immediate: true, flush: 'post' })

// Activating a mixed box makes the browser check it and clear `indeterminate`.
// A parent that keeps it mixed gets the property back once the emits settle.
function onChange(event: Event) {
  modelValue.value = (event.target as HTMLInputElement).checked
  if (indeterminate.value) indeterminate.value = false
  nextTick(syncIndeterminate)
}

// Coerce the synced field value to a strict boolean (the native checkbox
// contract) without mutating the shared `useField` composable.
const booleanModel = computed({
  get: () => modelValue.value,
  set: (next) => {
    modelValue.value = Boolean(next)
  },
})

const { isError, message, hasSupport, supportId, inputAttrs } = useChoiceField(booleanModel, props, slots)

const checkboxClasses = computed(() => [
  {
    'ui-checkbox--checked': modelValue.value,
    'ui-checkbox--indeterminate': indeterminate.value,
    'ui-checkbox--disabled': props.disabled,
    'ui-checkbox--error': isError.value,
  },
])
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/checkbox/index' as t;
@use '#kit/assets/stylesheet/components/choice/control' as control;

.ui-checkbox {
  $t: material-map(t.$tokens, 'md-checkbox');

  isolation: isolate;

  @include control.field($t);
  @include control.layer($t, (checked, indeterminate));

  &__control {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: g($t, 'control.size');
    block-size: g($t, 'control.size');
    border: g($t, 'control.border.width') solid g($t, 'unselected.container.border');
    border-radius: g($t, 'control.radius');
    transition:
      border-color g($t, 'motion.exit.duration') g($t, 'motion.exit.easing'),
      background-color g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }

  // An unchecked box darkens its edge under the pointer, in focus and pressed.
  // `:where()` keeps these at the weight of a rest rule, so error and disabled
  // (declared later) win over them.
  $unchecked: ':where(:not(.ui-checkbox--disabled, .ui-checkbox--checked, .ui-checkbox--indeterminate))';

  @include can-hover {
    &#{$unchecked} &__field:where(:hover) &__control {
      border-color: g($t, 'unselected.container.active.border');
    }
  }

  &#{$unchecked} &__input:where(:focus-visible) + &__container &__control,
  &#{$unchecked} &__field:where(:active) &__control {
    border-color: g($t, 'unselected.container.active.border');
  }

  &__icon {
    inline-size: g($t, 'icon.size');
    block-size: g($t, 'icon.size');
    color: g($t, 'selected.content.color');
    opacity: 0;
    scale: g($t, 'icon.scale');
    transition:
      opacity g($t, 'motion.fade.duration') g($t, 'motion.fade.easing'),
      scale g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }

  &__mark {
    fill: none;
    stroke: currentcolor;
    stroke-width: g($t, 'icon.stroke');
    stroke-linecap: square;
    stroke-dasharray: g($t, 'icon.dash');
    stroke-dashoffset: g($t, 'icon.dash');
    transition: stroke-dashoffset g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
  }

  &--checked &__control,
  &--indeterminate &__control {
    border-color: g($t, 'selected.container.color');
    background-color: g($t, 'selected.container.color');
    transition:
      border-color g($t, 'motion.enter.duration') g($t, 'motion.enter.easing'),
      background-color g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &--checked &__icon,
  &--indeterminate &__icon {
    opacity: 1;
    scale: 1;
    transition:
      opacity g($t, 'motion.fade.duration') g($t, 'motion.fade.easing'),
      scale g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &--checked &__mark,
  &--indeterminate &__mark {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
  }

  &--error &__field &__control {
    border-color: g($t, 'error.container.border');
  }

  &--error:is(.ui-checkbox--checked, .ui-checkbox--indeterminate) &__control {
    background-color: g($t, 'error.container.color');
  }

  &--error &__icon {
    color: g($t, 'error.content.color');
  }

  // Disabled by roles, not by fading the whole control.
  &--disabled &__field &__control {
    border-color: g($t, 'disabled.unselected.container.border');
  }

  &--disabled:is(.ui-checkbox--checked, .ui-checkbox--indeterminate) &__field &__control {
    border-color: transparent;
    background-color: g($t, 'disabled.selected.container.color');
  }

  &--disabled &__icon {
    color: g($t, 'disabled.selected.content.color');
  }

  &--disabled &__state-layer {
    display: none;
  }

  @include forced-colors {
    &--checked &__control,
    &--indeterminate &__control {
      background-color: Highlight;
      border-color: Highlight;
    }

    &--checked &__icon,
    &--indeterminate &__icon {
      color: HighlightText;
    }

    // As the fields: an invalid edge is dashed, so it reads without colour.
    &--error &__control {
      border-style: dashed;
    }

    &--disabled &__control {
      border-color: GrayText;
    }

    &--checked.ui-checkbox--disabled &__control,
    &--indeterminate.ui-checkbox--disabled &__control {
      background-color: GrayText;
    }

    &--disabled &__icon {
      color: Canvas;
    }
  }
}
</style>
