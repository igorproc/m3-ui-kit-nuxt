<template>
  <m-layout class="layout-youtube">
    <m-layout-header size-token="--ui-app-bar-height-small">
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
    </m-layout-header>

    <m-layout-aside
      position="left"
      :size-token="isMobile ? undefined : sidebarSizeToken"
    >
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
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <m-navigation-bar
        v-if="isMobile"
        v-model="mobileNav"
        :items="mobileNavItems"
      />
    </m-layout-footer>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '../../shared/constants/icons'

const bp = useBreakpoint()
const isMobile = computed(() => bp.less.value.tablet)
const searchQuery = ref('')
const sidebarExpanded = ref(true)
const activeSidebarItem = ref('home')
const mobileNav = ref('home')

// Размеры зон — пропсами зон в шаблоне (бывшие top-level useLayoutItem-вызовы
// были мёртвым кодом: над лейаут-компонентом нет m-layout-предка)
const sidebarSizeToken = computed(() =>
  sidebarExpanded.value
    ? '--ui-navigation-rail-width-expanded'
    : '--ui-navigation-rail-width',
)

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
</script>
