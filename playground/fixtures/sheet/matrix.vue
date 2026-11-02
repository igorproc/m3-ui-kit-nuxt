<template>
  <section class="fixture-sheet">
    <h1>MSheet — matrix</h1>

    <div class="fixture-sheet__row">
      <MButton
        v-for="item in cases"
        :key="item.id"
        variant="outlined"
        :data-test="`open-${item.id}`"
        @click="opened = item.id"
      >
        {{ item.label }}
      </MButton>
    </div>
    <output data-test="result">{{ result }}</output>

    <MSheet
      v-for="item in cases"
      :key="item.id"
      :model-value="opened === item.id"
      :aria-label="item.named ? 'Share' : undefined"
      :aria-labelledby="item.named ? undefined : `${item.id}-heading`"
      :persistent="item.persistent"
      :close-on-swipe="item.swipe ? 'down' : 'none'"
      :data-test="`sheet-${item.id}`"
      @update:model-value="opened = $event ? item.id : ''"
      @confirm="result = `confirm:${$event}`"
      @cancel="result = `cancel:${$event}`"
    >
      <template #default="{ confirm }">
        <h2 :id="`${item.id}-heading`">
          {{ item.label }}
        </h2>
        <MButton
          v-for="target in targets"
          :key="target"
          variant="text"
          :data-test="`${item.id}-${target}`"
          @click="confirm(target)"
        >
          {{ target }}
        </MButton>
      </template>
    </MSheet>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MSheet from '#kit/components/ui/sheet/index.vue'

const cases = [
  { id: 'basic', label: 'Swipe down', named: true, persistent: false, swipe: true },
  { id: 'labelled', label: 'Named by its heading', named: false, persistent: false, swipe: true },
  { id: 'persistent', label: 'Persistent', named: true, persistent: true, swipe: true },
  { id: 'no-swipe', label: 'No swipe', named: true, persistent: false, swipe: false },
]
const targets = ['Copy link', 'Email', 'Print']

const opened = ref('')
const result = ref('')
</script>

<style lang="scss">
.fixture-sheet {
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
