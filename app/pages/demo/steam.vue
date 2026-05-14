<template>
  <NuxtLayout name="steam">
    <!-- System Bar / Top Header -->
    <template #header>
      <div class="demo-steam__system-bar">
        <div class="demo-steam__brand">
          <m-icon :name="ICONS.videogameAsset" />
          <span class="demo-steam__brand-text">STEAM</span>
        </div>

        <div class="demo-steam__tabs">
          <button
            v-for="tab in topTabs"
            :key="tab.id"
            class="demo-steam__tab"
            :class="{ 'demo-steam__tab--active': activeTopTab === tab.id }"
            @click="activeTopTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="demo-steam__header-actions">
          <m-button
            variant="text"
            class="demo-steam__icon-btn"
          >
            <m-icon :name="ICONS.notifications" />
          </m-button>
          <m-button
            variant="text"
            class="demo-steam__icon-btn"
          >
            <m-icon :name="ICONS.accountCircle" />
          </m-button>
        </div>
      </div>
    </template>

    <!-- Game Library Sidebar -->
    <template #sidebar>
      <div
        v-if="!isMobile"
        class="demo-steam__sidebar"
      >
        <div class="demo-steam__sidebar-header">
          <m-search
            v-model="gameSearch"
            placeholder="Search library..."
          />
        </div>
        <div class="demo-steam__game-list">
          <button
            v-for="game in filteredGames"
            :key="game.id"
            class="demo-steam__game-item"
            :class="{ 'demo-steam__game-item--active': selectedGame === game.id }"
            @click="selectedGame = game.id"
          >
            <m-icon
              :name="game.icon"
              class="demo-steam__game-icon"
            />
            <span
              v-if="drawerExpanded"
              class="demo-steam__game-name"
            >
              {{ game.name }}
            </span>
          </button>
        </div>
      </div>
    </template>

    <!-- Main Store Content -->
    <div class="demo-steam__content">
      <!-- Featured Banner -->
      <section class="demo-steam__featured">
        <div class="demo-steam__featured-content">
          <span class="demo-steam__featured-badge">Featured & Recommended</span>
          <h2 class="demo-steam__featured-title">
            Cyberpunk 2077: Phantom Liberty
          </h2>
          <p class="demo-steam__featured-desc">
            Spy-thriller expansion for Cyberpunk 2077. Explore Dogtown, a dangerous new district.
          </p>
          <div class="demo-steam__featured-actions">
            <m-button variant="filled">
              <m-icon :name="ICONS.shoppingCart" />
              Buy Now — $29.99
            </m-button>
            <m-button variant="outlined">
              Add to Wishlist
            </m-button>
          </div>
        </div>
      </section>

      <!-- Special Offers -->
      <section class="demo-steam__section">
        <h3 class="demo-steam__section-title">
          <m-icon :name="ICONS.localOffer" />
          Special Offers
        </h3>
        <div class="demo-steam__offers-grid">
          <article
            v-for="offer in storeOffers"
            :key="offer.id"
            class="demo-steam__offer-card"
          >
            <div
              class="demo-steam__offer-banner"
              :style="{ backgroundColor: offer.color }"
            >
              <m-icon
                :name="offer.icon"
                class="demo-steam__offer-icon"
              />
            </div>
            <div class="demo-steam__offer-info">
              <h4 class="demo-steam__offer-name">
                {{ offer.name }}
              </h4>
              <div class="demo-steam__offer-pricing">
                <m-badge
                  v-if="offer.discount"
                  variant="standard"
                  :value="offer.discount"
                  class="demo-steam__offer-discount"
                />
                <span
                  v-if="offer.originalPrice"
                  class="demo-steam__offer-original"
                >
                  ${{ offer.originalPrice }}
                </span>
                <span class="demo-steam__offer-price">${{ offer.price }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Top Sellers -->
      <section class="demo-steam__section">
        <h3 class="demo-steam__section-title">
          <m-icon :name="ICONS.trendingUp" />
          Top Sellers
        </h3>
        <div class="demo-steam__offers-grid">
          <article
            v-for="seller in topSellers"
            :key="seller.id"
            class="demo-steam__offer-card"
          >
            <div
              class="demo-steam__offer-banner"
              :style="{ backgroundColor: seller.color }"
            >
              <m-icon
                :name="seller.icon"
                class="demo-steam__offer-icon"
              />
            </div>
            <div class="demo-steam__offer-info">
              <h4 class="demo-steam__offer-name">
                {{ seller.name }}
              </h4>
              <div class="demo-steam__offer-tags">
                <m-chip
                  v-for="tag in seller.tags"
                  :key="tag"
                  variant="suggestion"
                >
                  {{ tag }}
                </m-chip>
              </div>
              <span class="demo-steam__offer-price">${{ seller.price }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Friends Panel (Right Aside) -->
    <template #friends>
      <div
        v-if="showFriends && !isMobile"
        class="demo-steam__friends"
      >
        <div class="demo-steam__friends-header">
          <h4>Friends Online</h4>
          <m-button
            variant="text"
            class="demo-steam__icon-btn"
            @click="showFriends = false"
          >
            <m-icon :name="ICONS.close" />
          </m-button>
        </div>
        <div class="demo-steam__friends-list">
          <div
            v-for="friend in friends"
            :key="friend.name"
            class="demo-steam__friend-item"
          >
            <m-icon :name="ICONS.accountCircle" />
            <div class="demo-steam__friend-info">
              <span class="demo-steam__friend-name">{{ friend.name }}</span>
              <span class="demo-steam__friend-status">{{ friend.game }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Mobile Bottom Nav -->
    <template #footer>
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
const drawerExpanded = ref(true)
const showFriends = ref(true)
const gameSearch = ref('')
const selectedGame = ref('game-1')
const activeTopTab = ref('store')
const mobileNav = ref('store')

const sidebarSizeToken = computed(() =>
  drawerExpanded.value
    ? '--ui-navigation-rail-width-expanded'
    : '--ui-navigation-rail-width',
)

const topTabs = [
  { id: 'store', label: 'STORE' },
  { id: 'library', label: 'LIBRARY' },
  { id: 'community', label: 'COMMUNITY' },
  { id: 'profile', label: 'PROFILE' },
]

const mobileNavItems = [
  { id: 'store', icon: ICONS.storefront, label: 'Store' },
  { id: 'library', icon: ICONS.videogameAsset, label: 'Library' },
  { id: 'community', icon: ICONS.people, label: 'Community' },
  { id: 'chat', icon: ICONS.chat, label: 'Chat' },
]

const games = [
  { id: 'game-1', name: 'Cyberpunk 2077', icon: ICONS.sportsSoccer },
  { id: 'game-2', name: 'Elden Ring', icon: ICONS.whatshot },
  { id: 'game-3', name: 'Baldur\'s Gate 3', icon: ICONS.star },
  { id: 'game-4', name: 'Hades II', icon: ICONS.whatshot },
  { id: 'game-5', name: 'Stardew Valley', icon: ICONS.home },
  { id: 'game-6', name: 'Terraria', icon: ICONS.explore },
  { id: 'game-7', name: 'Portal 2', icon: ICONS.rocketLaunch },
  { id: 'game-8', name: 'Counter-Strike 2', icon: ICONS.sportsSoccer },
]

const filteredGames = computed(() => {
  if (!gameSearch.value) return games
  return games.filter(g => g.name.toLowerCase().includes(gameSearch.value.toLowerCase()))
})

const storeOffers = [
  { id: 1, name: 'Elden Ring', price: '39.99', originalPrice: '59.99', discount: -33, icon: ICONS.whatshot, color: '#2a1f0d' },
  { id: 2, name: 'Baldur\'s Gate 3', price: '59.99', icon: ICONS.star, color: '#1a0f2e' },
  { id: 3, name: 'Red Dead Redemption 2', price: '19.99', originalPrice: '59.99', discount: -67, icon: ICONS.explore, color: '#2e1a0f' },
  { id: 4, name: 'Hades II', price: '29.99', icon: ICONS.whatshot, color: '#1f0d0d' },
  { id: 5, name: 'Hollow Knight', price: '7.49', originalPrice: '14.99', discount: -50, icon: ICONS.sportsSoccer, color: '#0d1f2e' },
  { id: 6, name: 'Stardew Valley', price: '14.99', icon: ICONS.home, color: '#0d2e1a' },
]

const topSellers = [
  { id: 1, name: 'Counter-Strike 2', price: 'Free', icon: ICONS.sportsSoccer, color: '#1a2e0d', tags: ['FPS', 'Competitive'] },
  { id: 2, name: 'Dota 2', price: 'Free', icon: ICONS.whatshot, color: '#2e0d0d', tags: ['MOBA', 'Strategy'] },
  { id: 3, name: 'PUBG', price: 'Free', icon: ICONS.explore, color: '#0d1a2e', tags: ['Battle Royale', 'Shooter'] },
  { id: 4, name: 'Apex Legends', price: 'Free', icon: ICONS.rocketLaunch, color: '#2e1a2e', tags: ['FPS', 'Battle Royale'] },
]

const friends = [
  { name: 'xXGamerXx', game: 'Playing Counter-Strike 2' },
  { name: 'NightOwl42', game: 'Playing Elden Ring' },
  { name: 'PixelHunter', game: 'Online' },
  { name: 'SteamLord99', game: 'Playing Dota 2' },
  { name: 'CasualPlayer', game: 'Away' },
]
</script>

<style lang="scss">
.demo-steam {
  --steam-bg: #1b2838;
  --steam-bg-darker: #171a21;
  --steam-bg-lighter: #2a475e;
  --steam-accent: #66c0f4;
  --steam-text: #c7d5e0;
  --steam-text-dim: #8f98a0;
  --steam-green: #4c6b22;
  --steam-green-bright: #a4d007;

  background-color: var(--steam-bg);
  color: var(--steam-text);

  /* ── System Bar ── */
  &__system-bar {
    display: flex;
    align-items: center;
    gap: 4rem;
    padding: 0 16rem;
    height: 72rem;
    background: linear-gradient(180deg, var(--steam-bg-darker), var(--steam-bg));
    border-bottom: 1rem solid rgb(255 255 255 / 6%);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8rem;
    color: var(--steam-accent);
    font-size: 20rem;
    white-space: nowrap;
  }

  &__brand-text {
    font-weight: 700;
    letter-spacing: 3rem;

    @include typescale('title-large');
  }

  &__tabs {
    display: flex;
    gap: 2rem;
    margin-left: 24rem;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__tab {
    padding: 8rem 16rem;
    border: none;
    background: transparent;
    color: var(--steam-text-dim);
    cursor: pointer;
    border-radius: 4rem;
    transition: all 150ms;
    white-space: nowrap;

    @include typescale('label-large');

    &:hover {
      color: var(--steam-text);
      background: rgb(255 255 255 / 5%);
    }

    &--active {
      color: var(--steam-accent);
      background: rgb(255 255 255 / 8%);
    }
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 4rem;
    margin-left: auto;
  }

  &__icon-btn {
    min-width: auto !important;
    padding: 8rem !important;
    color: var(--steam-text-dim) !important;

    &:hover {
      color: var(--steam-text) !important;
    }
  }

  /* ── Sidebar ── */
  &__sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--steam-bg-darker);
    border-right: 1rem solid rgb(255 255 255 / 6%);
  }

  &__sidebar-header {
    padding: 12rem;
    border-bottom: 1rem solid rgb(255 255 255 / 6%);
  }

  &__game-list {
    flex: 1;
    overflow-y: auto;
    padding: 8rem 0;
  }

  &__game-item {
    display: flex;
    align-items: center;
    gap: 12rem;
    padding: 10rem 16rem;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--steam-text-dim);
    cursor: pointer;
    transition: all 100ms;

    @include typescale('body-medium');

    &:hover {
      color: var(--steam-text);
      background: rgb(255 255 255 / 5%);
    }

    &--active {
      color: var(--steam-accent);
      background: rgb(255 255 255 / 8%);
    }
  }

  &__game-icon {
    font-size: 20rem;
    flex-shrink: 0;
  }

  &__game-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Main Content ── */
  &__content {
    display: flex;
    flex-direction: column;
    gap: 32rem;
    padding: 24rem;

    @media (max-width: 768px) {
      padding: 16rem;
      gap: 24rem;
    }
  }

  &__featured {
    background: linear-gradient(135deg, var(--steam-bg-lighter), var(--steam-bg-darker));
    border-radius: 12rem;
    padding: 48rem 40rem;
    border: 1rem solid rgb(255 255 255 / 8%);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 60%;
      height: 200%;
      background: radial-gradient(ellipse, rgb(102 192 244 / 8%), transparent 70%);
      pointer-events: none;
    }

    @media (max-width: 768px) {
      padding: 32rem 24rem;
    }
  }

  &__featured-badge {
    display: inline-block;
    padding: 4rem 12rem;
    background: var(--steam-accent);
    color: var(--steam-bg-darker);
    border-radius: 4rem;
    margin-bottom: 16rem;
    font-weight: 600;

    @include typescale('label-medium');
  }

  &__featured-title {
    margin: 0 0 12rem;
    color: #fff;

    @include typescale('headline-medium');

    @media (max-width: 768px) {
      @include typescale('headline-small');
    }
  }

  &__featured-desc {
    margin: 0 0 24rem;
    color: var(--steam-text-dim);
    max-width: 500rem;

    @include typescale('body-large');
  }

  &__featured-actions {
    display: flex;
    gap: 12rem;
    flex-wrap: wrap;
  }

  /* ── Sections ── */
  &__section-title {
    display: flex;
    align-items: center;
    gap: 8rem;
    margin: 0 0 16rem;
    color: #fff;

    @include typescale('title-large');
  }

  &__offers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240rem, 1fr));
    gap: 12rem;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__offer-card {
    background: var(--steam-bg-darker);
    border-radius: 8rem;
    overflow: hidden;
    border: 1rem solid rgb(255 255 255 / 6%);
    transition: transform 150ms, box-shadow 150ms;
    cursor: pointer;

    &:hover {
      transform: translateY(-2rem);
      box-shadow: 0 8rem 24rem rgb(0 0 0 / 40%);
    }
  }

  &__offer-banner {
    height: 120rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__offer-icon {
    font-size: 48rem;
    opacity: 0.3;
    color: #fff;
  }

  &__offer-info {
    padding: 12rem;
    display: flex;
    flex-direction: column;
    gap: 8rem;
  }

  &__offer-name {
    margin: 0;
    color: #fff;

    @include typescale('title-small');
  }

  &__offer-pricing {
    display: flex;
    align-items: center;
    gap: 8rem;
  }

  &__offer-discount {
    background: var(--steam-green) !important;
    color: var(--steam-green-bright) !important;
    font-weight: 700;
  }

  &__offer-original {
    text-decoration: line-through;
    color: var(--steam-text-dim);

    @include typescale('body-small');
  }

  &__offer-price {
    color: var(--steam-green-bright);
    font-weight: 600;

    @include typescale('body-medium');
  }

  &__offer-tags {
    display: flex;
    gap: 4rem;
    flex-wrap: wrap;
  }

  /* ── Friends Panel ── */
  &__friends {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--steam-bg-darker);
    border-left: 1rem solid rgb(255 255 255 / 6%);
  }

  &__friends-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rem;
    border-bottom: 1rem solid rgb(255 255 255 / 6%);

    h4 {
      margin: 0;
      color: #fff;

      @include typescale('title-small');
    }
  }

  &__friends-list {
    flex: 1;
    overflow-y: auto;
    padding: 8rem 0;
  }

  &__friend-item {
    display: flex;
    align-items: center;
    gap: 12rem;
    padding: 10rem 16rem;
    cursor: pointer;
    transition: background 100ms;

    &:hover {
      background: rgb(255 255 255 / 5%);
    }
  }

  &__friend-name {
    color: var(--steam-accent);

    @include typescale('body-medium');
  }

  &__friend-status {
    color: var(--steam-text-dim);

    @include typescale('body-small');
  }

  &__friend-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-width: 0;
  }
}
</style>
