<template>
  <MAlert
    ref="alert"
    class="ui-form-renderer-summary"
    color="error"
    :title="title"
    announce="off"
    tabindex="-1"
  >
    <ul class="ui-form-renderer-summary__list">
      <li
        v-for="entry in entries"
        :key="entry.name"
        class="ui-form-renderer-summary__item"
      >
        <a
          class="ui-form-renderer-summary__link"
          :href="entry.href"
          @click.prevent="emit('pick', entry.name)"
        >{{ entry.label }}: {{ entry.message }}</a>
      </li>
    </ul>
  </MAlert>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import MAlert from '#kit/components/ui/alert/index.vue'
import type { FormSummaryEntry } from '#kit/composables/form-renderer/useErrorSummary'

interface Props {
  /** The summary's heading; the kit ships none. */
  title?: string
  entries: FormSummaryEntry[]
}

withDefaults(defineProps<Props>(), { title: '' })

const emit = defineEmits<{ (event: 'pick', name: string): void }>()

const alert = useTemplateRef<{ $el: HTMLElement }>('alert')

defineExpose({ focus: () => alert.value?.$el.focus() })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/form-renderer' as t;

.ui-form-renderer-summary {
  $t: material-map(t.$tokens, 'md-form-renderer');

  &.ui-alert:focus-visible {
    @include focus-ring;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: g($t, 'summary.gap');
    margin: 0;
    padding-inline-start: g($t, 'summary.indent');
  }

  &__link {
    color: inherit;
  }
}
</style>
