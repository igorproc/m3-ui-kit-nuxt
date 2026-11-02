<template>
  <section class="fixture-chip-group-stress">
    <h1>MChipGroup — stress content</h1>

    <MChipGroup
      v-model="picked"
      label="Every tag in the workspace, including the ones nobody has used for a long while"
      helper-text="Pick as many as you like; the filter keeps the rows that carry any of them"
      multiple
      data-test="many"
    >
      <MChip
        v-for="tag in tags"
        :key="tag"
        type="filter"
        :value="tag"
      >
        {{ tag }}
      </MChip>
    </MChipGroup>

    <div class="fixture-chip-group-stress__narrow">
      <MChipGroup
        v-model="long"
        label="Long labels"
        data-test="long"
      >
        <MChip
          type="filter"
          value="sentence"
        >
          Everything that happened in the shared workspace while you were away
        </MChip>
        <MChip
          type="filter"
          value="url"
        >
          https://example.com/a/very/long/path/without/any/spaces/at/all
        </MChip>
        <MChip
          type="filter"
          value="script"
        >
          Сохранить 保存 حفظ 🙂
        </MChip>
      </MChipGroup>
    </div>

    <div class="fixture-chip-group-stress__narrow">
      <MChipGroup
        v-model="scrolled"
        label="Scrolling"
        :wrap="false"
        data-test="scroll"
      >
        <MChip
          v-for="tag in tags.slice(0, 30)"
          :key="tag"
          type="filter"
          :value="tag"
        >
          {{ tag }}
        </MChip>
      </MChipGroup>
    </div>

    <MChipGroup
      v-model="empty"
      :items="[]"
      label="No items"
      data-test="empty"
    >
      <template #item>
        <span />
      </template>
      <template #empty>
        <span class="fixture-chip-group-stress__empty">Nothing to choose from</span>
      </template>
    </MChipGroup>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MChip from '#kit/components/ui/chip/index.vue'
import MChipGroup from '#kit/components/ui/chip-group/index.vue'

const tags = Array.from({ length: 120 }, (_, index) => `Tag ${index + 1}`)

const picked = ref<string[]>(['Tag 3', 'Tag 60'])
const long = ref<string>()
const scrolled = ref<string>()
const empty = ref<string>()
</script>

<style lang="scss">
.fixture-chip-group-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    inline-size: 240rem;
    max-inline-size: 100%;
  }

  &__empty {
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
