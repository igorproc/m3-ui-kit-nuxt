<template>
  <div
    class="ui-search-list"
    :role="named ? 'group' : 'presentation'"
    :aria-labelledby="named ? titleId : undefined"
  >
    <MListSubheader
      v-if="named"
      :id="titleId"
      class="ui-search-list__title"
      :title="title"
    >
      <template
        v-if="$slots.title"
        #default
      >
        <slot name="title" />
      </template>
    </MListSubheader>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { mSearchListProps } from './props'
import type { MSearchListSlots } from './props'
import MListSubheader from '#kit/components/ui/list/subheader/index.vue'

const props = defineProps(mSearchListProps)
const slots = defineSlots<MSearchListSlots>()

const titleId = useId()
const named = computed(() => Boolean(props.title || slots.title))
</script>
