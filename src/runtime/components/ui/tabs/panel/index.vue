<template>
  <div
    v-if="isActive"
    :id="ctx.panelId(value)"
    class="ui-tabs__content"
    role="tabpanel"
    :aria-labelledby="ctx.tabId(value)"
    tabindex="0"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useTabsContext } from '#kit/composables/tabs/useTabs'
import type { MTabPanelProps } from './props'

const props = defineProps<MTabPanelProps>()

const ctx = useTabsContext()

const isActive = computed(() => ctx.selectedValue.value === props.value)
</script>
