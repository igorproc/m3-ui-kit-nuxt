<template>
  <section class="fixture-chip">
    <h1>MChip — state matrix</h1>

    <div class="fixture-chip__row">
      <MChip
        v-for="type in types"
        :key="type"
        :type="type"
        :data-test="`type-${type}`"
      >
        {{ type }}
      </MChip>
    </div>

    <h2>Standalone filter</h2>
    <div class="fixture-chip__row">
      <MChip
        v-model="filterOn"
        type="filter"
        data-test="filter-on"
      >
        Unread
      </MChip>
      <MChip
        v-model="filterOff"
        type="filter"
        data-test="filter-off"
      >
        Starred
      </MChip>
      <MChip
        type="filter"
        disabled
        data-test="filter-disabled"
      >
        Archived
      </MChip>
    </div>

    <h2>Elevated</h2>
    <div class="fixture-chip__row">
      <MChip
        v-for="type in elevatedTypes"
        :key="type"
        :type="type"
        variant="elevated"
        :data-test="`elevated-${type}`"
      >
        {{ type }}
      </MChip>
      <MChip
        v-model="elevatedOn"
        type="filter"
        variant="elevated"
        data-test="elevated-filter-on"
      >
        Selected
      </MChip>
      <MChip
        type="assist"
        variant="elevated"
        disabled
        data-test="elevated-disabled"
      >
        Disabled
      </MChip>
    </div>

    <h2>Input chips</h2>
    <div class="fixture-chip__row">
      <MChip
        v-for="person in people"
        :key="person"
        type="input"
        removal="button"
        :remove-label="`Remove ${person}`"
        :data-test="`input-${person}`"
        @remove="people = people.filter(other => other !== person)"
      >
        <template #avatar>
          <MAvatar
            :name="person"
            alt=""
            density="compact"
          />
        </template>
        {{ person }}
      </MChip>
      <MChip
        type="input"
        removal="button"
        remove-label="Remove Berlin"
        data-test="input-icon"
      >
        <template #icon>
          <MIcon :name="ICONS.home" />
        </template>
        Berlin
      </MChip>
      <MChip
        type="input"
        removal="whole"
        remove-label="Remove Paris"
        data-test="input-whole"
      >
        Paris
      </MChip>
      <MChip
        type="input"
        removal="button"
        remove-label="Remove Rome"
        disabled
        data-test="input-disabled"
      >
        Rome
      </MChip>
    </div>
    <output data-test="people">{{ people.join(', ') }}</output>

    <h2>Cut-off label</h2>
    <div class="fixture-chip__tight">
      <MChip data-test="cut">
        Electronics, gadgets and accessories
      </MChip>
      <MChip data-test="fits">
        Home
      </MChip>
    </div>

    <h2>Group without wrap</h2>
    <div
      class="fixture-chip__narrow"
      data-test="scroll-group"
    >
      <MChipGroup
        v-model="picked"
        :wrap="false"
        aria-label="Categories"
      >
        <MChip
          v-for="item in categories"
          :key="item"
          type="filter"
          :value="item"
        >
          {{ item }}
        </MChip>
      </MChipGroup>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MAvatar from '#kit/components/ui/avatar/index.vue'
import MChip from '#kit/components/ui/chip/index.vue'
import MChipGroup from '#kit/components/ui/chip-group/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const types = ['assist', 'filter', 'input', 'suggestion'] as const
const elevatedTypes = ['assist', 'filter', 'suggestion'] as const
const elevatedOn = ref(true)
const people = ref(['Anna', 'Boris'])
const filterOn = ref(true)
const filterOff = ref(false)
const picked = ref<string>()
const categories = ['Electronics and gadgets', 'Home appliances', 'Garden furniture', 'Outdoor equipment']
</script>

<style lang="scss">
.fixture-chip {
  display: flex;
  flex-direction: column;
  gap: 12rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }

  &__narrow {
    width: 280rem;
  }

  &__tight {
    display: flex;
    gap: 8rem;
    width: 200rem;
  }
}
</style>
