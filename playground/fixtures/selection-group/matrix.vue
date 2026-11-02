<template>
  <section class="fixture-selection">
    <h1>MSelectionGroup — reference markup</h1>

    <h2 id="plan-label">
      Plan
    </h2>
    <MSelectionGroup
      v-model="plan"
      :items="plans"
      item-value="id"
      pattern="radio"
    >
      <template #default="{ groupAttrs, rows }">
        <div
          v-bind="groupAttrs"
          class="fixture-selection__cards"
          aria-labelledby="plan-label"
          data-test="plans"
        >
          <component :is="rows" />
        </div>
      </template>
      <template #item="{ item, attrs, isSelected, toggle }">
        <div
          v-bind="attrs"
          class="fixture-selection__card"
          :class="{ 'fixture-selection__card--selected': isSelected }"
          tabindex="0"
          :data-test="`plan-${item.id}`"
          @click="toggle"
          @keydown.space.prevent="toggle"
        >
          {{ item.title }}
        </div>
      </template>
    </MSelectionGroup>
    <output data-test="plan">{{ plan ?? '' }}</output>

    <h2 id="toppings-label">
      Toppings (up to two)
    </h2>
    <MSelectionGroup
      v-model="toppings"
      :max="2"
      multiple
      pattern="toggle"
    >
      <template #default="{ groupAttrs }">
        <div
          v-bind="groupAttrs"
          class="fixture-selection__row"
          aria-labelledby="toppings-label"
          data-test="toppings"
        >
          <MSelectionItem
            v-for="topping in toppingList"
            :key="topping"
            v-slot="{ attrs, toggle }"
            :value="topping"
          >
            <button
              v-bind="attrs"
              type="button"
              class="fixture-selection__toggle"
              :data-test="`topping-${topping}`"
              @click="toggle"
            >
              {{ topping }}
            </button>
          </MSelectionItem>
        </div>
      </template>
    </MSelectionGroup>
    <output data-test="toppings-value">{{ toppings.join(', ') }}</output>

    <h2 id="columns-label">
      Columns
    </h2>
    <MSelectionGroup
      v-model="columns"
      :items="columnList"
      multiple
      pattern="option"
    >
      <template #default="{ groupAttrs, rows }">
        <div
          v-bind="groupAttrs"
          class="fixture-selection__list"
          aria-labelledby="columns-label"
          data-test="columns"
        >
          <component :is="rows" />
        </div>
      </template>
      <template #item="{ value, attrs, toggle }">
        <div
          v-bind="attrs"
          class="fixture-selection__option"
          tabindex="0"
          @click="toggle"
          @keydown.space.prevent="toggle"
        >
          {{ value }}
        </div>
      </template>
    </MSelectionGroup>

    <h2 id="locked-label">
      Locked
    </h2>
    <MSelectionGroup
      v-model="locked"
      :items="plans"
      item-value="id"
      pattern="checkbox"
      multiple
      disabled
    >
      <template #default="{ groupAttrs, rows }">
        <div
          v-bind="groupAttrs"
          class="fixture-selection__row"
          aria-labelledby="locked-label"
          data-test="locked"
        >
          <component :is="rows" />
        </div>
      </template>
      <template #item="{ item, attrs }">
        <span
          v-bind="attrs"
          class="fixture-selection__option"
        >
          {{ item.title }}
        </span>
      </template>
    </MSelectionGroup>

    <h2>Rows left to the group</h2>
    <MSelectionGroup
      v-model="plain"
      :items="['one', 'two']"
    >
      <template #default="{ selected }">
        <p data-test="plain-header">
          Selected: {{ selected.join(', ') || 'none' }}
        </p>
      </template>
      <template #item="{ value, isSelected, toggle }">
        <button
          type="button"
          :aria-pressed="isSelected"
          :data-test="`plain-${value}`"
          @click="toggle"
        >
          {{ value }}
        </button>
      </template>
    </MSelectionGroup>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MSelectionGroup from '#kit/components/ui/selection-group/index.vue'
import MSelectionItem from '#kit/components/ui/selection-item/index.vue'

const plans = [
  { id: 'free', title: 'Free' },
  { id: 'pro', title: 'Pro' },
  { id: 'team', title: 'Team' },
]
const toppingList = ['Cheese', 'Ham', 'Olives']
const columnList = ['Name', 'Owner', 'Updated', 'Status']

const plan = ref<string>('pro')
const toppings = ref<string[]>([])
const columns = ref<string[]>(['Name'])
const locked = ref<string[]>(['free'])
const plain = ref<string>()
</script>

<style lang="scss">
.fixture-selection {
  display: grid;
  gap: 12rem;
  justify-items: start;

  &__cards,
  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }

  &__list {
    display: grid;
    gap: 4rem;
  }

  &__card,
  &__option,
  &__toggle {
    padding: 8rem 16rem;
    border: 1rem solid var(--md-sys-color-outline);
    border-radius: 8rem;
    color: var(--md-sys-color-on-surface);
    background: var(--md-sys-color-surface);
    cursor: pointer;

    &:focus-visible {
      outline: 3rem solid var(--md-sys-color-secondary);
      outline-offset: 2rem;
    }
  }

  &__card--selected {
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-secondary-container);
  }
}
</style>
