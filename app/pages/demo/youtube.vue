<template>
  <NuxtLayout name="youtube">
    <!-- Top Header -->
    <template #header>
      <div class="demo-youtube__header">
        <div class="demo-youtube__header-start">
          <m-button
            variant="text"
            class="demo-youtube__icon-btn"
            @click="toggleSidebar"
          >
            <m-icon :name="ICONS.menu" />
          </m-button>
          <div class="demo-youtube__logo">
            <m-icon :name="ICONS.playCircle" />
            <span class="demo-youtube__logo-text">YouTube</span>
          </div>
        </div>

        <div class="demo-youtube__header-center">
          <m-search
            v-model="searchQuery"
            placeholder="Search"
            class="demo-youtube__search"
          />
        </div>

        <div class="demo-youtube__header-end">
          <m-button
            variant="text"
            class="demo-youtube__icon-btn"
          >
            <m-icon :name="ICONS.notifications" />
          </m-button>
          <m-button
            variant="text"
            class="demo-youtube__icon-btn demo-youtube__avatar"
          >
            <m-icon :name="ICONS.accountCircle" />
          </m-button>
        </div>
      </div>
    </template>

    <!-- Left Sidebar -->
    <template #sidebar>
      <div
        v-if="!isMobile"
        class="demo-youtube__sidebar"
      >
        <div class="demo-youtube__sidebar-section">
          <button
            v-for="item in sidebarMainItems"
            :key="item.id"
            class="demo-youtube__sidebar-item"
            :class="{ 'demo-youtube__sidebar-item--active': activeSidebarItem === item.id }"
            @click="activeSidebarItem = item.id"
          >
            <m-icon
              :name="item.icon"
              class="demo-youtube__sidebar-icon"
            />
            <span class="demo-youtube__sidebar-label">{{ item.label }}</span>
          </button>
        </div>

        <m-divider v-if="sidebarExpanded" />

        <div
          v-if="sidebarExpanded"
          class="demo-youtube__sidebar-section"
        >
          <h4 class="demo-youtube__sidebar-heading">
            Explore
          </h4>
          <button
            v-for="item in sidebarExploreItems"
            :key="item.id"
            class="demo-youtube__sidebar-item"
            @click="activeSidebarItem = item.id"
          >
            <m-icon
              :name="item.icon"
              class="demo-youtube__sidebar-icon"
            />
            <span class="demo-youtube__sidebar-label">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Main Content -->
    <div class="demo-youtube__content">
      <!-- Chip Filters -->
      <div class="demo-youtube__filters">
        <m-chip
          v-for="filter in filters"
          :key="filter"
          variant="filter"
          :selected="selectedFilter === filter"
          @click="selectedFilter = filter"
        >
          {{ filter }}
        </m-chip>
      </div>

      <!-- Video Grid -->
      <div class="demo-youtube__grid">
        <article
          v-for="video in videos"
          :key="video.id"
          class="demo-youtube__video-card"
        >
          <div
            class="demo-youtube__thumbnail"
            :style="{ backgroundColor: video.color }"
          >
            <m-icon
              :name="ICONS.playCircle"
              class="demo-youtube__play-icon"
            />
            <span class="demo-youtube__duration">{{ video.duration }}</span>
          </div>
          <div class="demo-youtube__video-info">
            <m-icon
              :name="ICONS.accountCircle"
              class="demo-youtube__channel-avatar"
            />
            <div class="demo-youtube__video-meta">
              <h3 class="demo-youtube__video-title">
                {{ video.title }}
              </h3>
              <span class="demo-youtube__channel-name">{{ video.channel }}</span>
              <span class="demo-youtube__video-stats">{{ video.views }} views · {{ video.time }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <template #footer>
      <!-- Mobile Bottom Nav -->
      <m-navigation-bar
        v-if="isMobile"
        v-model="mobileNav"
        :items="mobileNavItems"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

const bp = useBreakpoint()
const isMobile = computed(() => bp.less.value.tablet)
const searchQuery = ref('')
const sidebarExpanded = ref(true)
const activeSidebarItem = ref('home')
const selectedFilter = ref('All')
const mobileNav = ref('home')

// Self-register custom elements in layout system
const { layoutItemStyles: headerStyles } = useLayoutItem({
  id: 'youtube-header',
  area: 'header',
  sizeToken: '--ui-app-bar-height-small',
})

const sidebarSizeToken = computed(() =>
  sidebarExpanded.value
    ? '--ui-navigation-rail-width-expanded'
    : '--ui-navigation-rail-width',
)

const { layoutItemStyles: sidebarStyles } = useLayoutItem({
  id: 'youtube-sidebar',
  area: 'left',
  sizeToken: sidebarSizeToken,
})

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

const sidebarMainItems = [
  { id: 'home', icon: ICONS.home, label: 'Home' },
  { id: 'shorts', icon: ICONS.whatshot, label: 'Shorts' },
  { id: 'subscriptions', icon: ICONS.subscriptions, label: 'Subscriptions' },
  { id: 'library', icon: ICONS.videoLibrary, label: 'Library' },
  { id: 'history', icon: ICONS.history, label: 'History' },
]

const sidebarExploreItems = [
  { id: 'trending', icon: ICONS.trendingUp, label: 'Trending' },
  { id: 'music', icon: ICONS.musicNote, label: 'Music' },
  { id: 'movies', icon: ICONS.movie, label: 'Movies' },
  { id: 'gaming', icon: ICONS.videogameAsset, label: 'Gaming' },
  { id: 'sports', icon: ICONS.sportsSoccer, label: 'Sports' },
]

const mobileNavItems = [
  { id: 'home', icon: ICONS.home, label: 'Home' },
  { id: 'shorts', icon: ICONS.whatshot, label: 'Shorts' },
  { id: 'subscriptions', icon: ICONS.subscriptions, label: 'Subscriptions' },
  { id: 'library', icon: ICONS.videoLibrary, label: 'Library' },
]

const filters = ['All', 'Music', 'Gaming', 'Live', 'News', 'Sports', 'Comedy', 'Podcasts', 'Recently uploaded', 'Watched']

const videos = [
  { id: 1, title: 'Building a Modern Layout System with CSS Grid', channel: 'Dev Mastery', views: '254K', time: '2 days ago', duration: '18:42', color: '#1a237e' },
  { id: 2, title: 'Material Design 3: What\'s New in 2026', channel: 'Google Design', views: '1.2M', time: '1 week ago', duration: '12:05', color: '#4a148c' },
  { id: 3, title: '10 VS Code Extensions You Need in 2026', channel: 'Fireship', views: '892K', time: '3 days ago', duration: '8:24', color: '#006064' },
  { id: 4, title: 'Vue 3 Composition API Deep Dive', channel: 'Vue Mastery', views: '156K', time: '5 days ago', duration: '45:10', color: '#1b5e20' },
  { id: 5, title: 'The Future of Web Development', channel: 'Traversy Media', views: '678K', time: '1 day ago', duration: '22:33', color: '#b71c1c' },
  { id: 6, title: 'CSS Container Queries Tutorial', channel: 'Kevin Powell', views: '342K', time: '4 days ago', duration: '15:18', color: '#e65100' },
  { id: 7, title: 'TypeScript 6.0: Complete Overview', channel: 'Matt Pocock', views: '521K', time: '6 hours ago', duration: '28:45', color: '#283593' },
  { id: 8, title: 'Nuxt 4: Everything You Need to Know', channel: 'Alexander Lichter', views: '198K', time: '2 weeks ago', duration: '35:12', color: '#004d40' },
  { id: 9, title: 'Advanced SCSS Architecture Patterns', channel: 'DesignCourse', views: '87K', time: '1 week ago', duration: '19:55', color: '#880e4f' },
  { id: 10, title: 'Building Steam-like UI with Web Technologies', channel: 'Hyperplexed', views: '445K', time: '3 days ago', duration: '24:08', color: '#311b92' },
  { id: 11, title: 'Zero CLS: Performance Secrets of Top Sites', channel: 'web.dev', views: '312K', time: '5 days ago', duration: '16:30', color: '#0d47a1' },
  { id: 12, title: 'Responsive Design in 2026: What Changed?', channel: 'Jen Simmons', views: '267K', time: '1 week ago', duration: '21:15', color: '#bf360c' },
]
</script>

<style lang="scss">
.demo-youtube {
  background-color: var(--color-background);
  color: var(--color-background-contrast);

  /* ── Header ── */
  &__header {
    display: flex;
    align-items: center;
    gap: 16rem;
    padding: 0 16rem;
    height: 64rem;
    background-color: var(--color-surface);
    border-bottom: 1rem solid var(--color-outline-variant);

    @media (max-width: 480px) {
      gap: 8rem;
      padding: 0 8rem;
    }
  }

  &__header-start {
    display: flex;
    align-items: center;
    gap: 8rem;
    flex-shrink: 0;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 4rem;
    color: var(--color-primary);
    font-size: 24rem;
  }

  &__logo-text {
    font-weight: 700;

    @include typescale('title-large');

    @media (max-width: 480px) {
      display: none;
    }
  }

  &__header-center {
    flex: 1;
    max-width: 640rem;
    margin: 0 auto;

    @media (max-width: 480px) {
      max-width: 100%;
    }
  }

  &__search {
    width: 100%;
  }

  &__header-end {
    display: flex;
    align-items: center;
    gap: 4rem;
    flex-shrink: 0;
  }

  &__icon-btn {
    min-width: auto !important;
    padding: 8rem !important;
    border-radius: 50% !important;
  }

  &__avatar {
    font-size: 28rem;
    color: var(--color-primary);
  }

  /* ── Sidebar ── */
  &__sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12rem 0;
    background-color: var(--color-surface);
    border-right: 1rem solid var(--color-outline-variant);
  }

  &__sidebar-section {
    display: flex;
    flex-direction: column;
    padding: 0 12rem;
  }

  &__sidebar-heading {
    margin: 8rem 0;
    padding: 0 12rem;
    color: var(--color-surface-variant-contrast);

    @include typescale('title-small');
  }

  &__sidebar-item {
    display: flex;
    align-items: center;
    gap: 24rem;
    padding: 10rem 12rem;
    border: none;
    background: transparent;
    color: var(--color-surface-contrast);
    cursor: pointer;
    border-radius: var(--sys-shape-corner-small, 8rem);
    transition: background 100ms;
    width: 100%;

    @include typescale('body-medium');

    &:hover {
      background: color-mix(in srgb, var(--color-surface-contrast) 8%, transparent);
    }

    &--active {
      background: color-mix(in srgb, var(--color-primary) 12%, transparent);
      color: var(--color-primary);

      .demo-youtube__sidebar-icon {
        color: var(--color-primary);
      }
    }
  }

  &__sidebar-icon {
    font-size: 22rem;
    flex-shrink: 0;
    color: var(--color-surface-variant-contrast);
  }

  &__sidebar-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Content ── */
  &__content {
    display: flex;
    flex-direction: column;
    gap: 24rem;
    padding: 16rem 24rem;

    @media (max-width: 768px) {
      padding: 12rem 16rem;
      gap: 16rem;
    }

    @media (max-width: 480px) {
      padding: 8rem 12rem;
    }
  }

  /* ── Filters ── */
  &__filters {
    display: flex;
    gap: 8rem;
    overflow-x: auto;
    padding-bottom: 4rem;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  /* ── Video Grid ── */
  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rem;

    @media (max-width: 1400px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__video-card {
    display: flex;
    flex-direction: column;
    gap: 12rem;
    cursor: pointer;

    &:hover .demo-youtube__thumbnail {
      opacity: 0.85;
    }
  }

  &__thumbnail {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--sys-shape-corner-medium, 12rem);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 150ms;
    overflow: hidden;
  }

  &__play-icon {
    font-size: 48rem;
    color: rgb(255 255 255 / 60%);
    opacity: 0;
    transition: opacity 200ms;

    .demo-youtube__video-card:hover & {
      opacity: 1;
    }
  }

  &__duration {
    position: absolute;
    bottom: 8rem;
    right: 8rem;
    background: rgb(0 0 0 / 80%);
    color: #fff;
    padding: 2rem 6rem;
    border-radius: 4rem;

    @include typescale('label-small');
  }

  &__video-info {
    display: flex;
    gap: 12rem;
  }

  &__channel-avatar {
    font-size: 36rem;
    color: var(--color-surface-variant-contrast);
    flex-shrink: 0;
    margin-top: 2rem;
  }

  &__video-meta {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    min-width: 0;
  }

  &__video-title {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    @include typescale('title-small');
  }

  &__channel-name {
    color: var(--color-surface-variant-contrast);

    @include typescale('body-small');
  }

  &__video-stats {
    color: var(--color-surface-variant-contrast);

    @include typescale('body-small');
  }
}
</style>
