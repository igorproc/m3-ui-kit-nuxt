<template>
  <section class="fixture-stress">
    <h1>MSearch — stress content</h1>

    <div class="fixture-stress__narrow">
      <MSearch
        v-model="long"
        aria-label="Search, long query"
        placeholder="Search every document, message and attachment in the shared workspace"
        clear-label="Clear the query"
        data-test="long"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MSearch
        v-model="word"
        aria-label="Search, unbroken query"
        clear-label="Clear the query"
        data-test="word"
      />
    </div>

    <MSearch
      v-model="mixed"
      aria-label="Поиск 検索 بحث"
      clear-label="Очистить"
      data-test="mixed-script"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MSearch from '#kit/components/ui/search/index.vue'

const long = ref('')
const word = ref('https://example.com/a/very/long/path/without/any/spaces/at/all/that/never/breaks')
const mixed = ref('Сохранить 保存 حفظ 🙂')
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: min(240rem, 100%);
  }
}
</style>
