<template>
  <section class="fixture-avatar-stress">
    <h1>MAvatar — stress content</h1>

    <h2>Names</h2>
    <div class="fixture-avatar-stress__row">
      <MAvatar
        v-for="person in people"
        :key="person"
        :name="person"
        density="comfortable"
        :data-test="`name-${people.indexOf(person)}`"
      />
    </div>

    <h2>Blank and missing</h2>
    <div class="fixture-avatar-stress__row">
      <MAvatar
        name="   "
        alt="No name given"
        data-test="blank-name"
      />
      <MAvatar
        src=""
        alt="Empty source"
        data-test="empty-src"
      />
      <MAvatar
        src="/fixture-missing-avatar-stress.webp"
        alt="Gone"
        data-test="missing"
      />
    </div>

    <h2>In a narrow column</h2>
    <div
      class="fixture-avatar-stress__narrow"
      data-test="narrow"
    >
      <MAvatar
        v-for="density in densities"
        :key="density"
        :density="density"
        name="Mary Somerville"
      />
    </div>

    <h2>Inline with text</h2>
    <p
      class="fixture-avatar-stress__text"
      data-test="inline"
    >
      Assigned to
      <MAvatar
        density="compact"
        name="Ada Lovelace"
        alt=""
      />
      Ada Lovelace, who reviews every change before it ships.
    </p>
  </section>
</template>

<script setup lang="ts">
import MAvatar from '#kit/components/ui/avatar/index.vue'
import type { MAvatarDensity } from '#kit/components/ui/avatar/props'

const densities: MAvatarDensity[] = ['compact', 'default', 'comfortable']

const people = [
  'Ada Lovelace',
  'Grace Brewster Murray Hopper',
  'Ада Лавлейс',
  'سارة حسن',
  '张伟',
  '👩‍🚀 Astronaut',
  'Supercalifragilisticexpialidocious',
  'x',
]
</script>

<style lang="scss">
.fixture-avatar-stress {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12rem;
  }

  &__narrow {
    display: flex;
    gap: 4rem;
    width: 48rem;
    overflow: hidden;
    outline: 1px dashed var(--md-sys-color-outline);
  }

  &__text {
    max-width: 320rem;
  }
}
</style>
