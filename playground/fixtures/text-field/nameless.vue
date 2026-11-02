<template>
  <section class="fixture-nameless">
    <h1>Fields with and without a name</h1>

    <MTextField data-test="nameless-field" />
    <MTextarea data-test="nameless-textarea" />

    <MTextField label="Email" />
    <MTextField aria-label="Search" />
    <MTextarea aria-labelledby="notes-heading" />
    <h2 id="notes-heading">
      Notes
    </h2>
    <MDropdown
      label="Plan"
      :items="plans"
    />
    <MAutocomplete
      aria-label="City"
      :items="cities"
    />
  </section>
</template>

<script setup lang="ts">
const plans = [{ id: 'free', label: 'Free' }, { id: 'pro', label: 'Pro' }]
const cities = [{ id: 'oslo', label: 'Oslo' }, { id: 'rome', label: 'Rome' }]
</script>

<style lang="scss">
.fixture-nameless {
  display: flex;
  flex-direction: column;
  gap: 16rem;
  max-inline-size: 400rem;
}
</style>
