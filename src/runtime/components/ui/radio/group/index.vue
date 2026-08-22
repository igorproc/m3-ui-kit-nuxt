<template>
  <div
    class="ui-radio-group"
    role="radiogroup"
    :aria-invalid="errorMessage ? 'true' : undefined"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useField } from '#kit/composables/useField'
import { createSingle } from '#kit/composables/registry/createSingle'
import { provideRadioGroupContext } from '#kit/composables/radio/useRadioGroup'
import type { RadioValue } from '#kit/composables/radio/useRadioGroup'
import { mRadioGroupProps } from './props'

const props = defineProps(mRadioGroupProps)

const modelValue = defineModel<RadioValue | undefined>({ default: undefined })

const generatedName = useId()
const name = computed(() => props.name ?? generatedName)
const groupDisabled = computed(() => props.disabled)

const errorMessage = ref<string | undefined>()

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

// `useField` keeps `modelValue` in two-way sync with the field value; the
// group's own selection watches (above) propagate that to the child radios.
if (props.path) {
  const field = useField<RadioValue | undefined>({ path: props.path, model: modelValue })

  watch(
    field.errorMessage,
    (next) => {
      errorMessage.value = next
    },
    { immediate: true },
  )
}

provideRadioGroupContext({
  name,
  disabled: groupDisabled,
  selectedValue: sel.selectedValue,
  register: sel.register,
  unregister: sel.unregister,
  select: sel.select,
})
</script>

<style lang="scss">
.ui-radio-group {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}
</style>
