<template>
  <span class="crm-notifications">
    <MButtonIcon
      ref="trigger"
      :aria-label="store.unreadCount.value ? `Уведомления, непрочитанных: ${store.unreadCount.value}` : 'Уведомления'"
      aria-haspopup="menu"
      :aria-expanded="String(open)"
      @click="toggle"
    >
      <MIcon :name="ICONS.notifications" />
    </MButtonIcon>
    <!-- Outside the button: the badge is a live region of its own, and the
         button's name already carries the count. -->
    <MBadge
      v-if="store.unreadCount.value"
      class="crm-notifications__badge"
      :value="store.unreadCount.value"
      aria-hidden="true"
    />

    <MMenu
      v-model="open"
      origin="top right"
    >
      <CrmMenuItem
        v-for="item in store.notifications.value"
        :key="item.id"
        :class="{ 'crm-notifications__item--unread': !item.read }"
        @click="openNotification(item.id, item.dealId)"
      >
        {{ item.read ? '' : 'Новое: ' }}{{ item.text }}
        <template #trailing>
          {{ formatShortDate(item.at) }}
        </template>
      </CrmMenuItem>
      <CrmMenuItem
        v-if="store.unreadCount.value"
        @click="markAll"
      >
        Отметить все прочитанными
      </CrmMenuItem>
    </MMenu>
  </span>
</template>

<script setup lang="ts">
import { ICONS } from '#kit/shared/constants/icons'
import { formatShortDate } from '../data/crmFormat'
import { useCrmMenu } from '../composables/useCrmMenu'
import { useCrmStore } from '../composables/useCrmStore'
import CrmMenuItem from './CrmMenuItem.vue'

const store = useCrmStore()
const { open, trigger, toggle } = useCrmMenu()

function openNotification(id: string, dealId: string) {
  open.value = false
  store.markRead(id)
  store.openDeal(dealId)
}

function markAll() {
  open.value = false
  store.markAllRead()
}
</script>

<style lang="scss">
.crm-notifications {
  position: relative;
  display: inline-flex;

  &__badge {
    position: absolute;
    inset-block-start: spacing(4);
    inset-inline-end: spacing(4);
    pointer-events: none;
  }

  &__item--unread {
    font-weight: 500;
  }
}
</style>
