<template>
  <MDialog
    v-model="open"
    title="Новый заказ"
    :close-on-outside="false"
    @closed="reset"
  >
    <!-- MDialog neither caps its height nor scrolls: the form scrolls inside it instead. -->
    <form
      id="new-order-form"
      class="new-order"
      novalidate
      @submit.prevent="submit"
    >
      <NewOrderCustomerFields
        v-model:customer-id="draft.customerId"
        v-model:address="draft.address"
        v-model:product-id="draft.productId"
        v-model:quantity="draft.quantity"
        :errors="errors"
      />

      <MDivider />

      <NewOrderDeliveryFields
        v-model:date="draft.date"
        v-model:time="draft.time"
        v-model:payment="draft.payment"
        v-model:notify="draft.notify"
        v-model:comment="draft.comment"
        v-model:files="draft.files"
        :errors="errors"
      />
    </form>

    <template #actions>
      <MButton
        variant="text"
        @click="open = false"
      >
        Отмена
      </MButton>
      <MButton
        type="submit"
        form="new-order-form"
      >
        Создать заказ
      </MButton>
    </template>
  </MDialog>
</template>

<script setup lang="ts">
import NewOrderCustomerFields from './NewOrderCustomerFields.vue'
import NewOrderDeliveryFields from './NewOrderDeliveryFields.vue'
import { useNewOrderDraft } from './useNewOrderDraft'
import type { NewOrderDraft } from './useNewOrderDraft'

const emit = defineEmits<{
  (event: 'create', draft: NewOrderDraft): void
}>()

const open = defineModel<boolean>({ required: true })

const { draft, errors, validate, reset } = useNewOrderDraft()

function submit() {
  if (!validate()) return

  emit('create', { ...draft })
  open.value = false
}
</script>

<style lang="scss">
.new-order {
  display: grid;
  gap: spacing(24);
  max-block-size: 65dvh;
  margin-inline: calc(#{spacing(8)} * -1);
  padding-inline: spacing(8);
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
