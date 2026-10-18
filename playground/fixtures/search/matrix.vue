<template>
  <section class="fixture-search">
    <h1>MSearch — state matrix</h1>

    <div
      v-for="state in states"
      :key="state.name"
      class="fixture-search__case"
    >
      <h2>{{ state.name }}</h2>
      <MSearch
        v-model="values[state.name]"
        :aria-label="`Search, ${state.name}`"
        placeholder="Search the archive"
        clear-label="Clear the query"
        v-bind="state.props"
        :data-test="state.name"
        @submit="submitted = $event"
      />
    </div>

    <div class="fixture-search__case">
      <h2>trailing and avatar</h2>
      <MSearch
        v-model="withActions"
        aria-label="Search mail"
        placeholder="Search mail"
        clear-label="Clear the query"
        data-test="actions"
      >
        <template #trailing>
          <MButtonIcon aria-label="Filters">
            <MIcon :name="ICONS.settings" />
          </MButtonIcon>
        </template>
        <template #avatar>
          <MIcon
            :name="ICONS.accountCircle"
            aria-hidden="true"
          />
        </template>
      </MSearch>
    </div>

    <output data-test="submitted">{{ submitted }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import MSearch from '#kit/components/ui/search/index.vue'
import { ICONS } from '#kit/shared/constants/icons'

const states = [
  { name: 'empty', props: {}, value: '' },
  { name: 'populated', props: {}, value: 'material design' },
  { name: 'disabled', props: { disabled: true }, value: 'archived' },
]

const values = reactive<Record<string, string>>(Object.fromEntries(states.map(state => [state.name, state.value])))
const withActions = ref('')
const submitted = ref('')
</script>

<style lang="scss">
.fixture-search {
  display: grid;
  gap: 16rem;

  &__case {
    display: grid;
    gap: 8rem;
  }
}
</style>
