<template>
  <section
    class="fixture-navigation-stress"
    data-test="navigation-stress-fixture"
  >
    <h1>Navigation — stress</h1>

    <div class="fixture-navigation-stress__row">
      <div class="fixture-navigation-stress__rail">
        <MNavigationRail
          v-model="rail"
          v-model:expanded="expanded"
          :items="railItems"
          aria-label="Toggle rail destinations"
          data-test="rail-toggle"
        >
          <template #header="{ toggleAttrs }">
            <MButtonIcon
              v-bind="toggleAttrs"
              aria-label="Toggle navigation"
              data-test="rail-toggle-menu"
            >
              <MIcon name="outline-menu" />
            </MButtonIcon>
          </template>
        </MNavigationRail>
      </div>

      <div class="fixture-navigation-stress__rail">
        <MNavigationRail
          v-model="rail"
          :items="railItems"
          expanded
          aria-label="Expanded stress rail"
          data-test="rail-stress-expanded"
        />
      </div>

      <div class="fixture-navigation-stress__column">
        <MNavigationBar
          v-model="bar"
          class="fixture-navigation-stress__bar"
          :items="barItems"
          aria-label="Six destinations"
          data-test="bar-stress"
        />
        <MNavigationBar
          v-model="bar"
          class="fixture-navigation-stress__bar"
          :items="barItems.slice(0, 3)"
          icon-placement="start"
          aria-label="Three horizontal destinations"
          data-test="bar-stress-start"
        />
        <MNavigationBar
          :items="[]"
          class="fixture-navigation-stress__bar"
          aria-label="No destinations"
          data-test="bar-empty"
        />
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

const barItems: MNavigationBarItem[] = [
  { id: 'home', icon: 'outline-home', label: 'Home' },
  { id: 'messages', icon: 'outline-chat', label: 'Messages and conversations', badge: 999, badgeLabel: '999 new' },
  { id: 'calendar', icon: 'outline-calendar-month', label: 'Calendar' },
  { id: 'files', icon: 'outline-folder', label: 'Files', badge: true, badgeLabel: 'Changed' },
  { id: 'people', icon: 'outline-people', label: 'Supercalifragilisticexpialidocious' },
  { id: 'settings', icon: 'outline-settings', label: 'Settings' },
]

const railItems: MNavigationBarItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox', badge: 999, badgeLabel: '999 unread' },
  { id: 'outbox', icon: 'outline-send', label: 'Outbox with a label far too long for the rail' },
  { id: 'favorites', icon: 'outline-star', label: 'Favorites', badge: true, badgeLabel: 'Updated' },
  { id: 'word', icon: 'outline-folder', label: 'Supercalifragilisticexpialidocious' },
  { id: 'trash', icon: 'outline-delete', label: 'Trash', disabled: true },
]

const rail = ref<string | null>('inbox')
const expanded = ref(false)
const bar = ref<string | null>('messages')
</script>

<style lang="scss">
.fixture-navigation-stress {
  display: grid;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 24rem;
  }

  &__rail {
    display: flex;
    height: 480rem;
  }

  &__column {
    display: grid;
    justify-items: start;
    gap: 16rem;
    max-width: 100%;
  }

  &__bar {
    width: 360rem;
    max-width: 100%;
  }
}
</style>
