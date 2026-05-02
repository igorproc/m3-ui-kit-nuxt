<script setup lang="ts">
import { string } from 'yup'

const email = ref('')
const password = ref('')

const filledValue = ref('')
const outlinedValue = ref('')

const disabledFilled = ref(false)
const disabledOutlined = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-text-field__title">
        ui-text-field
      </h2>

      <p class="ui-test-section__description">
        M3 text fields with floating labels, icons, and validation.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Filled (Leading Icon)
        </h3>

        <ui-text-field
          v-model="email"
          path="email"
          label="E-mail"
          placeholder="user@example.com"
          variant="filled"
          helper-text="We'll never share your email."
        >
          <template #prepend>
            <ui-icon name="baseline-mail" />
          </template>
        </ui-text-field>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Outlined (Trailing Icon)
        </h3>

        <ui-text-field
          v-model="password"
          path="password"
          label="Password"
          placeholder="••••••••"
          type="password"
          variant="outlined"
        >
          <template #append>
            <ui-icon name="baseline-visibility" />
          </template>
        </ui-text-field>
      </div>
    </div>

    <div class="ui-test-grid ui-test-grid--secondary">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          States (Filled)
        </h3>

        <div class="ui-test-grid__form">
          <ui-text-field
            model-value="Disabled text"
            disabled
            path="disabled-filled"
            label="Disabled"
            variant="filled"
          />

          <Form
            :validation-schema="{
              error: string().required('This field is required'),
            }"
            :initial-touched="{ error: true }"
          >
            <ui-text-field
              path="error"
              label="Error State"
              variant="filled"
            />
          </Form>
        </div>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          States (Outlined)
        </h3>

        <div class="ui-test-grid__form">
          <ui-text-field
            model-value="Disabled text"
            disabled
            path="disabled-outlined"
            label="Disabled"
            variant="outlined"
          />

          <Form
            :validation-schema="{
              error2: string().required('This field is required'),
            }"
            :initial-touched="{ error2: true }"
          >
            <ui-text-field
              path="error2"
              label="Error State"
              variant="outlined"
            />
          </Form>
        </div>
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

  &--secondary {
    margin-top: 8rem;
  }

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

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12rem;
  }

  &__debug {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    font-weight: var(--md-sys-typescale-body-small-weight);
    color: var(--color-surface-variant-contrast);
  }
}

.ui-test-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8rem;
  cursor: pointer;

  input {
    accent-color: var(--color-primary);
  }
}
</style>
