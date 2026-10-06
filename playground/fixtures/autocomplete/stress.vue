<template>
  <section class="fixture-stress">
    <h1>MAutocomplete — stress content</h1>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        v-model="longValue"
        :items="long"
        item-title="name"
        item-value="id"
        label="Billing contact as it appears on the signed purchase order"
        data-test="long"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        v-model="chips"
        :items="many"
        item-title="name"
        item-value="id"
        multiple
        clearable
        label="Many chips"
        data-test="chips"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        :items="many"
        item-title="name"
        item-value="id"
        label="A thousand rows"
        data-test="huge"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        :items="[]"
        label="Nothing to search"
        data-test="empty"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        :items="[]"
        loading
        label="Still loading"
        data-test="loading"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MAutocomplete
        :items="scripts"
        item-title="name"
        item-value="id"
        variant="outlined"
        label="Имя 名前 الاسم 🙂"
        data-test="mixed-script"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MAutocomplete from '#kit/components/ui/autocomplete/index.vue'

const long = [
  { id: 1, name: 'averyveryverylongemailaddresswithoutanybreak@example-domain-that-is-long.com' },
  { id: 2, name: 'Procurement, accounts payable and the regional finance controller for Northern Europe' },
  { id: 3, name: 'X' },
]

const many = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1, name: `Option ${index + 1}` }))

const scripts = [
  { id: 1, name: 'Москва' },
  { id: 2, name: '東京' },
  { id: 3, name: 'القاهرة' },
  { id: 4, name: '🙂 Emoji row' },
]

const longValue = ref(1)
const chips = ref(Array.from({ length: 12 }, (_, index) => index + 1))
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  gap: 16rem;
}

.fixture-stress__narrow {
  max-width: 280rem;
}
</style>
