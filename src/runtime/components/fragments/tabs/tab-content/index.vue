<template>
  <span class="ui-tabs__tab-content">
    <span
      v-if="icon"
      class="ui-tabs__tab-icon"
    >
      <MIcon
        :name="glyph"
        :filled="filled"
      />

      <MBadge
        v-if="hasBadge"
        class="ui-tabs__tab-badge"
        :class="{ 'ui-tabs__tab-badge--dot': badge === true }"
        :value="badge === true ? undefined : badge"
        :dot="badge === true"
        aria-hidden="true"
      />
    </span>

    <span
      v-if="hasLabel"
      class="ui-tabs__tab-label"
    >
      <slot>{{ label }}</slot>
    </span>

    <MBadge
      v-if="!icon && hasBadge"
      class="ui-tabs__tab-badge ui-tabs__tab-badge--inline"
      :value="badge === true ? undefined : badge"
      :dot="badge === true"
      aria-hidden="true"
    />
  </span>
</template>

<script setup lang="ts">
/**
 * Private content of `<MTab>`, shared by the tablist button and the route
 * link: icon, label and badge. The badge is drawn only (`aria-hidden`); the tab
 * describes it with `badgeLabel`.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MIconName } from '#kit/components/ui/icon/props'
import { computed } from 'vue'
import MBadge from '#kit/components/ui/badge/index.vue'

const props = defineProps<{
  label?: string
  icon?: MIconName
  activeIcon?: MIconName
  selected: boolean
  badge?: number | true
  hasLabel: boolean
}>()

// A `number | true` prop is cast to `false` when absent: test for a value.
const hasBadge = computed(() => props.badge === true || typeof props.badge === 'number')

const glyph = computed(() => (props.selected && props.activeIcon ? props.activeIcon : props.icon!))
const filled = computed(() => props.selected && !props.activeIcon)
</script>
