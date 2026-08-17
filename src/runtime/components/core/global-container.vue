<template>
  <div class="ui-dialog-global-container">
    <client-only>
      <modals-container />
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import { ModalsContainer } from 'vue-final-modal'

onMounted(() => {
  import('vue-final-modal/style.css')
})
</script>
