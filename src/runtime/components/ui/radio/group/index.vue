<template>
  <div
    v-bind="rootAttrs()"
    class="ui-radio-group"
  >
    <span
      v-if="label || $slots.label"
      :id="labelId"
      class="ui-radio-group__label"
    >
      <slot name="label">{{ label }}</slot>
      <span
        v-if="required"
        class="ui-radio-group__required"
        aria-hidden="true"
      > *</span>
    </span>

    <div
      v-bind="controlAttrs(groupAttrs())"
      class="ui-radio-group__options"
      role="radiogroup"
    >
      <slot />
    </div>

    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId"
      class="ui-radio-group__support"
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
import { createSingle } from '#kit/composables/registry/createSingle'
import { provideRadioGroupContext } from '#kit/composables/radio/useRadioGroup'
import type { RadioValue } from '#kit/composables/radio/useRadioGroup'
import { useFieldValidation } from '#kit/utils/text-field/useFieldValidation'
import { useSupportLine } from '#kit/utils/text-field/supportLine'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { mRadioGroupProps } from './props'
import type { MRadioGroupSlots } from './props'

// The root holds the group and its support line; ARIA — a consumer's
// `aria-labelledby` first of all — belongs on the radiogroup itself.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mRadioGroupProps)
const slots = defineSlots<MRadioGroupSlots>()

const modelValue = defineModel<RadioValue | undefined>({ default: undefined })

const groupId = useId()
const labelId = `${groupId}-label`
const supportId = `${groupId}-support`
const name = computed(() => props.name ?? props.path ?? groupId)
const groupDisabled = computed(() => props.disabled)

// `reactive: true` makes the ticket collection (and `sel.size`) reactive, so the
// model<->selection watch below re-fires when child <MRadio>s register and the
// initial v-model value is applied to the matching radio. Without it the
// collection is a plain Map and a preset value never selects its radio.
const sel = createSingle<{ value: RadioValue, disabled?: boolean }>({
  mandatory: () => props.mandatory,
  reactive: true,
})

watch(
  [() => modelValue.value, () => sel.size],
  ([v]) => {
    if (sel.selectedValue.value !== v) sel.apply([v])
  },
  { immediate: true },
)

watch(sel.selectedValue, (v) => {
  if (v !== modelValue.value) modelValue.value = v
})

// The group is the field: `useField` keeps `modelValue` in two-way sync with
// the adapter value, and the selection watches above carry it to the radios.
const { isError, message } = useFieldValidation(modelValue, props)
const hasSupport = useSupportLine(props, slots)

if (import.meta.dev) {
  const attrs = useAttrs()
  watchEffect(() => {
    if (!props.label && !slots.label && !attrs['aria-label'] && !attrs['aria-labelledby']) {
      console.warn('[m-radio-group] the group has no name: pass `label`, `aria-label` or `aria-labelledby`.')
    }
  })
}

const groupAttrs = () => ({
  'id': groupId,
  'aria-labelledby': props.label || slots.label ? labelId : undefined,
  // Valid on `radiogroup` (not on a native radio), so the group carries it.
  'aria-required': props.required ? 'true' as const : undefined,
  'aria-invalid': isError.value ? 'true' as const : undefined,
  'aria-describedby': hasSupport() && (message.value || slots.helper || (isError.value && slots.error)) ? supportId : undefined,
})

// A radio registers in its own setup, before it renders: the one equal to the
// model is selected right there, so the server's first frame already shows it
// (the watcher above re-applies the model only on the client).
function register(input?: Parameters<typeof sel.register>[0]) {
  const ticket = sel.register(input)
  if (modelValue.value !== undefined && ticket.value === modelValue.value) sel.select(ticket.id)
  return ticket
}

provideRadioGroupContext({
  name,
  disabled: groupDisabled,
  invalid: isError,
  selectedValue: sel.selectedValue,
  register,
  unregister: sel.unregister,
  select: sel.select,
})
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/radio/index' as t;

.ui-radio-group {
  $t: material-map(t.$tokens, 'md-radio');

  display: flex;
  flex-direction: column;

  &__label {
    margin-block-end: g($t, 'group.label.gap');
    color: g($t, 'group.label.color');

    @include typescale(g($t, 'group.label.typography'));
  }

  &__required {
    color: g($t, 'label.required');
  }

  // Rows carry their own 48 height (`ui-radio--grouped`): no gap between them.
  &__options {
    display: flex;
    flex-direction: column;
  }

  &__support {
    padding-inline-start: g($t, 'group.support.inset');
  }
}
</style>
