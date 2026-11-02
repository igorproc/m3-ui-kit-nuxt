<template>
  <section class="fixture-choice">
    <h1>MSwitch — state matrix</h1>

    <div
      v-for="state in states"
      :key="state.name"
      class="fixture-choice__case"
      :data-test="state.name"
    >
      <MSwitch
        v-model="values[state.name]"
        :label="`Setting, ${state.name}`"
        v-bind="state.props"
      />
    </div>

    <h2>Icons</h2>
    <div class="fixture-choice__grid">
      <template
        v-for="icons in iconAxis"
        :key="icons"
      >
        <div
          v-for="state in iconStates"
          :key="`${icons}-${state.name}`"
          class="fixture-choice__case"
          :data-test="`icons-${icons}-${state.name}`"
        >
          <MSwitch
            v-model="iconValues[`${icons}-${state.name}`]"
            :icons="icons"
            :label="`Icons ${icons}, ${state.name}`"
            v-bind="state.props"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import MSwitch from '#kit/components/ui/switch/index.vue'
import type { MSwitchIcons } from '#kit/components/ui/switch/props'

const states = [
  { name: 'off', props: {} },
  { name: 'on', props: {} },
  { name: 'disabled', props: { disabled: true } },
  { name: 'disabled-on', props: { disabled: true } },
  { name: 'helper', props: { helperText: 'Applies to every device' } },
  { name: 'error', props: { errorMessage: 'Turn this on to continue' } },
  { name: 'error-on', props: { error: true } },
]

const values = reactive<Record<string, boolean>>({ 'on': true, 'disabled-on': true, 'error-on': true })

const iconAxis: MSwitchIcons[] = ['none', 'selected', 'both']
const iconStates = [
  { name: 'off', on: false, props: {} },
  { name: 'on', on: true, props: {} },
  { name: 'disabled-off', on: false, props: { disabled: true } },
  { name: 'disabled-on', on: true, props: { disabled: true } },
]
const iconValues = reactive<Record<string, boolean>>(Object.fromEntries(
  iconAxis.flatMap(icons => iconStates.map(state => [`${icons}-${state.name}`, state.on])),
))
</script>

<style lang="scss">
.fixture-choice {
  display: flex;
  flex-direction: column;
  gap: 8rem;

  &__case {
    display: flex;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8rem 24rem;
  }
}
</style>
