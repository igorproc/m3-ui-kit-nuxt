<template>
  <div class="ui-carousel">
    <div class="ui-carousel__viewport">
      <div
        class="ui-carousel__track"
        :style="trackStyle"
      >
        <div
          v-for="index in length"
          :key="index - 1"
          class="ui-carousel__slide"
        >
          <slot :index="index - 1" />
        </div>
      </div>
    </div>

    <div class="ui-carousel__controls">
      <button
        type="button"
        class="ui-carousel__control ui-carousel__control--prev"
        :aria-label="prevLabel"
        @click="goPrev"
      >
        <ui-icon name="baseline-chevron-left" />
      </button>

      <div class="ui-carousel__indicators">
        <button
          v-for="index in length"
          :key="`dot-${index - 1}`"
          type="button"
          class="ui-carousel__indicator"
          :class="{
            'ui-carousel__indicator--active': currentIndex === index - 1,
          }"
          :aria-label="`Go to slide ${index}`"
          @click="goTo(index - 1)"
        />
      </div>

      <button
        type="button"
        class="ui-carousel__control ui-carousel__control--next"
        :aria-label="nextLabel"
        @click="goNext"
      >
        <ui-icon name="baseline-chevron-right" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  length: number
  loop?: boolean
  prevLabel?: string
  nextLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  loop: true,
  prevLabel: 'Previous slide',
  nextLabel: 'Next slide',
})

const indexModel = defineModel<number>('index', { default: 0 })

const currentIndex = computed(() => {
  if (props.length <= 0) {
    return 0
  }

  return Math.min(
    Math.max(indexModel.value, 0),
    props.length - 1,
  )
})

watch(
  () => props.length,
  (next) => {
    if (next <= 0) {
      indexModel.value = 0
      return
    }

    if (currentIndex.value >= next) {
      indexModel.value = next - 1
    }
  },
)

const trackStyle = computed(() => {
  if (props.length <= 0) {
    return {}
  }

  return {
    transform: `translateX(-${currentIndex.value * 100}%)`,
  }
})

function goPrev() {
  if (props.length <= 0) {
    return
  }

  if (currentIndex.value === 0) {
    if (props.loop) {
      indexModel.value = props.length - 1
    }
    return
  }

  indexModel.value = currentIndex.value - 1
}

function goNext() {
  if (props.length <= 0) {
    return
  }

  if (currentIndex.value === props.length - 1) {
    if (props.loop) {
      indexModel.value = 0
    }
    return
  }

  indexModel.value = currentIndex.value + 1
}

function goTo(nextIndex: number) {
  if (props.length <= 0) {
    return
  }

  indexModel.value = Math.min(
    Math.max(nextIndex, 0),
    props.length - 1,
  )
}
</script>

<style lang="scss">
.ui-carousel {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__viewport {
    overflow: hidden;
    border-radius: var(--sys-shape-corner-large);
  }

  &__track {
    display: flex;
    width: 100%;
    transition: transform var(--sys-motion-duration-medium-2)
      var(--sys-motion-easing-standard);
  }

  &__slide {
    flex: 0 0 100%;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8rem;
  }

  &__control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40rem;
    height: 40rem;
    border-radius: var(--sys-shape-corner-full);
    border: none;
    padding: 0;
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 8%,
      transparent
    );
    color: var(--color-on-surface);
    cursor: pointer;
    transition:
      background-color var(--sys-motion-duration-short-3)
        var(--sys-motion-easing-standard),
      transform var(--sys-motion-duration-short-3)
        var(--sys-motion-easing-standard);

    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-on-surface) 12%,
        transparent
      );
      transform: translateY(-1rem);
    }

    &:active {
      background-color: color-mix(
        in srgb,
        var(--color-on-surface) 16%,
        transparent
      );
      transform: translateY(0);
    }
  }

  &__indicators {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6rem;
  }

  &__indicator {
    width: 6rem;
    height: 6rem;
    border-radius: var(--sys-shape-corner-full);
    border: none;
    padding: 0;
    background-color: color-mix(
      in srgb,
      var(--color-on-surface) 16%,
      transparent
    );
    cursor: pointer;
    transition:
      background-color var(--sys-motion-duration-short-3)
        var(--sys-motion-easing-standard),
      width var(--sys-motion-duration-short-3)
        var(--sys-motion-easing-standard);

    &--active {
      width: 18rem;
      background-color: var(--color-primary);
    }
  }
}
</style>
