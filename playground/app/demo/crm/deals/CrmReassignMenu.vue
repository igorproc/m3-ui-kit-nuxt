<template>
  <span class="crm-reassign-menu">
    <MButton
      ref="trigger"
      variant="tonal"
      density="compact"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      @click="toggle"
    >
      <template #prepend>
        <MIcon name="outline-person-add" />
      </template>
      Сменить ответственного
    </MButton>

    <MMenu
      v-model="open"
      origin="top left"
    >
      <CrmMenuItem
        v-for="owner in CRM_OWNERS"
        :key="owner.id"
        @click="choose(owner.id)"
      >
        {{ owner.name }}
        <template #trailing>
          {{ owner.role }}
        </template>
      </CrmMenuItem>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
import { CRM_OWNERS } from '../data/crmSeed'
import { useCrmMenu } from '../composables/useCrmMenu'
import CrmMenuItem from '../shell/CrmMenuItem.vue'

const emit = defineEmits<{
  (event: 'choose', ownerId: string): void
}>()

const { open, trigger, toggle } = useCrmMenu()

function choose(ownerId: string) {
  open.value = false
  emit('choose', ownerId)
}
</script>

<style lang="scss">
.crm-reassign-menu {
  display: inline-flex;
}
</style>
