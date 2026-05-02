<script setup lang="ts">
import type { UiMenuOrigin } from '~/layers/ui/components/ui/menu/index.vue'

const isOpen = ref(false)
const selectedOrigin = ref<UiMenuOrigin>('top right')

const origins: { label: string, value: UiMenuOrigin }[] = [
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Right', value: 'top right' },
  { label: 'Bottom Left', value: 'bottom left' },
  { label: 'Bottom Right', value: 'bottom right' },
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
]

const items = [
  { id: 1, label: 'Edit', shortcut: 'Ctrl+E' },
  { id: 2, label: 'Duplicate', shortcut: 'Ctrl+D' },
  { id: 3, label: 'Delete', shortcut: 'Del' },
] as const

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}
</script>

<template>
  <section class="ui-test-section">
    <header class="ui-test-section__header">
      <h2 class="ui-test-section__title">
        ui-menu
      </h2>

      <p class="ui-test-section__description">
        Contextual menu surface with list-like items and backdrop click to close.
      </p>
    </header>

    <div class="ui-test-menu-controls">
      <ui-dropdown
        v-model="selectedOrigin"
        label="Menu origin"
        :options="origins"
        variant="outlined"
      />
    </div>

    <div class="ui-test-menu-demo">
      <div class="ui-test-menu-anchor">
        <ui-card
          variant="elevated"
          title="Selected item"
          subtitle="Click the three dots to open menu"
        >
          <template #actions>
            <ui-button
              variant="text"
              color="accent"
              @click="toggleMenu"
            >
              <template #prepend>
                <ui-icon name="baseline-more-vert" />
              </template>

              Actions
            </ui-button>
          </template>
        </ui-card>

        <ui-menu
          v-model="isOpen"
          absolute
          :origin="selectedOrigin"
          class="ui-test-menu-surface"
        >
          <button
            v-for="item in items"
            :key="item.id"
            class="ui-menu__item"
            type="button"
            @click="closeMenu"
          >
            <span class="ui-menu__item-label">
              {{ item.label }}
            </span>

            <span class="ui-menu__item-shortcut">
              {{ item.shortcut }}
            </span>
          </button>
        </ui-menu>
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
    color: var(--color-surface-variant-contrast);

    @include typescale('body-medium');
  }
}

.ui-test-menu-controls {
  max-width: 240rem;
  margin-bottom: 24rem;
}

.ui-test-menu-demo {
  max-width: 420rem;
}

.ui-test-menu-anchor {
  position: relative;
}

.ui-test-menu-surface {
  :deep(.ui-menu__surface) {
    top: 100%;
    right: 0;
    margin-top: 4rem;
    min-width: 160rem;
  }
}
</style>
