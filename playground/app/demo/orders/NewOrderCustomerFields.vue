<template>
  <fieldset class="new-order-group">
    <legend class="new-order-group__legend">
      Покупатель и товар
    </legend>

    <MAutocomplete
      v-model="customerId"
      :items="CUSTOMERS"
      item-value="id"
      label="Покупатель"
      placeholder="Начните вводить имя"
      variant="outlined"
      required
      :error-message="errors.customerId"
    >
      <template #item="{ title, value }">
        <span class="new-order-group__option">
          <span>{{ title }}</span>
          <span class="new-order-group__hint">{{ EMAILS.get(value) }}</span>
        </span>
      </template>
      <template #no-results="{ query }">
        <p class="new-order-group__state">
          Никого не нашли по запросу «{{ query }}»
        </p>
      </template>
    </MAutocomplete>

    <MTextField
      v-model="address"
      label="Адрес доставки"
      placeholder="Город, улица, дом, квартира"
      helper-text="Курьер позвонит за час до приезда"
      autocomplete="street-address"
      variant="outlined"
      required
      :error-message="errors.address"
    />

    <div class="new-order-group__row">
      <MDropdown
        v-model="productId"
        class="new-order-group__grow"
        :items="PRODUCTS"
        item-value="id"
        label="Товар"
        placeholder="Выберите товар"
        variant="outlined"
        required
        :error-message="errors.productId"
      >
        <template #item="{ title, value }">
          <span class="new-order-group__option">
            <span>{{ title }}</span>
            <span class="new-order-group__hint">{{ PRICES.get(value) }}</span>
          </span>
        </template>
      </MDropdown>

      <MNumberInput
        v-model="quantity"
        class="new-order-group__quantity"
        label="Количество"
        locale="ru-RU"
        variant="outlined"
        :min="1"
        :max="20"
        increment-label="Добавить одну штуку"
        decrement-label="Убрать одну штуку"
        :error-message="errors.quantity"
      />
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { money } from './data/format'
import { CUSTOMERS, PRODUCTS } from './data/orders'
import type { NewOrderErrors } from './useNewOrderDraft'

defineProps<{
  errors: NewOrderErrors
}>()

const customerId = defineModel<string | undefined>('customerId', { required: true })
const address = defineModel<string>('address', { required: true })
const productId = defineModel<string | undefined>('productId', { required: true })
const quantity = defineModel<number | null>('quantity', { required: true })

const EMAILS = new Map(CUSTOMERS.map(customer => [customer.id, customer.email]))
const PRICES = new Map(PRODUCTS.map(product => [product.id, money.format(product.price)]))
</script>

<style lang="scss">
.new-order-group {
  display: grid;
  gap: spacing(16);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &__legend {
    margin-block-end: spacing(8);
    padding: 0;
    color: var(--md-sys-color-on-surface);

    @include typescale('title-small');
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: spacing(16);
  }

  &__grow {
    flex: 1 1 260rem;
  }

  &__quantity {
    flex: 0 1 180rem;
  }

  &__option {
    display: grid;
  }

  &__hint {
    color: var(--md-sys-color-on-surface-variant);

    @include typescale('body-small');
  }

  &__state {
    margin: 0;
    padding: spacing(12) spacing(16);
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
