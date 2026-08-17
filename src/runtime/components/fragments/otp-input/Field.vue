<template>
  <span
    class="ui-otp-input__field"
    :class="{
      'ui-otp-input__field--filled': filled,
      'ui-otp-input__field--active': active,
      'ui-otp-input__field--error': error,
      'ui-otp-input__field--disabled': disabled,
    }"
    aria-hidden="true"
    @click="$emit('select', index)"
  >
    <slot v-bind="slotState">
      <slot
        v-if="filled && masked"
        name="mask"
        v-bind="slotState"
      >
        {{ maskCharacter }}
      </slot>
      <template v-else>{{ character }}</template>
    </slot>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  index: number
  character: string
  active: boolean
  error: boolean
  disabled: boolean
  readonly: boolean
  masked: boolean
  maskCharacter: string
}>()

defineEmits<{ (event: 'select', index: number): void }>()

const filled = computed(() => props.character !== '')
const slotState = computed(() => ({
  index: props.index,
  position: props.index + 1,
  character: props.character,
  filled: filled.value,
  active: props.active,
  error: props.error,
  disabled: props.disabled,
  readonly: props.readonly,
}))
</script>
