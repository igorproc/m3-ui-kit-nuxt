<template>
  <section class="fixture-app-stress">
    <h1>MApp — stress content</h1>

    <h2>Many overlay owners</h2>
    <div class="fixture-app-stress__fields">
      <MDropdown
        v-for="index in owners"
        :key="index"
        v-model="values[index]"
        :items="items"
        item-title="name"
        item-value="id"
        :label="`Overlay owner ${index}`"
        :data-test="`owner-${index}`"
      />
    </div>

    <h2>Tall content</h2>
    <p
      v-for="index in paragraphs"
      :key="index"
    >
      Paragraph {{ index }} of a page several screens tall: the application background has to
      continue under every line of it, not stop at the first screen.
    </p>

    <p data-test="end">
      End of content
    </p>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MDropdown from '#kit/components/ui/dropdown/index.vue'

const owners = 12
const paragraphs = 60

const items = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]
const values = reactive<Record<number, number | undefined>>({})
</script>

<style lang="scss">
.fixture-app-stress {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  &__fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 240rem), 1fr));
    gap: 12rem;
  }
}
</style>
