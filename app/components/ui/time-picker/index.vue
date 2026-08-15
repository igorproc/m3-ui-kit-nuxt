<template>
  <component
    :is="activeComponent"
    v-model="modelValue"
    :label="label"
    :helper-text="helperText"
    :is24h="is24h"
    :layout="layout"
  />
</template>

<script setup lang="ts">
import MTimePickerKeyboard from '~/components/fragments/time-picker/keyboard/index.vue'
import MTimePickerDial from '~/components/fragments/time-picker/dial/index.vue'
import { mTimePickerProps } from './props'

const props = defineProps(mTimePickerProps)

const modelValue = defineModel<string>({ default: '' })

const activeComponent = computed(() => {
  return props.mode === 'dial' ? MTimePickerDial : MTimePickerKeyboard
})
</script>
