<template>
  <div
    :id="value === null ? undefined : ctx.panelId(value)"
    class="ui-tabs__content"
    role="tabpanel"
    :aria-labelledby="value === null ? undefined : ctx.tabId(value)"
    tabindex="0"
  >
    <slot :value="value" />
  </div>
</template>

<script setup lang="ts">
/**
 * Private default panel of `<MTabs>`. It is a component of its own, rendered
 * after the tablist, so it reads the selection once the tabs have registered:
 * in the server render and in the first client render alike. Read in the
 * parent's render, the selection would still be empty on the client.
 */
import { computed } from 'vue'
import { useTabsContext } from '#kit/composables/tabs/useTabs'
import type { TabValue } from '#kit/composables/tabs/useTabs'

defineSlots<{
  default?: (props: { value: TabValue | null }) => unknown
}>()

const ctx = useTabsContext()

const value = computed(() => ctx.selectedValue.value ?? null)
</script>
