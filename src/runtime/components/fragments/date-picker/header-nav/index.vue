<template>
  <div class="ui-date-picker__nav">
    <!-- Named by what it shows; what it does follows, unseen. The month text is
         polite live: paging months says where the grid has gone. -->
    <button
      type="button"
      class="ui-date-picker__view-toggle"
      :class="{ 'ui-date-picker__view-toggle--open': view === 'year' }"
      :aria-expanded="view === 'year'"
      :aria-controls="yearsId"
      :disabled="disabled"
      @click="emit('toggle')"
    >
      <span
        :id="monthLabelId"
        aria-live="polite"
      >{{ monthLabel }}</span>
      <span class="ui-date-picker__sr">{{ view === 'calendar' ? switchToYearLabel : switchToDayLabel }}</span>
      <MIcon
        :name="ICONS.arrowDropDown"
        class="ui-date-picker__view-toggle-icon"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="view === 'calendar'"
      class="ui-date-picker__arrows"
    >
      <MButtonIcon
        type="button"
        class="ui-date-picker__arrow"
        :aria-label="prevLabel"
        :disabled="disabled || !canGoPrev"
        @click="emit('prev')"
      >
        <MIcon :name="ICONS.chevronLeft" />
      </MButtonIcon>

      <MButtonIcon
        type="button"
        class="ui-date-picker__arrow"
        :aria-label="nextLabel"
        :disabled="disabled || !canGoNext"
        @click="emit('next')"
      >
        <MIcon :name="ICONS.chevronRight" />
      </MButtonIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ICONS } from '#kit/shared/constants/icons'
import MButtonIcon from '#kit/components/ui/button/icon/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { mDatePickerHeaderNavProps } from './props'

defineProps(mDatePickerHeaderNavProps)

const emit = defineEmits<{
  (e: 'toggle' | 'prev' | 'next'): void
}>()
</script>
