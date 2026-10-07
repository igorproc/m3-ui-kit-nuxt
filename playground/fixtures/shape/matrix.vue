<template>
  <section class="fixture-shape-matrix">
    <h1>MShape — catalog matrix</h1>

    <h2>Decorative (hidden from assistive technology)</h2>
    <ul class="fixture-shape-matrix__grid">
      <li
        v-for="name in names"
        :key="name"
        class="fixture-shape-matrix__cell"
      >
        <span class="fixture-shape-matrix__box">
          <MShape
            :name="name"
            :data-test="`decorative-${name}`"
          />
        </span>
        <span class="fixture-shape-matrix__caption">{{ name }}</span>
      </li>
    </ul>

    <h2>Labelled (announced as an image)</h2>
    <ul class="fixture-shape-matrix__grid">
      <li
        v-for="name in names"
        :key="name"
        class="fixture-shape-matrix__cell"
      >
        <span class="fixture-shape-matrix__box">
          <MShape
            :name="name"
            :label="labelOf(name)"
            :data-test="`labelled-${name}`"
          />
        </span>
        <span
          class="fixture-shape-matrix__caption"
          aria-hidden="true"
        >{{ name }}</span>
      </li>
    </ul>

    <h2>Colour comes from the parent</h2>
    <ul class="fixture-shape-matrix__grid">
      <li
        v-for="role in roles"
        :key="role"
        class="fixture-shape-matrix__cell"
      >
        <span
          class="fixture-shape-matrix__box"
          :class="`fixture-shape-matrix__box--${role}`"
        >
          <MShape
            name="softBurst"
            :data-test="`role-${role}`"
          />
        </span>
        <span class="fixture-shape-matrix__caption">{{ role }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import MShape from '#kit/components/ui/shape/index.vue'
import { M3_SHAPES } from '#kit/assets/icon/shapes'
import type { M3ShapeName } from '#kit/assets/icon/shapes'

const names = Object.keys(M3_SHAPES) as M3ShapeName[]
const roles = ['primary', 'secondary', 'tertiary', 'error']

const labelOf = (name: string) => {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
</script>

<style lang="scss">
.fixture-shape-matrix {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96rem, 1fr));
    gap: 12rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__cell {
    display: grid;
    justify-items: center;
    gap: 8rem;
    min-width: 0;
  }

  &__box {
    display: block;
    width: 56rem;
    height: 56rem;
    color: var(--md-sys-color-primary);

    &--secondary {
      color: var(--md-sys-color-secondary);
    }

    &--tertiary {
      color: var(--md-sys-color-tertiary);
    }

    &--error {
      color: var(--md-sys-color-error);
    }
  }

  &__caption {
    max-width: 100%;
    overflow-wrap: anywhere;
    text-align: center;
  }
}
</style>
