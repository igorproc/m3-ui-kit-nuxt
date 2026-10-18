<template>
  <MNavigationDrawer v-model="open">
    <template #header>
      PrimeTime CRM
    </template>

    <nav aria-label="Разделы CRM">
      <MList>
        <MListItem
          v-for="item in items"
          :key="item.id"
          :to="linkTo(item.id)"
          :selected="item.id === section"
          :leading-icon="item.icon"
          :headline="item.label"
          @click="open = false"
        >
          <template
            v-if="item.badge"
            #trailing
          >
            <MBadge
              :value="item.badge"
              aria-hidden="true"
            />
            <span class="crm-nav-drawer__count">{{ item.badgeLabel }}</span>
          </template>
        </MListItem>
      </MList>
    </nav>
  </MNavigationDrawer>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { CrmSection } from '../data/crmTypes'

export interface CrmNavEntry {
  id: CrmSection
  label: string
  icon: string
  badge?: number
  /** Spoken form of the badge, which itself is hidden from assistive tech. */
  badgeLabel?: string
}

defineProps<{
  items: CrmNavEntry[]
  section: CrmSection
  linkTo: (section: CrmSection) => RouteLocationRaw
}>()

const open = defineModel<boolean>({ default: false })
</script>

<style lang="scss">
.crm-nav-drawer__count {
  @include sr-only;
}
</style>
