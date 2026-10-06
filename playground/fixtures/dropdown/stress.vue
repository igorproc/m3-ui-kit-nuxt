<template>
  <section class="fixture-stress">
    <h1>MDropdown — stress content</h1>

    <div class="fixture-stress__narrow">
      <MDropdown
        v-model="longValue"
        :items="long"
        item-title="name"
        item-value="id"
        label="Shipping method as it appears on the carrier's invoice"
        data-test="long"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MDropdown
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
      <MDropdown
        v-model="huge"
        :items="many"
        item-title="name"
        item-value="id"
        label="A thousand rows"
        data-test="huge"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MDropdown
        :items="[]"
        label="Nothing to choose"
        data-test="empty"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MDropdown
        :items="[]"
        loading
        label="Still loading"
        data-test="loading"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MDropdown
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
import MDropdown from '#kit/components/ui/dropdown/index.vue'

const long = [
  { id: 1, name: 'Express overnight delivery with signature on receipt and insurance up to the declared value' },
  { id: 2, name: 'https://example.com/a/very/long/path/without/any/spaces/at/all/that/never/breaks' },
  { id: 3, name: 'X' },
  { id: 4, name: '' },
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
const huge = ref(500)
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
