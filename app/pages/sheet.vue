<script setup lang="ts">
import { object, string, boolean } from 'yup'

const isSheetOpen = ref(false)

const email = ref('')
const password = ref('')
const remember = ref(false)
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-sheet
      </h2>

      <p class="ui-test-section__description">
        Bottom sheet based on ui-dialog but without overlay scrim, with drag handle, swipe-to-close gesture and form content.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Sign in sheet
        </h3>

        <ui-button @click="isSheetOpen = true">
          Open sign in sheet
        </ui-button>

        <ui-sheet v-model="isSheetOpen">
          <Form
            v-slot="{ errors }"
            class="ui-test-sheet-form"
            :validation-schema="object({
              email: string().required().email(),
              password: string().required(),
              remember: boolean(),
            })"
          >
            <h3 class="ui-test-sheet-form__title">
              Sign in
            </h3>

            <ui-text-field
              v-model="email"
              path="email"
              label="E-mail"
              placeholder="user@example.com"
              variant="outlined"
            />

            <ui-text-field
              v-model="password"
              path="password"
              label="Password"
              placeholder="••••••••"
              type="password"
              variant="outlined"
            />

            <div class="ui-test-sheet-form__row">
              <ui-checkbox
                v-model="remember"
                path="remember"
                label="Remember me"
              />
            </div>

            <div class="ui-test-sheet-form__actions">
              <ui-button
                type="submit"
                variant="filled"
              >
                Continue
              </ui-button>

              <span class="ui-test-sheet-form__errors">
                {{ Object.keys(errors).length ? 'Fix validation errors to continue' : '' }}
              </span>
            </div>
          </Form>
        </ui-sheet>
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
}

.ui-test-sheet-form {
  display: flex;
  flex-direction: column;
  gap: 16rem;

  &__title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    color: var(--color-on-surface);
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16rem;
  }

  &__errors {
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    line-height: var(--md-sys-typescale-body-small-line-height);
    font-weight: var(--md-sys-typescale-body-small-weight);
    color: var(--color-surface-variant-contrast);
  }
}
</style>
