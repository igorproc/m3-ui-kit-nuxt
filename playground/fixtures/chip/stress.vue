<template>
  <section class="fixture-chip-stress">
    <h1>MChip — stress content</h1>

    <div class="fixture-chip-stress__narrow">
      <MChip data-test="long-text">
        Everything that happened in the shared workspace while you were away
      </MChip>
    </div>

    <div class="fixture-chip-stress__narrow">
      <MChip
        type="filter"
        data-test="long-word"
      >
        https://example.com/a/very/long/path/without/any/spaces/at/all
      </MChip>
    </div>

    <div class="fixture-chip-stress__narrow">
      <MChip
        type="input"
        removal="button"
        remove-label="Remove the long recipient"
        data-test="long-input"
      >
        <template #avatar>
          <MAvatar
            name="Maximiliana Konstantinopolskaya"
            alt=""
            density="compact"
          />
        </template>
        Maximiliana Konstantinopolskaya-Vasilyevna
      </MChip>
    </div>

    <MChip data-test="one-char">
      ×
    </MChip>

    <MChip
      type="suggestion"
      data-test="mixed-script"
    >
      Сохранить 保存 حفظ 🙂
    </MChip>

    <h2>Many chips in a wrapping row</h2>
    <div
      class="fixture-chip-stress__row"
      data-test="many"
    >
      <MChip
        v-for="tag in tags"
        :key="tag"
        type="filter"
      >
        {{ tag }}
      </MChip>
    </div>
  </section>
</template>

<script setup lang="ts">
import MAvatar from '#kit/components/ui/avatar/index.vue'
import MChip from '#kit/components/ui/chip/index.vue'

const tags = Array.from({ length: 40 }, (_, index) => `Tag ${index + 1}`)
</script>

<style lang="scss">
.fixture-chip-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    inline-size: 200rem;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
    max-inline-size: 100%;
  }
}
</style>
