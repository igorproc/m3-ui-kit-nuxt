<template>
  <section class="fixture-avatar">
    <h1>MAvatar — matrix</h1>

    <h2>Variant × density × content</h2>
    <div
      v-for="variant in variants"
      :key="variant"
      class="fixture-avatar__row"
    >
      <span class="fixture-avatar__label">{{ variant }}</span>
      <template
        v-for="density in densities"
        :key="density"
      >
        <MAvatar
          :variant="variant"
          :density="density"
          :src="photo"
          name="Ada Lovelace"
          :data-test="`${variant}-${density}-image`"
        />
        <MAvatar
          :variant="variant"
          :density="density"
          name="Ada Lovelace"
          :data-test="`${variant}-${density}-initials`"
        />
        <MAvatar
          :variant="variant"
          :density="density"
          alt="Unknown member"
          :data-test="`${variant}-${density}-icon`"
        />
        <MAvatar
          :variant="variant"
          :density="density"
          src="/fixture-missing-avatar.webp"
          name="Broken Image"
          :data-test="`${variant}-${density}-broken`"
        />
      </template>
    </div>

    <h2>Shape</h2>
    <div class="fixture-avatar__row">
      <MAvatar
        v-for="shape in shapes"
        :key="shape"
        :shape="shape"
        density="comfortable"
        name="Isaac Newton"
        :data-test="`shape-${shape}`"
      />
    </div>

    <h2>Naming</h2>
    <div class="fixture-avatar__row">
      <MAvatar
        src="/fixture-missing-avatar-alt.webp"
        alt="Portrait of Grace Hopper"
        name="Grace Hopper"
        data-test="broken-alt"
      />
      <MAvatar
        :src="photo"
        alt="Portrait of Grace Hopper"
        data-test="image-alt"
      />
      <MAvatar
        :src="photo"
        alt=""
        name="Decorative"
        data-test="decorative"
      />
      <span>Grace Hopper</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import MAvatar from '#kit/components/ui/avatar/index.vue'
import type { MAvatarDensity, MAvatarShape, MAvatarVariant } from '#kit/components/ui/avatar/props'

const variants: MAvatarVariant[] = ['tonal', 'filled', 'outlined']
const densities: MAvatarDensity[] = ['compact', 'default', 'comfortable']
const shapes: MAvatarShape[] = ['full', 'large', 'medium', 'small']

const photo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><rect width="4" height="4" fill="#7d5260"/><circle cx="2" cy="1.6" r="0.9" fill="#ffd8e4"/></svg>')}`
</script>

<style lang="scss">
.fixture-avatar {
  display: grid;
  justify-items: start;
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12rem;
  }

  &__label {
    width: 80rem;
  }
}
</style>
