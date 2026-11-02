<template>
  <section
    class="fixture-navigation"
    data-test="navigation-fixture"
  >
    <h1>Navigation — matrix</h1>

    <div class="fixture-navigation__row">
      <div class="fixture-navigation__rail">
        <MNavigationRail
          v-model="rail"
          :items="items"
          aria-label="Rail destinations"
          data-test="rail"
          @select="railSelects++"
        />
      </div>

      <div class="fixture-navigation__rail">
        <MNavigationRail
          v-model="rail"
          :items="items"
          expanded
          aria-label="Expanded rail destinations"
          data-test="rail-expanded"
        />
      </div>

      <div class="fixture-navigation__rail">
        <MNavigationRail
          v-model="rail"
          v-model:expanded="modalExpanded"
          :items="items"
          mode="modal"
          aria-label="Modal rail destinations"
          data-test="rail-modal"
        >
          <template #header="{ toggleAttrs }">
            <MButtonIcon
              v-bind="toggleAttrs"
              aria-label="Open navigation"
              data-test="rail-menu"
            >
              <MIcon name="outline-menu" />
            </MButtonIcon>
          </template>
        </MNavigationRail>
      </div>

      <div class="fixture-navigation__rail fixture-navigation__rail--short">
        <MNavigationRail
          :items="manyItems"
          aria-label="Long rail destinations"
          data-test="rail-long"
        />
      </div>

      <div class="fixture-navigation__column">
        <h2>Navigation bar</h2>
        <MNavigationBar
          v-model="bar"
          class="fixture-navigation__bar"
          :items="items"
          aria-label="Bar destinations"
          data-test="bar"
          @select="barSelects++"
        />
        <MNavigationBar
          v-model="bar"
          class="fixture-navigation__bar"
          :items="items"
          icon-placement="start"
          aria-label="Horizontal bar destinations"
          data-test="bar-start"
        />
        <p>
          Rail activations: <span data-test="rail-selects">{{ railSelects }}</span>,
          bar activations: <span data-test="bar-selects">{{ barSelects }}</span>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MNavigationRail from '#kit/components/ui/navigation-rail/index.vue'
import MNavigationBar from '#kit/components/ui/navigation-bar/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MNavigationBarItem } from '#kit/components/ui/navigation-bar/props'

const items: MNavigationBarItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread' },
  { id: 'outbox', icon: 'outline-send', label: 'Outbox' },
  { id: 'favorites', icon: 'outline-star', label: 'Favorites' },
  { id: 'trash', icon: 'outline-delete', label: 'Trash', disabled: true },
]
// More destinations than a short rail fits: its list scrolls.
const manyItems: MNavigationBarItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: `section-${index + 1}`,
  icon: 'outline-folder',
  label: `Section ${index + 1}`,
}))
const modalExpanded = ref(false)

const rail = ref<string | null>('outbox')
const bar = ref<string | null>('outbox')
const railSelects = ref(0)
const barSelects = ref(0)
</script>

<style lang="scss">
.fixture-navigation {
  display: grid;
  gap: 16rem;

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 24rem;
  }

  &__rail {
    display: flex;
    height: 480rem;

    &--short {
      height: 320rem;
    }
  }

  &__column {
    display: grid;
    justify-items: start;
    gap: 16rem;
  }

  &__bar {
    width: 480rem;
  }
}
</style>
