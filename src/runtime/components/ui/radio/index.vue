<template>
  <div
    v-bind="rootAttrs()"
    class="ui-radio"
    :class="radioClasses"
  >
    <label class="ui-radio__field">
      <input
        v-bind="controlAttrs(radioInputAttrs())"
        class="ui-radio__input"
        type="radio"
        :value="value"
        :checked="isChecked"
        :disabled="isDisabled"
        :required="(!group && required) || undefined"
        @change="onChange"
      >

      <span class="ui-radio__container">
        <span class="ui-radio__control">
          <span class="ui-radio__outer" />
          <span class="ui-radio__inner" />
        </span>
        <span class="ui-radio__state-layer" />
      </span>

      <span
        v-if="label || $slots.default"
        class="ui-radio__label"
      >
        <slot>
          {{ label }}
        </slot>
        <span
          v-if="!group && required"
          class="ui-radio__required"
          aria-hidden="true"
        > *</span>
      </span>
    </label>

    <!-- A grouped radio has no line of its own: the group's line speaks for all. -->
    <ChoiceSupport
      v-if="!group && hasSupport()"
      :id="supportId()"
      class="ui-radio__support"
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
import { onScopeDispose, shallowRef } from 'vue'
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import { useRadioGroupContext } from '#kit/composables/radio/useRadioGroup'
import type { SingleTicket } from '#kit/composables/registry/createSingle'
import { useChoiceField } from '#kit/utils/choice/useChoiceField'
import { mRadioProps } from './props'
import type { MRadioSlots, MRadioValue } from './props'
import { useControlAttrs } from '#kit/composables/useControlAttrs'

// The root is a wrapper; aria-*, name, inputmode and listeners belong on the native control.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mRadioProps)
const slots = defineSlots<MRadioSlots>()

const modelValue = defineModel<MRadioValue | undefined>({ default: undefined })

const group = useRadioGroupContext()

// Grouped mode registers a ticket; standalone mode leaves this `null`.
const ticket = shallowRef<SingleTicket | null>(null)

function registerIn(radioGroup: NonNullable<typeof group>) {
  const previous = ticket.value
  const wasSelected = previous?.isSelected.value ?? false
  if (previous) radioGroup.unregister(previous.id)

  ticket.value = radioGroup.register({ value: props.value, disabled: () => props.disabled })
  if (wasSelected) radioGroup.select(ticket.value.id)
}

if (group) {
  registerIn(group)
  watch(() => props.value, () => registerIn(group))
  onScopeDispose(() => group.unregister(ticket.value!.id))
}

// Grouped radios delegate their value (and its field) to the group; only a
// standalone radio binds its own `path` — the form-renderer relies on that.
const { isError: ownError, message, hasSupport, supportId, inputAttrs } = useChoiceField(modelValue, props, slots, !group)

const isError = computed(() => ownError.value || Boolean(group?.invalid.value))

const isChecked = computed(() => {
  if (group && ticket.value) return ticket.value.isSelected.value

  return modelValue.value === props.value
})

const isDisabled = computed(() => {
  if (group) return props.disabled || group.disabled.value

  return props.disabled
})

const radioInputAttrs = () => {
  const own = inputAttrs()

  if (!group) return own

  // The group's radiogroup carries validity and the description for the set.
  const consumerIds = own['aria-describedby']?.split(' ').filter(id => id !== supportId()).join(' ')

  return { ...own, 'name': group.name.value, 'aria-invalid': undefined, 'aria-describedby': consumerIds || undefined }
}

const radioClasses = computed(() => [
  {
    'ui-radio--checked': isChecked.value,
    'ui-radio--disabled': isDisabled.value,
    'ui-radio--error': isError.value,
    'ui-radio--grouped': Boolean(group),
  },
])

function onChange() {
  if (isDisabled.value) return

  if (group && ticket.value) {
    ticket.value.select()

    return
  }

  modelValue.value = props.value
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/radio/index' as t;
@use '#kit/assets/stylesheet/components/choice/control' as control;

.ui-radio {
  $t: material-map(t.$tokens, 'md-radio');

  isolation: isolate;

  @include control.field($t);
  @include control.layer($t, (checked));

  // In a group each row is the 48 target tall, so the targets of neighbouring
  // rows meet instead of overlapping (W11-Б).
  &--grouped &__field {
    padding-block: g($t, 'group.row.padding');
  }

  &__control {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: g($t, 'control.size');
    block-size: g($t, 'control.size');
  }

  &__outer {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: g($t, 'outer.border.width') solid g($t, 'unselected.content.color');
    border-radius: var(--sys-shape-corner-full);
    transition: border-color g($t, 'motion.color.duration') g($t, 'motion.color.easing');
  }

  &__inner {
    inline-size: g($t, 'inner.size');
    block-size: g($t, 'inner.size');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'selected.content.color');
    scale: 0;
    transition:
      scale g($t, 'motion.dot.duration') g($t, 'motion.dot.easing'),
      background-color g($t, 'motion.color.duration') g($t, 'motion.color.easing');
  }

  // An unselected ring darkens under the pointer, in focus and pressed; in
  // `:where()` so the selection, the error and disabled (later) win over it.
  $unselected: ':where(:not(.ui-radio--disabled, .ui-radio--checked))';

  @include can-hover {
    &#{$unselected} &__field:where(:hover) &__outer {
      border-color: g($t, 'unselected.content.active.color');
    }
  }

  &#{$unselected} &__input:where(:focus-visible) + &__container &__outer,
  &#{$unselected} &__field:where(:active) &__outer {
    border-color: g($t, 'unselected.content.active.color');
  }

  &--checked &__outer {
    border-color: g($t, 'selected.content.color');
  }

  &--checked &__inner {
    scale: 1;
  }

  &--error &__field &__outer {
    border-color: g($t, 'error.content.color');
  }

  &--error &__inner {
    background-color: g($t, 'error.content.color');
  }

  // Disabled by roles; nothing animates.
  &--disabled &__field &__outer {
    border-color: g($t, 'disabled.unselected.content.color');
  }

  &--disabled &__inner {
    background-color: g($t, 'disabled.selected.content.color');
    transition: none;
  }

  &--disabled &__state-layer {
    display: none;
  }

  // The inner dot is only a fill; forced colors would erase the checked state.
  @include forced-colors {
    &__inner {
      background-color: Highlight;
    }

    &--checked &__outer {
      border-color: Highlight;
    }

    &--error &__outer {
      border-style: dashed;
    }

    &--disabled &__outer {
      border-color: GrayText;
    }

    &--disabled &__inner {
      background-color: GrayText;
    }
  }
}
</style>
