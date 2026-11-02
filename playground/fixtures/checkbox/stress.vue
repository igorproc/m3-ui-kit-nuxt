<template>
  <section class="fixture-checkbox-stress">
    <h1>MCheckbox — stress content</h1>

    <div
      class="fixture-checkbox-stress__narrow"
      data-test="long-label"
    >
      <MCheckbox
        v-model="long"
        label="Send me a weekly digest of every comment, mention and review request across all the projects I follow"
        helper-text="The digest goes out on Monday morning in the time zone set in your profile"
        required
      />
    </div>

    <div
      class="fixture-checkbox-stress__narrow"
      data-test="long-word"
    >
      <MCheckbox
        v-model="url"
        label="https://example.com/a/very/long/path/without/any/spaces/at/all"
      />
    </div>

    <div
      class="fixture-checkbox-stress__narrow"
      data-test="long-error"
    >
      <MCheckbox
        v-model="terms"
        label="I have read the terms"
        error-message="Accept the terms of service and the privacy policy before you continue to the payment step"
      />
    </div>

    <div data-test="mixed-script">
      <MCheckbox
        v-model="script"
        label="Сохранить 保存 حفظ 🙂"
      />
    </div>

    <h2>Rows with a partial selection</h2>
    <div
      class="fixture-checkbox-stress__rows"
      data-test="rows"
    >
      <div data-test="select-all">
        <MCheckbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          label="Select all files"
          @update:model-value="selectAll"
        />
      </div>
      <div
        v-for="file in files"
        :key="file"
        :data-test="`row-${file}`"
      >
        <MCheckbox
          v-model="selected[file]"
          :label="file"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import MCheckbox from '#kit/components/ui/checkbox/index.vue'

const files = Array.from({ length: 12 }, (_, index) => `report-${String(index + 1).padStart(2, '0')}-quarterly-summary.pdf`)

const long = ref(false)
const url = ref(true)
const terms = ref(false)
const script = ref(false)

const selected = reactive<Record<string, boolean>>(Object.fromEntries(files.map((file, index) => [file, index % 3 === 0])))

const selectedCount = computed(() => files.filter(file => selected[file]).length)
const allSelected = computed(() => selectedCount.value === files.length)
const someSelected = computed(() => selectedCount.value > 0 && !allSelected.value)

function selectAll(next: boolean) {
  for (const file of files) selected[file] = next
}
</script>

<style lang="scss">
.fixture-checkbox-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    inline-size: 200rem;
  }

  &__rows {
    display: grid;
    gap: 0;
    inline-size: 320rem;
  }
}
</style>
