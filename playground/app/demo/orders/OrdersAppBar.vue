<template>
  <MAppBar class="orders-app-bar">
    <MAppBarNav v-if="!compact">
      <MButtonIcon
        :aria-label="railExpanded ? 'Свернуть меню' : 'Развернуть меню'"
        :aria-expanded="String(railExpanded)"
        @click="railExpanded = !railExpanded"
      >
        <MIcon :name="railExpanded ? 'ic:outline-menu-open' : 'ic:outline-menu'" />
      </MButtonIcon>
    </MAppBarNav>

    <MAppBarTitle
      title="PrimeTime Shop"
      class="orders-app-bar__title"
    />

    <MAppBarActions>
      <!-- MAppBar has no search region: the field squeezes into the actions. -->
      <div
        class="orders-app-bar__search"
        role="search"
      >
        <MSearch
          v-model="query"
          aria-label="Поиск по заказам и покупателям"
          :placeholder="compact ? 'Поиск' : 'Номер заказа, имя или e-mail'"
          clear-label="Очистить поиск"
        />
      </div>

      <OrdersProfileMenu @pick="label => emit('pick', label)" />
    </MAppBarActions>
  </MAppBar>
</template>

<script setup lang="ts">
import OrdersProfileMenu from './OrdersProfileMenu.vue'

defineProps<{
  compact: boolean
}>()

const emit = defineEmits<{
  (event: 'pick', label: string): void
}>()

const query = defineModel<string>('query', { required: true })
const railExpanded = defineModel<boolean>('railExpanded', { required: true })
</script>

<style lang="scss">
.orders-app-bar {
  &__title {
    min-width: 0;
  }

  &__search {
    inline-size: clamp(200rem, 32vw, 420rem);
  }
}
</style>
