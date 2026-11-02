<template>
  <section class="fixture-sheet-stress">
    <h1>MSheet — stress content</h1>

    <div class="fixture-sheet-stress__row">
      <MButton
        v-for="id in cases"
        :key="id"
        variant="outlined"
        :data-test="`open-${id}`"
        @click="opened = id"
      >
        {{ id }}
      </MButton>
    </div>
    <output data-test="result">{{ result }}</output>

    <MSheet
      :model-value="opened === 'tall'"
      aria-label="Share targets"
      data-test="sheet-tall"
      @update:model-value="close"
      @cancel="result = `cancel:${$event}`"
    >
      <p
        v-for="line in 40"
        :key="line"
        data-test="tall-row"
      >
        Share target {{ line }}
      </p>
    </MSheet>

    <MSheet
      :model-value="opened === 'long-word'"
      aria-label="Link"
      data-test="sheet-long-word"
      @update:model-value="close"
    >
      https://example.com/a/very/long/path/without/any/spaces/that/must/wrap/inside/the/sheet
    </MSheet>

    <MSheet
      :model-value="opened === 'empty'"
      aria-label="Empty sheet"
      data-test="sheet-empty"
      @update:model-value="close"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MSheet from '#kit/components/ui/sheet/index.vue'

const cases = ['tall', 'long-word', 'empty']
const opened = ref('')
const result = ref('')

function close(open: boolean) {
  if (!open) opened.value = ''
}
</script>

<style lang="scss">
.fixture-sheet-stress {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }
}
</style>
