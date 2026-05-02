<script setup lang="ts">
const isWithIconOpen = ref(false)

const dialogStore = useDialogStore()
const basicDialog = computed(() => dialogStore.modal?.basic)

function openBasicDialog() {
  basicDialog.value?.open()
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-dialog
      </h2>

      <p class="ui-test-section__description">
        Base dialog component integrated with Vue Final Modal. Shows title, icon slot and actions slot.
      </p>
    </header>

    <div class="ui-test-grid">
      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Basic dialog
        </h3>

        <ui-button @click="openBasicDialog">
          Open dialog
        </ui-button>
      </div>

      <div class="ui-test-grid__column">
        <h3 class="ui-test-grid__subtitle">
          Dialog with icon and two actions
        </h3>

        <ui-button
          color="accent"
          @click="isWithIconOpen = true"
        >
          Open dialog with icon
        </ui-button>

        <ui-dialog
          v-model="isWithIconOpen"
          title="Action dialog"
          :click-to-close="false"
        >
          <template #icon>
            <ui-icon name="baseline-info" />
          </template>

          <p>
            This dialog demonstrates <code>click-to-close</code> prop and custom actions.
          </p>

          <template #actions>
            <ui-button
              variant="text"
              @click="isWithIconOpen = false"
            >
              Cancel
            </ui-button>

            <ui-button
              variant="text"
              color="accent"
              @click="isWithIconOpen = false"
            >
              Confirm
            </ui-button>
          </template>
        </ui-dialog>
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
</style>
