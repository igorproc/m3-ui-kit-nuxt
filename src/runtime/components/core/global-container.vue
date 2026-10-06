<template>
  <div class="ui-dialog-global-container">
    <client-only>
      <component
        :is="renderModal(modal)"
        v-for="modal in modalService.dynamicModals"
        :key="modal.id"
      />
    </client-only>
  </div>
</template>

<script lang="ts" setup>
// Host for programmatic modals created by `useModal()`. Client-only: they are
// opened from user interaction and must not leave teleport anchors in the SSR
// output.
import { h } from 'vue'
import { useNuxtApp } from '#app'
import type { DynamicModal } from '#kit/composables/modal/createModalService'

const modalService = useNuxtApp().$material.modal

const renderModal = (modal: DynamicModal) => h(modal.component, modal.props, modal.slots)
</script>
