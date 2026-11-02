<template>
  <section class="fixture-badge">
    <h1>MBadge — matrix</h1>

    <table class="fixture-badge__table">
      <thead>
        <tr>
          <th scope="col">
            Host
          </th>
          <th
            v-for="content in contents"
            :key="content.id"
            scope="col"
          >
            {{ content.id }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">
            Icon 24
          </th>
          <td
            v-for="content in contents"
            :key="content.id"
          >
            <span
              class="fixture-badge__anchor"
              :data-test="`icon-${content.id}`"
            >
              <MIcon name="outline-inbox" />
              <MBadge
                v-bind="content.props"
                :class="content.props.dot ? 'fixture-badge__small' : 'fixture-badge__large'"
              />
            </span>
          </td>
        </tr>
        <tr>
          <th scope="row">
            Icon button
          </th>
          <td
            v-for="content in contents"
            :key="content.id"
          >
            <MButtonIcon
              :aria-label="`Inbox, ${content.id}`"
              :data-test="`button-${content.id}`"
            >
              <span class="fixture-badge__anchor">
                <MIcon name="outline-inbox" />
                <MBadge
                  v-bind="content.props"
                  :class="content.props.dot ? 'fixture-badge__small' : 'fixture-badge__large'"
                />
              </span>
            </MButtonIcon>
          </td>
        </tr>
      </tbody>
    </table>

    <h2>Navigation hosts</h2>
    <div class="fixture-badge__hosts">
      <div class="fixture-badge__rail">
        <MNavigationRail
          v-model="destination"
          :items="destinations"
          aria-label="Rail destinations"
          data-test="rail"
        />
      </div>
      <MNavigationBar
        v-model="destination"
        class="fixture-badge__bar"
        :items="destinations"
        aria-label="Bar destinations"
        data-test="bar"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MBadge from '#kit/components/ui/badge/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MNavigationBar from '#kit/components/ui/navigation-bar/index.vue'
import MNavigationRail from '#kit/components/ui/navigation-rail/index.vue'
import type { MBadgeProps } from '#kit/components/ui/badge/props'
import type { MNavigationBarItem } from '#kit/components/ui/navigation-bar/props'

interface Content {
  id: string
  props: MBadgeProps
}

const contents: Content[] = [
  { id: 'dot', props: { dot: true } },
  { id: 'one', props: { value: 7 } },
  { id: 'two', props: { value: 42 } },
  { id: 'three', props: { value: 999, max: 999 } },
  { id: 'over', props: { value: 150 } },
  { id: 'text', props: { value: 'Новые' } },
  { id: 'empty', props: {} },
]

const destinations: MNavigationBarItem[] = [
  { id: 'inbox', icon: 'outline-inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread' },
  { id: 'outbox', icon: 'outline-send', label: 'Outbox', badge: true, badgeLabel: 'Not sent yet' },
  { id: 'favorites', icon: 'outline-star', label: 'Favorites', badge: 150, badgeLabel: 'Over 99 new' },
]
const destination = ref<string | null>('outbox')
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/badge/index' as badge;

.fixture-badge {
  display: grid;
  gap: 16rem;
  justify-items: start;

  &__table {
    border-spacing: 24rem 16rem;
  }

  &__anchor {
    position: relative;
    display: inline-flex;
    font-size: 24rem;
  }

  &__large {
    @include badge.badge-anchor(large);
  }

  &__small {
    @include badge.badge-anchor(small);
  }

  &__hosts {
    display: flex;
    align-items: flex-start;
    gap: 24rem;
  }

  &__rail {
    display: flex;
    height: 360rem;
  }

  &__bar {
    width: 400rem;
  }
}
</style>
