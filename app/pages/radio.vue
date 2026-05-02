<script setup lang="ts">
import { object, string } from 'yup'

const selectedPlan = ref<string | undefined>()
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-radio
      </h2>

      <p class="ui-test-section__description">
        M3 radio buttons with State Layers (hover/active circles).
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Basic group
        </h3>

        <div class="ui-test-grid__column ui-test-grid__column--inner">
          <ui-radio
            v-model="selectedPlan"
            name="plan"
            value="basic"
            label="Basic"
          />
          <ui-radio
            v-model="selectedPlan"
            name="plan"
            value="pro"
            label="Pro"
          />
          <ui-radio
            v-model="selectedPlan"
            name="plan"
            value="enterprise"
            label="Enterprise"
            disabled
          />
        </div>

        <p class="ui-test-grid__debug">
          selectedPlan: {{ selectedPlan }}
        </p>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          With vee-validate
        </h3>

        <Form
          v-slot="{ values, errors }"
          :validation-schema="object({
            plan: string().required('Pick a plan'),
          })"
          class="ui-test-grid__form"
        >
          <div class="ui-test-grid__column ui-test-grid__column--inner">
            <ui-radio
              path="plan"
              name="plan-validated"
              value="basic"
              label="Basic"
            />
            <ui-radio
              path="plan"
              name="plan-validated"
              value="pro"
              label="Pro"
            />
          </div>

          <p class="ui-test-grid__debug">
            values.plan: {{ values.plan }} | errors.plan: {{ errors.plan }}
          </p>
        </Form>
      </div>
    </div>
  </section>
</template>

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
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260rem, 1fr));
  gap: 24rem;

  &__column {
    display: flex;
    flex-direction: column;
    gap: 12rem;

    &--inner {
      padding: 8rem 0;
    }
  }

  &__subtitle {
    margin: 0;
    font-family: var(--md-sys-typescale-title-small-font);
    font-size: var(--md-sys-typescale-title-small-size);
    line-height: var(--md-sys-typescale-title-small-line-height);
    font-weight: var(--md-sys-typescale-title-small-weight);
    color: var(--color-surface-variant-contrast);
  }

  &__debug {
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    font-weight: var(--md-sys-typescale-body-small-weight);
    color: var(--color-surface-variant-contrast);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }
}
</style>
