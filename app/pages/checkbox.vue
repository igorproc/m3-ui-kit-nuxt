<script setup lang="ts">
import { boolean, object } from 'yup'

const checked = ref(true)
const formChecked = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-checkbox
      </h2>

      <p class="ui-test-section__description">
        M3 selection controls with State Layers (hover/active circles).
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          States
        </h3>

        <div class="ui-test-grid__form">
          <ui-checkbox
            v-model="checked"
            label="Checked"
          />
          <ui-checkbox
            :model-value="false"
            label="Unchecked"
          />
          <ui-checkbox
            :model-value="true"
            disabled
            label="Checked Disabled"
          />
          <ui-checkbox
            :model-value="false"
            disabled
            label="Unchecked Disabled"
          />
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Validation (Error State)
        </h3>

        <Form
          v-slot="{ errors }"
          :validation-schema="object({
            agree: boolean().oneOf([true], 'Must agree to continue'),
          })"
          :initial-touched="{ agree: true }"
          class="ui-test-grid__form"
        >
          <ui-checkbox
            v-model="formChecked"
            path="agree"
            label="I agree to terms"
          />
          <p
            v-if="errors.agree"
            class="ui-test-grid__debug"
            style="color: var(--color-warn)"
          >
            {{ errors.agree }}
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
  border-radius: 24rem;
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
