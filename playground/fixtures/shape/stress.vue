<template>
  <section class="fixture-shape-stress">
    <h1>MShape — stress content</h1>

    <h2>Many shapes on one sequence</h2>
    <p>
      {{ manyCount }} shapes share one sequence, so its interpolators are built once for the page.
    </p>
    <MButton
      variant="outlined"
      data-test="many-next"
      @click="manyStep += 1"
    >
      Advance all
    </MButton>
    <div
      class="fixture-shape-stress__many"
      data-test="many"
    >
      <span
        v-for="index in manyCount"
        :key="index"
        class="fixture-shape-stress__tiny"
      >
        <MShape
          :name="sequence[(manyStep + index) % sequence.length]!"
          :sequence="sequence"
        />
      </span>
    </div>

    <h2>Changes in a row</h2>
    <p>Each burst replaces the target five times while the previous morph is still moving.</p>
    <div class="fixture-shape-stress__row">
      <MButton
        variant="outlined"
        data-test="burst-next"
        @click="burstStep += 1"
      >
        Next shape
      </MButton>
      <MButton
        variant="outlined"
        data-test="burst-run"
        @click="burst"
      >
        Run a burst
      </MButton>
    </div>
    <span class="fixture-shape-stress__box">
      <MShape
        :name="burstName"
        data-test="burst-shape"
      />
    </span>

    <h2>Every transition</h2>
    <MButton
      variant="outlined"
      data-test="transitions-next"
      @click="transitionStep += 1"
    >
      Morph all four
    </MButton>
    <ul class="fixture-shape-stress__transitions">
      <li
        v-for="transition in transitions"
        :key="transition"
        class="fixture-shape-stress__cell"
      >
        <span class="fixture-shape-stress__box">
          <MShape
            :name="curved[transitionStep % curved.length]!"
            :transition="transition"
            :data-test="`transition-${transition}`"
          />
        </span>
        <span>{{ transition }}</span>
      </li>
    </ul>

    <h2>Reduced motion</h2>
    <p>
      With reduced motion turned on in the system or in devtools the morph still runs, only shorter
      and without the bank.
    </p>
    <MButton
      variant="outlined"
      data-test="motion-next"
      @click="motionStep += 1"
    >
      Morph
    </MButton>
    <span class="fixture-shape-stress__box">
      <MShape
        :name="curved[motionStep % curved.length]!"
        data-test="motion-shape"
      />
    </span>

    <h2>Labels</h2>
    <div class="fixture-shape-stress__row">
      <span class="fixture-shape-stress__box">
        <MShape
          name="12SidedCookie"
          :label="longLabel"
          data-test="long-label"
        />
      </span>
      <span class="fixture-shape-stress__box">
        <MShape
          name="heart"
          label="Сохранено 保存 حفظ"
          data-test="script-label"
        />
      </span>
    </div>

    <h2>Fills a narrow container</h2>
    <div class="fixture-shape-stress__narrow">
      <MShape
        name="verySunny"
        data-test="fill-narrow"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MShape from '#kit/components/ui/shape/index.vue'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import type { MorphTransitionName } from '#kit/utils/motion'

const sequence: M3ShapeName[] = ['circle', 'flower', 'puffyDiamond', '4LeafClover', 'square', 'sunny', 'ghostIsh', 'hexagon', 'heart']
const curved: M3ShapeName[] = ['circle', 'square', 'heart', 'flower', 'softBurst']
const transitions: MorphTransitionName[] = ['calm', 'standard', 'expressive', 'bouncy']
const longLabel = 'A status shape whose accessible name keeps going far past any width a caption could ever hold on screen'

const manyCount = 120
const manyStep = ref(0)
const burstStep = ref(0)
const transitionStep = ref(0)
const motionStep = ref(0)

const burstName = computed(() => sequence[burstStep.value % sequence.length]!)

let burstTimer: ReturnType<typeof setTimeout> | undefined

function burst() {
  clearTimeout(burstTimer)
  let left = 5
  const step = () => {
    burstStep.value += 1
    left -= 1
    if (left > 0) burstTimer = setTimeout(step, 40)
  }
  step()
}

onBeforeUnmount(() => clearTimeout(burstTimer))
</script>

<style lang="scss">
.fixture-shape-stress {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rem;
  }

  &__many {
    display: flex;
    flex-wrap: wrap;
    gap: 4rem;
    color: var(--md-sys-color-tertiary);
  }

  &__tiny {
    display: block;
    width: 16rem;
    height: 16rem;
  }

  &__box {
    display: block;
    width: 64rem;
    height: 64rem;
    color: var(--md-sys-color-primary);
  }

  &__transitions {
    display: flex;
    flex-wrap: wrap;
    gap: 16rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__cell {
    display: grid;
    justify-items: center;
    gap: 8rem;
  }

  &__narrow {
    max-width: 120rem;
    color: var(--md-sys-color-secondary);
  }
}
</style>
