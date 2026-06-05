<template>
  <header class="ui-date-picker__header">
    <div class="ui-date-picker__headline">
      <p class="ui-date-picker__headline-label">
        <slot name="label">
          {{ headlineLabel }}
        </slot>
      </p>

      <p
        class="ui-date-picker__headline-date"
        :class="{ 'ui-date-picker__headline-date--placeholder': placeholder }"
      >
        <slot name="date">
          {{ selectedLabel }}
        </slot>
      </p>
    </div>

    <div class="ui-date-picker__controls">
      <div class="ui-date-picker__month-selector">
        <button
          type="button"
          class="ui-date-picker__view-toggle"
          @click="emit('toggle')"
        >
          {{ monthYearLabel }}
          <MIcon
            :name="view === 'calendar' ? ICONS.arrowDropDown : ICONS.arrowDropUp"
            class="ui-date-picker__view-toggle-icon"
          />
        </button>

        <div
          v-if="view === 'calendar'"
          class="ui-date-picker__month-arrows"
        >
          <button
            type="button"
            class="ui-date-picker__icon-button"
            aria-label="Previous month"
            :disabled="!canGoPrev"
            @click="emit('prev')"
          >
            <MIcon :name="ICONS.chevronLeft" />
          </button>

          <button
            type="button"
            class="ui-date-picker__icon-button"
            aria-label="Next month"
            :disabled="!canGoNext"
            @click="emit('next')"
          >
            <MIcon :name="ICONS.chevronRight" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'
import MIcon from '~/components/ui/icon/index.vue'

interface Props {
  headlineLabel: string
  selectedLabel: string
  monthYearLabel: string
  view: 'calendar' | 'year'
  placeholder?: boolean
  canGoPrev?: boolean
  canGoNext?: boolean
}

withDefaults(defineProps<Props>(), {
  placeholder: false,
  canGoPrev: true,
  canGoNext: true,
})

const emit = defineEmits<{
  (e: 'toggle' | 'prev' | 'next'): void
}>()
</script>
