<template>
  <MAppBar class="crm-app-bar">
    <MAppBarNav v-if="compact">
      <MButtonIcon
        aria-label="Открыть меню разделов"
        aria-haspopup="dialog"
        @click="emit('open-drawer')"
      >
        <MIcon :name="ICONS.menu" />
      </MButtonIcon>
    </MAppBarNav>

    <MAppBarTitle
      title="PrimeTime CRM"
      :subtitle="compact ? '' : 'Отдел продаж'"
    />

    <MAppBarActions class="crm-app-bar__actions">
      <MSearch
        v-model="query"
        class="crm-app-bar__search"
        placeholder="Сделки, компании, номера"
        aria-label="Поиск по сделкам и компаниям"
        clear-label="Очистить поиск"
        aria-keyshortcuts="/"
        data-crm-search
        @submit="emit('search')"
      >
        <template
          v-if="!compact"
          #avatar
        >
          <MAvatar
            :name="CRM_ME.name"
            density="compact"
          />
        </template>
      </MSearch>
      <CrmNotificationsMenu />
    </MAppBarActions>
  </MAppBar>
</template>

<script setup lang="ts">
import { ICONS } from '#kit/shared/constants/icons'
import { CRM_ME } from '../data/crmSeed'
import CrmNotificationsMenu from './CrmNotificationsMenu.vue'

defineProps<{
  /** Compact window: the rail is gone and the drawer opens from here. */
  compact: boolean
}>()

const emit = defineEmits<{
  (event: 'open-drawer' | 'search'): void
}>()

const query = defineModel<string>('query', { required: true })
</script>

<style lang="scss">
@use 'sass:map';

.crm-app-bar {
  &__actions {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__search {
    flex: 1 1 auto;
    width: 420rem;
    min-width: 0;
  }

  @include media-max(map.get($breakpoints, 'mobile')) {
    &__search {
      width: 300rem;
    }
  }
}
</style>
