<template>
  <span class="crm-move-menu">
    <MButton
      ref="trigger"
      variant="text"
      density="compact"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      :aria-label="`Переместить сделку «${deal.title}»`"
      @click="toggle"
    >
      Переместить
      <template #append>
        <MIcon :name="ICONS.arrowDropDown" />
      </template>
    </MButton>

    <MMenu
      v-model="open"
      origin="top right"
    >
      <CrmMenuItem
        v-for="target in targets"
        :key="target.id"
        @click="choose(target.id)"
      >
        {{ target.label }}
      </CrmMenuItem>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS } from '#kit/shared/constants/icons'
import { CRM_LOST_LABEL, CRM_STAGES } from '../data/crmTypes'
import type { CrmDeal, CrmDealStatus } from '../data/crmTypes'
import { useCrmMenu } from '../composables/useCrmMenu'
import { useCrmStore } from '../composables/useCrmStore'
import CrmMenuItem from '../shell/CrmMenuItem.vue'

const props = defineProps<{
  deal: CrmDeal
}>()

const store = useCrmStore()
const { open, trigger, toggle } = useCrmMenu()

interface MoveTarget {
  id: CrmDealStatus
  label: string
}

const ALL_TARGETS: readonly MoveTarget[] = [...CRM_STAGES, { id: 'lost', label: CRM_LOST_LABEL }]

const targets = computed(() => ALL_TARGETS.filter(target => target.id !== props.deal.status))

function choose(status: CrmDealStatus) {
  open.value = false
  store.moveDeal(props.deal.id, status)
}
</script>

<style lang="scss">
.crm-move-menu {
  display: inline-flex;
}
</style>
