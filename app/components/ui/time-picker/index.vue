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
import MTimePickerKeyboard from './keyboard/index.vue'
import MTimePickerDial from './dial/index.vue'

interface Props {
  label?: string
  helperText?: string
  mode?: 'dial' | 'keyboard'
  is24h?: boolean
  layout?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'dial', // default mode for M3 Time Picker
  is24h: true,
  layout: 'vertical',
})

const modelValue = defineModel<string>({ default: '' })

const activeComponent = computed(() => {
  return props.mode === 'dial' ? MTimePickerDial : MTimePickerKeyboard
})
</script>
