<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-date-picker
      </h2>

      <p class="ui-test-section__description">
        M3 Date Picker with calendar and year views, powered by dayjs.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Standard Date Picker
        </h3>

        <div class="ui-test-date-picker-container">
          <ui-date-picker
            v-model="selectedDate"
            @confirm="onConfirm"
            @cancel="onCancel"
          />
        </div>

        <p class="ui-test-grid__debug">
          Selected: {{ selectedDate ? selectedDate.toLocaleString() : 'None' }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const selectedDate = ref<Date | null>(null)

function onConfirm(date: Date) {
  console.log('Confirmed:', date)
}

function onCancel() {
  console.log('Cancelled')
}
</script>

<style lang="scss">
.ui-test-section {
  display: flex;
  flex-direction: column;
  gap: 16rem;
  padding: 24rem;
  border-radius: var(--sys-shape-corner-medium);
  background-color: var(--color-surface);
  color: var(--color-surface-contrast);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 8%);

  &__header {
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__title {
    margin: 0;

    @include typescale('headline-small');
  }

  &__description {
    margin: 0;

    @include typescale('body-medium');

    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320rem, 1fr));
  gap: 24rem;

  &__column {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }

  &__subtitle {
    margin: 0;

    @include typescale('title-small');

    color: var(--color-surface-variant-contrast);
  }

  &__debug {
    @include typescale('body-small');

    color: var(--color-surface-variant-contrast);
    background: var(--color-surface-container);
    padding: 8rem;
    border-radius: 8rem;
  }
}

.ui-test-date-picker-container {
  display: flex;
  justify-content: center;
  padding: 16rem;
  background: var(--color-surface-container-low);
  border-radius: 16rem;
}
</style>
