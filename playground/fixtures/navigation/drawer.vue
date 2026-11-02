<template>
  <section
    class="fixture-drawer"
    data-test="drawer-fixture"
  >
    <h1>MNavigationDrawer — drawer</h1>

    <MNavigationDrawer
      v-model="open"
      v-model:current="current"
      :side="side"
      :items="items"
      data-test="drawer"
    >
      <template #activator="{ props: activator }">
        <MButton
          v-bind="activator"
          data-test="open-drawer"
        >
          Open navigation
        </MButton>
      </template>

      <template #header>
        Destinations
      </template>

      <ul
        class="fixture-drawer__list"
        data-test="drawer-list"
      >
        <li
          v-for="destination in destinations"
          :key="destination"
        >
          <a
            class="fixture-drawer__link"
            href="#destination"
            :data-test="`destination-${destination}`"
          >Destination {{ destination }}</a>
        </li>
      </ul>
    </MNavigationDrawer>

    <p
      v-for="paragraph in 30"
      :key="paragraph"
    >
      Page content {{ paragraph }}: the page behind the drawer is long enough to scroll on its own.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MNavigationDrawer from '#kit/components/ui/navigation-drawer/index.vue'
import type { MNavigationDrawerItem, MNavigationDrawerSide } from '#kit/components/ui/navigation-drawer/props'

const route = useRoute()
const side = computed<MNavigationDrawerSide>(() => (route.query.side === 'end' ? 'end' : 'start'))

const open = ref(false)
const current = ref<string | null>('inbox')
const items: MNavigationDrawerItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox', badge: 24, badgeLabel: '24 unread', section: 'Mail' },
  { id: 'sent', icon: 'outline-send', label: 'Sent', section: 'Mail' },
  { id: 'family', icon: 'outline-label', label: 'Family', section: 'Labels' },
  { id: 'archive', icon: 'outline-archive', label: 'Archive', disabled: true, section: 'Labels' },
]
const destinations = Array.from({ length: 40 }, (_, index) => index + 1)
</script>

<style lang="scss">
.fixture-drawer {
  display: grid;
  justify-items: start;
  gap: 8rem;

  &__list {
    display: grid;
    gap: 4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link {
    display: block;
    padding-block: 12rem;
    color: inherit;
  }
}
</style>
