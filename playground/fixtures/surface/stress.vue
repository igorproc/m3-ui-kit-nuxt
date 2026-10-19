<template>
  <section class="fixture-surface-stress">
    <h1>MSurface — stress content</h1>

    <h2>Long text in a narrow column</h2>
    <div class="fixture-surface-stress__narrow">
      <MSurface
        variant="outlined"
        shape="medium"
        class="fixture-surface-stress__box"
        data-test="long-text"
      >
        A surface holds whatever the consumer puts inside it, so a paragraph that keeps going well past
        the width of its column has to wrap onto as many lines as it needs without clipping a single word.
      </MSurface>
    </div>

    <h2>Unbroken word</h2>
    <div class="fixture-surface-stress__narrow">
      <MSurface
        variant="filled"
        shape="medium"
        class="fixture-surface-stress__box"
        data-test="long-word-narrow"
      >
        {{ longWord }}
      </MSurface>
    </div>
    <MSurface
      variant="elevated"
      shape="large"
      class="fixture-surface-stress__box"
      data-test="long-word"
    >
      {{ longWord }}
    </MSurface>

    <h2>Mixed scripts</h2>
    <MSurface
      variant="filled"
      shape="small"
      class="fixture-surface-stress__box"
      data-test="mixed-script"
    >
      Сохранить 保存 حفظ 🙂
    </MSurface>

    <h2>Empty</h2>
    <div class="fixture-surface-stress__row">
      <MSurface
        v-for="variant in variants"
        :key="variant"
        :variant="variant"
        class="fixture-surface-stress__empty"
        :data-test="`empty-${variant}`"
      />
    </div>

    <h2>Nested surfaces</h2>
    <MSurface
      variant="filled"
      shape="extra-large"
      class="fixture-surface-stress__box"
      data-test="nested-outer"
    >
      Filled
      <MSurface
        variant="outlined"
        shape="large"
        class="fixture-surface-stress__box"
        data-test="nested-middle"
      >
        Outlined
        <MSurface
          variant="elevated"
          shape="medium"
          class="fixture-surface-stress__box"
          data-test="nested-inner"
        >
          Elevated
          <MSurface
            shape="small"
            class="fixture-surface-stress__box"
            data-test="nested-plain"
          >
            <MButton data-test="nested-action">
              Action inside four surfaces
            </MButton>
          </MSurface>
        </MSurface>
      </MSurface>
    </MSurface>

    <h2>Many surfaces</h2>
    <div class="fixture-surface-stress__row">
      <MSurface
        v-for="(variant, index) in many"
        :key="index"
        :variant="variant"
        shape="small"
        class="fixture-surface-stress__chip"
        :data-test="`many-${index}`"
      >
        {{ variant }} {{ index + 1 }}
      </MSurface>
    </div>
  </section>
</template>

<script setup lang="ts">
import MSurface from '#kit/components/ui/surface/index.vue'
import MButton from '#kit/components/ui/button/index.vue'
import type { MSurfaceVariant } from '#kit/components/ui/surface/props'

const variants: MSurfaceVariant[] = ['plain', 'filled', 'elevated', 'outlined']
const many = Array.from({ length: 6 }, () => variants).flat()
const longWord = 'https://example.com/a/very/long/path/without/any/spaces/that/keeps/going/and/going/until/it/is/far/wider/than/any/phone'
</script>

<style lang="scss">
.fixture-surface-stress {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  &__narrow {
    width: 160rem;
  }

  &__box {
    padding: 16rem;
  }

  &__box &__box {
    margin-block-start: 12rem;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12rem;
  }

  &__empty {
    width: 64rem;
  }

  &__chip {
    padding-block: 8rem;
    padding-inline: 12rem;
  }
}
</style>
