<template>
  <MLayout>
    <MLayoutHeader>
      <OrdersAppBar
        v-model:query="filters.query"
        v-model:rail-expanded="railExpanded"
        :compact="compact"
        @pick="label => snackbar.show(`«${label}» в этом демо не реализовано`)"
      />
    </MLayoutHeader>

    <MLayoutAside
      v-if="!compact"
      sticky
    >
      <MNavigationRail
        v-model="section"
        :items="navigation"
        :expanded="railExpanded"
        aria-label="Разделы магазина"
      />
    </MLayoutAside>

    <MLayoutMain>
      <OrdersContent />

      <OrdersFab @select="onFab" />

      <NewOrderDialog
        v-model="newOrderOpen"
        @create="createOrder"
      />

      <OrderDetailsSheet
        v-model="detailsOpen"
        :order="detailsOrder"
        @action="runAction"
      />

      <MSnackbar
        v-model="snackbarOpen"
        :label="snackbarMessage"
        :action-label="snackbarAction"
        @action="runSnackbarAction"
      />
    </MLayoutMain>

    <MNavigationBar
      v-if="compact"
      v-model="section"
      :items="navigation"
      aria-label="Разделы магазина"
    />
  </MLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NewOrderDialog from './NewOrderDialog.vue'
import OrderDetailsSheet from './OrderDetailsSheet.vue'
import OrdersAppBar from './OrdersAppBar.vue'
import OrdersContent from './OrdersContent.vue'
import OrdersFab from './OrdersFab.vue'
import type { FabAction } from './data/model'
import { SECTIONS, provideOrdersDashboard } from './useOrdersDashboard'

const dashboard = provideOrdersDashboard()
const { query, snackbar, section, railExpanded, newOrderOpen, detailsOpen, detailsOrder, newOrdersCount, runAction, createOrder } = dashboard
const { filters } = query
const { open: snackbarOpen, message: snackbarMessage, actionLabel: snackbarAction, runAction: runSnackbarAction } = snackbar

// Compact screens trade the rail for a bottom bar. The flag is seeded from the
// request's device class on the server, so the first render already matches.
const { less } = useBreakpoint()
const compact = computed(() => less.value.tabletXs)

const navigation = computed(() => SECTIONS.map(item => ({
  ...item,
  badge: item.id === 'orders' ? newOrdersCount.value : undefined,
})))

function onFab(action: FabAction) {
  if (action === 'order') newOrderOpen.value = true
  else if (action === 'return') snackbar.show('Возврат оформляется из меню «Действия» у доставленного заказа')
  else snackbar.show('Импорт из CSV запущен: заказы появятся в списке после проверки')
}
</script>
