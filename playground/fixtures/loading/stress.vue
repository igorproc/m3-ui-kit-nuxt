<template>
  <section class="fixture-loading-stress">
    <h1>MLoading — stress</h1>

    <div
      class="fixture-loading-stress__grid"
      data-test="many"
    >
      <MLoading
        v-for="index in 20"
        :key="index"
        :type="index % 2 ? 'circular' : 'expressive'"
        :aria-label="`Loading ${index}`"
      />
    </div>

    <p
      class="fixture-loading-stress__long"
      data-test="long-text"
    >
      A paragraph long enough to wrap over several lines at a narrow width, with an indicator
      <MLoading
        inline
        aria-label="Loading, inline"
      />
      in the middle of a line, and a heading-sized one below.
    </p>

    <h2 class="fixture-loading-stress__heading">
      Heading
      <MLoading
        inline
        type="expressive"
        aria-label="Loading, heading"
        data-test="inline-heading"
      />
    </h2>
  </section>
</template>

<script setup lang="ts">
import MLoading from '#kit/components/ui/loading/index.vue'
</script>

<style lang="scss">
.fixture-loading-stress {
  display: grid;
  gap: 16rem;

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }

  &__long {
    max-width: 320rem;
  }

  &__heading {
    font-size: 40rem;
  }
}
</style>
