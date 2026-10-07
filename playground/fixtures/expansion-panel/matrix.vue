<template>
  <section class="fixture-expansion-panel">
    <h1>MExpansionPanel — matrix</h1>

    <h2>Single panel × content × state</h2>
    <div class="fixture-expansion-panel__grid">
      <MExpansionPanel
        v-for="panel in panels"
        :key="panel.key"
        v-model="open[panel.key]"
        :title="panel.content === 'header' ? undefined : panel.title"
        :description="panel.content === 'description' ? 'Supporting text for this section' : undefined"
        :disabled="panel.disabled"
        :data-test="`panel-${panel.key}`"
      >
        <template
          v-if="panel.content === 'header'"
          #header
        >
          <span>{{ panel.title }} <strong>(custom header)</strong></span>
        </template>

        <template
          v-if="panel.content === 'trailing'"
          #trailing="{ expanded }"
        >
          <span>{{ expanded ? 'Hide' : 'Show' }}</span>
        </template>

        <p>Body of {{ panel.title }}.</p>
      </MExpansionPanel>
    </div>

    <h2>Heading level</h2>
    <MExpansionPanel
      v-model="open.heading"
      title="Delivery options"
      description="Inside an h3"
      :heading-level="3"
      data-test="panel-heading"
    >
      <p>Courier, pickup point or post.</p>
    </MExpansionPanel>

    <h2>Exclusive group</h2>
    <MExpansionPanels
      v-model="exclusive"
      data-test="group-exclusive"
    >
      <MExpansionPanel
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :title="`${item.title}, exclusive`"
        :heading-level="3"
        :data-test="`exclusive-${item.value}`"
      >
        <p>{{ item.body }}</p>
      </MExpansionPanel>
    </MExpansionPanels>
    <output data-test="exclusive-model">{{ exclusive }}</output>

    <h2>Multiple group</h2>
    <MExpansionPanels
      v-model="several"
      multiple
      data-test="group-multiple"
    >
      <MExpansionPanel
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :title="`${item.title}, multiple`"
        :data-test="`multiple-${item.value}`"
      >
        <p>{{ item.body }}</p>
      </MExpansionPanel>
    </MExpansionPanels>
    <output data-test="multiple-model">{{ several.join(',') }}</output>

    <h2>Mandatory group</h2>
    <MExpansionPanels
      v-model="required"
      mandatory
      data-test="group-mandatory"
    >
      <MExpansionPanel
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :title="`${item.title}, mandatory`"
        :data-test="`mandatory-${item.value}`"
      >
        <p>{{ item.body }}</p>
      </MExpansionPanel>
    </MExpansionPanels>
    <output data-test="mandatory-model">{{ required }}</output>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MExpansionPanel from '#kit/components/ui/expansion-panel/index.vue'
import MExpansionPanels from '#kit/components/ui/expansion-panels/index.vue'
import type { PanelValue } from '#kit/composables/expansion-panel/useExpansionPanelGroup'

type PanelContent = 'title' | 'description' | 'header' | 'trailing'

const contents: PanelContent[] = ['title', 'description', 'header', 'trailing']

const panels = contents.flatMap(content => [false, true].flatMap(expanded => [false, true].map((disabled) => {
  const state = `${expanded ? 'expanded' : 'collapsed'}${disabled ? '-disabled' : ''}`
  return {
    key: `${content}-${state}`,
    title: `${content[0]!.toUpperCase()}${content.slice(1)}, ${state.replace('-', ' ')}`,
    content,
    expanded,
    disabled,
  }
})))

const open = reactive<Record<string, boolean>>({
  heading: false,
  ...Object.fromEntries(panels.map(panel => [panel.key, panel.expanded])),
})

const items = [
  { value: 'a', title: 'Shipping', body: 'Ships within two working days.' },
  { value: 'b', title: 'Returns', body: 'Free returns for 30 days.' },
  { value: 'c', title: 'Warranty', body: 'Two years on every device.' },
]

const exclusive = ref<PanelValue | undefined>('b')
const several = ref<PanelValue[]>(['a'])
const required = ref<PanelValue | undefined>('a')
</script>

<style lang="scss">
.fixture-expansion-panel {
  display: grid;
  gap: 16rem;
  max-width: 720rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320rem, 1fr));
    align-items: start;
    gap: 16rem;
  }
}
</style>
