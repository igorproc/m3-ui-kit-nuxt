<template>
  <section class="fixture-icon-stress">
    <h1>MIcon — stress content</h1>

    <h2>Names that draw nothing</h2>
    <div class="fixture-icon-stress__row">
      <span class="fixture-icon-stress__case">
        <MIcon
          :name="emptyName"
          data-test="empty"
        />
        Empty name
      </span>
      <span class="fixture-icon-stress__case">
        <MIcon
          name="ic:outline-no-such-glyph"
          data-test="unknown"
        />
        Unknown name
      </span>
      <span class="fixture-icon-stress__case">
        <MIcon
          :name="malformedName"
          data-test="malformed"
        />
        Malformed name
      </span>
    </div>

    <h2>Icon inside a line of text</h2>
    <p
      class="fixture-icon-stress__text"
      data-test="inline-text"
    >
      Sync finished
      <MIcon
        :name="ICONS.cloud"
        data-test="inline-icon"
      />
      and every change is saved, including quarterly-report-final-version-with-all-the-comments-resolved-and-approved.pdf; the
      <MIcon
        :name="ICONS.check"
        label="done"
        data-test="inline-labelled"
      />
      mark says so.
    </p>

    <h2>Every kit glyph, outline and filled</h2>
    <div
      class="fixture-icon-stress__grid"
      data-test="all"
    >
      <MIcon
        v-for="name in allNames"
        :key="name"
        :name="name"
      />
      <MIcon
        v-for="name in allNames"
        :key="`${name}-filled`"
        :name="name"
        filled
      />
    </div>

    <h2>Glyph that arrives after hydration</h2>
    <button
      type="button"
      data-test="show-late"
      @click="late = true"
    >
      Show the late row
    </button>
    <p
      v-if="late"
      class="fixture-icon-stress__late"
      data-test="late-row"
    >
      <MIcon
        :name="LATE_ICON"
        data-test="late-icon"
      />
      <span data-test="late-text">Departures</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import type { MIconName } from '#kit/components/ui/icon/props'
import { ICONS } from '#kit/shared/constants/icons'

const LATE_ICON = 'ic:outline-flight-takeoff'

const emptyName = '' as MIconName
const malformedName = 'arrow_back' as MIconName
const allNames = Object.values(ICONS)

const late = ref(false)
</script>

<style lang="scss">
.fixture-icon-stress {
  display: grid;
  gap: 16rem;
  font-size: 24rem;

  h1,
  h2,
  button {
    font-size: 16rem;
  }

  &__row,
  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__case,
  &__late {
    display: flex;
    align-items: center;
    gap: 8rem;
    margin: 0;
  }

  &__text {
    margin: 0;
    overflow-wrap: anywhere;
  }
}
</style>
