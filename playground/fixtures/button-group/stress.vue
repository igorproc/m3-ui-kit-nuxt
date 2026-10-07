<template>
  <section class="fixture-group-stress">
    <h1>MButtonGroup — stress content</h1>

    <div class="fixture-group-stress__narrow">
      <MButtonGroup
        v-model="choice"
        :items="longItems"
        aria-label="Long labels"
        data-test="group-long"
      />
    </div>

    <MButtonGroup
      v-model="choice"
      :items="mixedItems"
      aria-label="Mixed scripts"
      data-test="group-mixed"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButtonGroup from '#kit/components/ui/button/group/index.vue'
import type { MButtonGroupItem, MButtonGroupModelValue } from '#kit/components/ui/button/group/props'

const longItems: MButtonGroupItem[] = [
  { label: 'Everything that happened today', value: 'today' },
  { label: 'This week', value: 'week' },
]
const mixedItems: MButtonGroupItem[] = [
  { label: 'Сегодня', value: 'today' },
  { label: '今週', value: 'week' },
  { label: 'هذا الشهر', value: 'month' },
]

const choice = ref<MButtonGroupModelValue>('today')
</script>

<style lang="scss">
.fixture-group-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 200rem;
  }
}
</style>
