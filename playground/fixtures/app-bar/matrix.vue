<template>
  <section
    class="fixture-app-bar"
    data-test="app-bar-fixture"
  >
    <MAppBar
      type="large"
      title="Folding headline"
      scroll-behavior="collapse"
      :heading-level="1"
      data-test="collapse"
    >
      <MAppBarNav>
        <MButtonIcon aria-label="Back">
          <MIcon
            name="round-arrow-back"
            mirror
          />
        </MButtonIcon>
      </MAppBarNav>

      <MAppBarTitle title="Folding headline" />

      <MAppBarActions>
        <MButtonIcon aria-label="Search">
          <MIcon name="round-search" />
        </MButtonIcon>
      </MAppBarActions>
    </MAppBar>

    <h2>Sizes × subtitle</h2>
    <div class="fixture-app-bar__grid">
      <template
        v-for="type in types"
        :key="type"
      >
        <MAppBar
          v-for="subtitle in ['', 'Supporting text']"
          :key="`${type}-${subtitle}`"
          :type="type"
          :title="`${type} bar`"
          :subtitle="subtitle"
          :sticky="false"
          :data-test="`${type}${subtitle ? '-subtitle' : ''}`"
        />
      </template>
    </div>

    <h2>Composed title with a subtitle</h2>
    <MAppBar
      :sticky="false"
      data-test="composed-subtitle"
    >
      <MAppBarTitle
        title="Composed bar"
        subtitle="Supporting text"
      />
    </MAppBar>

    <h2>Leading and trailing</h2>
    <MAppBar
      :sticky="false"
      data-test="with-nav"
    >
      <MAppBarNav>
        <MButtonIcon
          aria-label="Menu"
          data-test="nav-button"
        >
          <MIcon name="round-menu" />
        </MButtonIcon>
      </MAppBarNav>

      <MAppBarTitle title="With a leading button" />

      <MAppBarActions>
        <MButtonIcon
          aria-label="More"
          data-test="action-button"
        >
          <MIcon name="round-more-vert" />
        </MButtonIcon>
      </MAppBarActions>
    </MAppBar>

    <MAppBar
      align="center"
      title="Centred small bar"
      :sticky="false"
      data-test="center"
    />

    <h2>A long flexible headline</h2>
    <div class="fixture-app-bar__narrow">
      <MAppBar
        type="medium"
        :title="longTitle"
        :sticky="false"
        data-test="long"
      />
    </div>

    <h2>A long one-line headline</h2>
    <div class="fixture-app-bar__narrow">
      <MAppBar
        :title="longTitle"
        :sticky="false"
        data-test="long-small"
      />
      <MAppBar
        title="Inbox"
        :sticky="false"
        data-test="short-small"
      />
    </div>

    <p
      v-for="paragraph in 40"
      :key="paragraph"
      class="fixture-app-bar__copy"
    >
      Page content {{ paragraph }}: tall enough for the folding bar at the top to fold.
    </p>
  </section>
</template>

<script setup lang="ts">
import MAppBar from '#kit/components/ui/app-bar/index.vue'
import MAppBarActions from '#kit/components/ui/app-bar/actions/index.vue'
import MAppBarNav from '#kit/components/ui/app-bar/nav/index.vue'
import MAppBarTitle from '#kit/components/ui/app-bar/title/index.vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MAppBarType } from '#kit/components/ui/app-bar/props'

const types: MAppBarType[] = ['small', 'medium', 'large']
const longTitle = 'A headline long enough to need a second line in a narrow window, and then some more words'
</script>

<style lang="scss">
.fixture-app-bar {
  display: grid;
  gap: 16rem;

  &__grid {
    display: grid;
    gap: 8rem;
  }

  &__narrow {
    inline-size: 320rem;
    max-inline-size: 100%;
  }

  &__copy {
    margin: 0;
  }
}
</style>
