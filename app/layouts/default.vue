<template>
  <m-layout class="layout-default">
    <m-layout-header>
      <m-app-bar title="Material Design 3">
        <template #nav>
          <m-button
            variant="text"
            class="demo-material__menu-btn"
            @click="toggleDrawer"
          >
            <m-icon :name="ICONS.menu" />
          </m-button>
        </template>

        <template #actions>
          <m-search
            v-model="searchQuery"
            placeholder="Search components..."
            class="demo-material__search"
          />
          <m-button
            variant="text"
            @click="toggleTheme"
          >
            <m-icon :name="isDark ? ICONS.lightMode : ICONS.darkMode" />
          </m-button>
        </template>
      </m-app-bar>
    </m-layout-header>

    <m-layout-aside position="left">
      <m-navigation-rail
        v-if="!isMobile"
        v-model="activeNav"
        :items="navItems"
        :expanded="drawerExpanded"
      />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <m-navigation-bar
        v-if="isMobile"
        v-model="activeNav"
        :items="navItems"
      />
    </m-layout-footer>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '#shared/constants/icons'

const bp = useBreakpoint()
const isMobile = computed(() => bp.is.value.mobile)
const isDark = ref(false)
const searchQuery = ref('')
const activeNav = ref('components')
const drawerExpanded = ref(false)

function toggleDrawer() {
  drawerExpanded.value = !drawerExpanded.value
}

function toggleTheme() {
  isDark.value = !isDark.value
}

const navItems = [
  { id: 'components', icon: ICONS.widgets, label: 'Components' },
  { id: 'foundations', icon: ICONS.dashboard, label: 'Foundations' },
  { id: 'styles', icon: ICONS.palette, label: 'Styles' },
  { id: 'blog', icon: ICONS.article, label: 'Blog' },
]
</script>
