<template>
  <input
    type="hidden"
    :name="name"
    :value="value"
    :disabled="disabled"
  />
</template>

<script setup lang="ts">
interface Props {
  value: number
  name?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  name: '',
  disabled: false,
})
</script>
