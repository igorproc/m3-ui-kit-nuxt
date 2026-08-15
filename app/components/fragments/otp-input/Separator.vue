<template>
  <span
    class="ui-otp-input__separator"
    aria-hidden="true"
  >
    <slot>{{ value }}</slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{ value: string }>()
</script>
