<template>
  <label
    class="ui-radio"
    :class="radioClasses"
  >
    <input
      :id="fieldId"
      class="ui-radio__input"
      type="radio"
      :name="resolvedName"
      :value="value"
      :checked="isChecked"
      :disabled="isDisabled"
      :aria-checked="isChecked"
      :aria-invalid="errorMessage ? 'true' : undefined"
      @change="onChange"
    >

    <div class="ui-radio__container">
      <span class="ui-radio__control">
        <span class="ui-radio__outer" />
        <span class="ui-radio__inner" />
      </span>
      <span class="ui-radio__state-layer" />
    </div>

    <span
      v-if="label"
      class="ui-radio__label"
    >
      <slot>
        {{ label }}
      </slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { onScopeDispose } from 'vue'
import { useField } from 'vee-validate'
import { useRadioGroupContext } from '~/composables/radio/useRadioGroup'
import type { SingleTicket } from '~/composables/registry/createSingle'

type RadioValue = string | number

interface Props {
  name?: string
  value: RadioValue
  label?: string
  disabled?: boolean
  path?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  label: undefined,
  disabled: false,
  path: undefined,
})

const modelValue = defineModel<RadioValue | undefined>({ default: undefined })

const fieldId = useId()

const errorMessage = ref<string | undefined>()

const group = useRadioGroupContext()

// Grouped mode registers a ticket; standalone mode leaves this `null`.
let ticket: SingleTicket<{ value: RadioValue, disabled?: boolean }> | null = null

if (group) {
  ticket = group.register({
    value: props.value,
    disabled: () => props.disabled,
  })

  onScopeDispose(() => group?.unregister(ticket!.id))
}

const isChecked = computed(() => {
  if (group && ticket) return ticket.isSelected.value

  return modelValue.value === props.value
})

const isDisabled = computed(() => {
  if (group) return props.disabled || group.disabled.value

  return props.disabled
})

const resolvedName = computed(() => {
  if (group) return group.name.value

  return props.name
})

const radioClasses = computed(() => [
  {
    'ui-radio--checked': isChecked.value,
    'ui-radio--disabled': isDisabled.value,
    'ui-radio--error': Boolean(errorMessage.value),
  },
])

function onChange() {
  if (isDisabled.value) return

  if (group && ticket) {
    ticket.select()

    return
  }

  modelValue.value = props.value
}

// --- Standalone vee-validate path (form-renderer relies on this) ------------
if (!group && props.path) {
  const field = useField<RadioValue>(() => props.path as string, undefined)
  const { value, errorMessage: fieldError } = field

  watch(
    value,
    (next) => {
      modelValue.value = next
    },
    { immediate: true },
  )

  watch(modelValue, (next) => {
    value.value = next as RadioValue
  })

  watch(
    fieldError,
    (next) => {
      errorMessage.value = next || undefined
    },
    { immediate: true },
  )
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/radio/index' as t;

.ui-radio {
  $prefix: 'md-radio';
  $t: material-map(t.$tokens, $prefix);

  display: inline-flex;
  align-items: center;
  gap: g($t, 'container-gap');
  cursor: pointer;
  color: var(--color-on-surface);

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__container {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: g($t, 'container-size');
    height: g($t, 'container-size');
    flex-shrink: 0;
  }

  &__control {
    position: relative;
    width: g($t, 'control-size');
    height: g($t, 'control-size');
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  &__state-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    width: g($t, 'container-size');
    height: g($t, 'container-size');
    transform: translate(-50%, -50%) scale(0.6);
    border-radius: var(--sys-shape-corner-full);
    background-color: var(--color-on-surface);
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--checked &__state-layer {
    background-color: g($t, 'checked-color');
  }

  &--error &__state-layer {
    background-color: g($t, 'error-color');
  }

  &:hover &__state-layer {
    opacity: g($t, 'state-layer-opacity-hover');
    transform: translate(-50%, -50%) scale(1);
  }

  &:active &__state-layer {
    opacity: g($t, 'state-layer-opacity-active');
  }

  &__outer {
    position: absolute;
    inset: 0;
    border-radius: var(--sys-shape-corner-full);
    border: g($t, 'outer-border-width') solid g($t, 'outer-border-color');
    box-sizing: border-box;
    transition:
      border-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__inner {
    width: g($t, 'inner-size');
    height: g($t, 'inner-size');
    border-radius: var(--sys-shape-corner-full);
    background-color: g($t, 'inner-bg');
    transform: scale(0);
    transition:
      transform var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard),
      background-color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &__label {
    padding-top: 1rem;

    @include typescale(g($t, 'typography-label'));
  }

  &--checked &__outer {
    border-color: g($t, 'checked-color');
  }

  &--checked &__inner {
    transform: scale(1);
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'disabled-opacity');

    & &__state-layer {
      display: none;
    }
  }

  &--error &__outer {
    border-color: g($t, 'error-color');
  }
}
</style>
