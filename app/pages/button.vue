<script setup lang="ts">
const variants = ['elevated', 'filled', 'outlined', 'text', 'tonal'] as const
const colors = ['primary', 'accent', 'warn'] as const

type ButtonVariant = (typeof variants)[number]
type ButtonColor = (typeof colors)[number]

const propsState = reactive<Record<string, boolean>>({
  disabled: false,
})

function toggleDisabled() {
  propsState.disabled = !propsState.disabled
}

const sampleClick = (variant: ButtonVariant, color: ButtonColor) => {
  useConsole().log('[ui-test/button] click', JSON.stringify({ variant, color }))
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-button
      </h2>

      <p class="ui-test-section__description">
        All variants and colors. Toggle props to see bindings in action.
      </p>

      <div class="ui-test-section__controls">
        <label class="ui-test-toggle">
          <input
            v-model="propsState.disabled"
            type="checkbox"
          >
          <span>disabled</span>
        </label>
      </div>
    </header>

    <div class="ui-test-grid">
      <div
        v-for="variant in variants"
        :key="variant"
        class="ui-test-grid__row"
      >
        <h3 class="ui-test-grid__row-title">
          variant="{{ variant }}"
        </h3>

        <div class="ui-test-grid__row-buttons">
          <ui-button
            v-for="color in colors"
            :key="`${variant}-${color}`"
            class="ui-test-grid__button"
            :variant="variant"
            :color="color"
            :disabled="propsState.disabled"
            @click="sampleClick(variant, color)"
          >
            {{ color }}
          </ui-button>
        </div>
      </div>
    </div>

    <div class="ui-test-section__note">
      <h3 class="ui-test-grid__row-title">
        Icons & Slots (M3 Dynamic Padding)
      </h3>
      <div class="ui-test-grid__row-buttons">
        <ui-button :disabled="propsState.disabled">
          <template #prepend>
            <ui-icon name="baseline-add" />
          </template>
          Prepend Icon
        </ui-button>

        <ui-button
          :disabled="propsState.disabled"
          variant="tonal"
        >
          Append Icon
          <template #append>
            <ui-icon name="baseline-check" />
          </template>
        </ui-button>

        <ui-button
          :disabled="propsState.disabled"
          variant="outlined"
        >
          <template #prepend>
            <ui-icon name="baseline-search" />
          </template>
          Both
          <template #append>
            <ui-icon name="baseline-arrow-drop-down" />
          </template>
        </ui-button>

        <ui-button
          :disabled="propsState.disabled"
          variant="text"
        >
          <ui-icon name="baseline-settings" />
        </ui-button>
        <span class="ui-test-grid__row-title">^ Icon Only</span>
      </div>
    </div>

    <div class="ui-test-section__note">
      <p>
        This demo also shows link mode:
      </p>

      <ui-button
        tag="link"
        :to="{ path: '/', query: { from: 'ui-test-button' } }"
        variant="outlined"
      >
        tag="link" with NuxtLink
      </ui-button>
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
    font-family: var(--md-sys-typescale-headline-small-font);
    font-size: var(--md-sys-typescale-headline-small-size);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    font-weight: var(--md-sys-typescale-headline-small-weight);
  }

  &__description {
    margin: 0;
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    color: var(--color-surface-variant-contrast);
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
    margin-top: 4rem;
  }

  &__note {
    margin-top: 8rem;
    display: flex;
    flex-direction: column;
    gap: 8rem;
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

.ui-test-grid {
  display: flex;
  flex-direction: column;
  gap: 16rem;

  &__row {
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__row-title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-small-font);
    font-size: var(--md-sys-typescale-title-small-size);
    line-height: var(--md-sys-typescale-title-small-line-height);
    font-weight: var(--md-sys-typescale-title-small-weight);
    color: var(--color-surface-variant-contrast);
  }

  &__row-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem;
  }

  &__button {
    min-width: 120rem;
  }
}
</style>
