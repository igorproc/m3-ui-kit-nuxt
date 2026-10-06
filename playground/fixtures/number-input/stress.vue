<template>
  <section class="fixture-stress">
    <h1>MNumberInput — stress content</h1>

    <div class="fixture-stress__narrow">
      <MNumberInput
        :model-value="12"
        label="Maximum number of concurrent connections allowed per worker process"
        helper-text="Applies to every worker in the pool, including the ones started after a configuration reload"
        data-test="long-label"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MNumberInput
        :model-value="12"
        variant="outlined"
        label="Maximum number of concurrent connections allowed per worker process"
        data-test="long-label-outlined"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MNumberInput
        :model-value="240"
        controls="scrub"
        label="Horizontal offset from the containing block"
        data-test="long-scrub"
      />
    </div>

    <div class="fixture-stress__medium">
      <MNumberInput
        :model-value="3"
        :units="['requests-per-second-per-tenant', 'rps']"
        unit="requests-per-second-per-tenant"
        label="Rate"
        data-test="long-unit"
      />
    </div>

    <div class="fixture-stress__narrow">
      <MNumberInput
        :model-value="1"
        label="Callback"
        error-message="https://example.com/a/very/long/path/without/any/spaces/at/all"
        data-test="long-word"
      />
    </div>

    <MNumberInput
      :model-value="null"
      label="Empty"
      data-test="empty"
    />

    <MNumberInput
      :model-value="999999999999999"
      label="Huge"
      data-test="huge"
    />

    <MNumberInput
      :model-value="-1234.5678"
      :precision="4"
      label="Negative fraction"
      data-test="negative"
    />

    <MNumberInput
      :model-value="1234567.89"
      :step="0.01"
      locale="de-DE"
      label="Betrag"
      data-test="locale"
    />

    <MNumberInput
      :model-value="7"
      label="Сохранить 保存 حفظ 🙂"
      unit="шт."
      data-test="mixed-script"
    />
  </section>
</template>

<script setup lang="ts">
import MNumberInput from '#kit/components/ui/number-input/index.vue'
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__narrow {
    width: 200rem;
  }

  // Split zones and a unit menu leave no room for a value below this width.
  &__medium {
    width: 280rem;
  }
}
</style>
