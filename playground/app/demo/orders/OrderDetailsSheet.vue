<template>
  <MSheet
    v-model="open"
    close-on-swipe="none"
    :aria-labelledby="order ? headingId : undefined"
  >
    <!--
      MSheet neither caps its height nor scrolls, so the content scrolls itself.
      Swipe is off because MSheet swipes from anywhere in its content (it forwards
      no `swipe-banner` slot to limit it to the handle), which would fight that
      scroll. The close button, Escape and the scrim still close it.
    -->
    <div
      v-if="order"
      class="order-sheet"
    >
      <div class="order-sheet__header">
        <div>
          <h2
            :id="headingId"
            class="order-sheet__title"
          >
            Заказ {{ order.number }}
          </h2>
          <p class="order-sheet__subtitle">
            {{ formatDateTime(order.createdAt) }} · {{ order.customer }}
          </p>
        </div>
        <MButtonIcon
          aria-label="Закрыть"
          @click="open = false"
        >
          <MIcon name="ic:outline-close" />
        </MButtonIcon>
      </div>

      <dl class="order-sheet__facts">
        <div
          v-for="fact in facts"
          :key="fact.term"
          class="order-sheet__fact"
        >
          <dt>{{ fact.term }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>

      <MDivider />

      <section aria-labelledby="order-sheet-history">
        <h3
          id="order-sheet-history"
          class="order-sheet__section"
        >
          История
        </h3>
        <MTimeline
          density="compact"
          aria-labelledby="order-sheet-history"
        >
          <MTimelineItem
            v-for="event in history"
            :key="event.id"
            :title="event.title"
            :text="event.text"
            :time="event.time"
            :datetime="event.stamp"
            :icon="event.icon"
            :color="event.color"
            :status="event.outcome"
          />
        </MTimeline>
      </section>

      <MDivider />

      <section aria-labelledby="order-sheet-lines">
        <h3
          id="order-sheet-lines"
          class="order-sheet__section"
        >
          Состав заказа
        </h3>
        <MExpansionPanels multiple>
          <MExpansionPanel
            v-for="line in order.lines"
            :key="line.id"
            :value="line.id"
            :title="line.title"
            :description="`${line.qty} × ${money.format(line.price)}`"
            :heading-level="4"
          >
            <dl class="order-sheet__facts">
              <div class="order-sheet__fact">
                <dt>Артикул</dt>
                <dd>{{ line.sku }}</dd>
              </div>
              <div class="order-sheet__fact">
                <dt>Сумма позиции</dt>
                <dd>{{ money.format(line.qty * line.price) }}</dd>
              </div>
            </dl>
          </MExpansionPanel>
        </MExpansionPanels>
      </section>

      <MDivider inset="center" />

      <div class="order-sheet__actions">
        <MButton
          variant="text"
          @click="emit('action', 'print', order)"
        >
          <template #prepend>
            <MIcon name="ic:outline-print" />
          </template>
          Печать накладной
        </MButton>
        <MButton
          variant="tonal"
          :disabled="order.status !== 'delivered'"
          @click="emit('action', 'return', order)"
        >
          Оформить возврат
        </MButton>
      </div>
    </div>
  </MSheet>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { orderHistory } from './data/history'
import { formatDateTime, money } from './data/format'
import { DELIVERY_LABELS, PAYMENT_LABELS, STATUS_META } from './data/model'
import type { OrderRow, OrderRowAction } from './data/model'

const props = defineProps<{
  order: OrderRow | null
}>()

const emit = defineEmits<{
  (event: 'action', action: OrderRowAction, order: OrderRow): void
}>()

const open = defineModel<boolean>({ required: true })
const headingId = useId()

const history = computed(() => (props.order ? orderHistory(props.order) : []))

const facts = computed(() => {
  const order = props.order
  if (!order) return []

  return [
    { term: 'Статус', value: STATUS_META[order.status].label },
    { term: 'Доставка', value: DELIVERY_LABELS[order.delivery] },
    { term: 'Оплата', value: PAYMENT_LABELS[order.payment] },
    { term: 'Сумма', value: money.format(order.total) },
  ]
})
</script>

<style lang="scss">
.order-sheet {
  display: grid;
  gap: spacing(16);
  max-block-size: 75dvh;
  overflow-y: auto;
  overscroll-behavior: contain;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: spacing(16);
  }

  &__title {
    margin: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('headline-small');
  }

  &__subtitle {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-medium');
  }

  &__section {
    margin: 0 0 spacing(8);
    color: var(--md-sys-color-on-surface);

    @include typescale('title-medium');
  }

  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160rem, 1fr));
    gap: spacing(12);
    margin: 0;
  }

  &__fact {
    dt {
      color: var(--md-sys-color-on-surface-variant);

      @include typescale('label-medium');
    }

    dd {
      margin: 0;
      color: var(--md-sys-color-on-surface);

      @include typescale('body-large');
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: spacing(8);
  }
}
</style>
