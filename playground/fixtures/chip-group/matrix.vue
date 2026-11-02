<template>
  <section class="fixture-chip-group">
    <h1>MChipGroup — state matrix</h1>

    <MChipGroup
      v-model="single"
      label="Delivery"
      data-test="single"
    >
      <MChip
        v-for="option in delivery"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>

    <MChipGroup
      v-model="many"
      label="Toppings"
      helper-text="Up to two"
      :max="2"
      multiple
      required
      data-test="max"
    >
      <MChip
        v-for="option in toppings"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>

    <MChipGroup
      v-model="disabledPick"
      label="Locked"
      disabled
      data-test="disabled"
    >
      <MChip
        v-for="option in delivery"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>

    <MChipGroup
      v-model="mixed"
      label="Mixed set"
      data-test="mixed"
    >
      <MChip
        type="filter"
        value="open"
      >
        Open
      </MChip>
      <MChip
        type="filter"
        value="closed"
        disabled
      >
        Closed
      </MChip>
      <MChip type="assist">
        Help
      </MChip>
      <MChip
        type="filter"
        value="draft"
      >
        Draft
      </MChip>
    </MChipGroup>

    <MChipGroup
      v-model="tags"
      :items="tagItems"
      item-value="id"
      label="Tags from data"
      multiple
      data-test="items"
    >
      <template #item="{ index, props: chip }">
        <MChip
          type="filter"
          v-bind="chip"
        >
          {{ tagItems[index]!.title }}
        </MChip>
      </template>
    </MChipGroup>

    <MChipGroup
      v-model="field"
      label="Topics"
      error-message="Pick at least one topic"
      multiple
      data-test="field-error"
    >
      <MChip
        v-for="option in topics"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>

    <h2>Vertical</h2>
    <MChipGroup
      v-model="vertical"
      label="Sort by"
      direction="vertical"
      data-test="vertical"
    >
      <MChip
        v-for="option in sorts"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>

    <h2>Scrolling row</h2>
    <div class="fixture-chip-group__narrow">
      <MChipGroup
        v-model="scrolled"
        label="Categories"
        :wrap="false"
        data-test="scroll"
      >
        <MChip
          v-for="option in categories"
          :key="option"
          type="filter"
          :value="option"
        >
          {{ option }}
        </MChip>
      </MChipGroup>
    </div>

    <h2>Removable chips</h2>
    <MChipGroup
      label="Recipients"
      data-test="removable"
    >
      <MChip
        v-for="person in people"
        :key="person"
        type="input"
        :value="person"
        removal="whole"
        :remove-label="`Remove ${person}`"
        @remove="people = people.filter(other => other !== person)"
      >
        {{ person }}
      </MChip>
    </MChipGroup>
    <MButton
      variant="outlined"
      data-test="insert"
      @click="insertInMiddle"
    >
      Insert a chip in the middle
    </MButton>
    <MChipGroup
      v-model="ordered"
      label="Order"
      data-test="order"
    >
      <MChip
        v-for="option in order"
        :key="option"
        type="filter"
        :value="option"
      >
        {{ option }}
      </MChip>
    </MChipGroup>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MChip from '#kit/components/ui/chip/index.vue'
import MChipGroup from '#kit/components/ui/chip-group/index.vue'

const delivery = ['Courier', 'Pickup', 'Post']
const toppings = ['Cheese', 'Olives', 'Mushrooms', 'Peppers']
const topics = ['Design', 'Code', 'Research']
const sorts = ['Newest', 'Oldest', 'Most popular']
const categories = ['Electronics and gadgets', 'Home appliances', 'Garden furniture', 'Outdoor equipment', 'Books']
const tagItems = [
  { id: 1, title: 'Urgent' },
  { id: 2, title: 'Billing' },
  { id: 3, title: 'Follow-up' },
]

const single = ref('Courier')
const many = ref<string[]>(['Cheese', 'Olives'])
const disabledPick = ref('Pickup')
const mixed = ref<string>()
const tags = ref<number[]>([2])
const field = ref<string[]>([])
const vertical = ref('Newest')
const scrolled = ref<string>()
const people = ref(['Anna', 'Boris', 'Clara'])
const ordered = ref<string>()
const order = ref(['First', 'Last'])

function insertInMiddle() {
  order.value = ['First', 'Inserted', 'Last']
}
</script>

<style lang="scss">
.fixture-chip-group {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__narrow {
    inline-size: 280rem;
    max-inline-size: 100%;
  }
}
</style>
