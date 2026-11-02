<template>
  <section class="fixture-tooltip-stress">
    <h1>MTooltip — stress content</h1>

    <div class="fixture-tooltip-stress__row">
      <MTooltip text="Supercalifragilisticexpialidociousandthensomemorewithoutanyspaceatall">
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="long-word"
          >
            Long word
          </MButton>
        </template>
      </MTooltip>

      <MTooltip
        variant="rich"
        subhead="Terms"
        :text="longText"
      >
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="long-text"
          >
            Long text
          </MButton>
        </template>
      </MTooltip>

      <MTooltip text="">
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="empty-bound"
          >
            Empty, slot props
          </MButton>
        </template>
      </MTooltip>

      <MTooltip text="">
        <MButton
          variant="outlined"
          data-test="empty-auto"
        >
          Empty, auto link
        </MButton>
      </MTooltip>
    </div>

    <div
      v-for="corner in corners"
      :key="corner"
      class="fixture-tooltip-stress__corner"
      :class="`fixture-tooltip-stress__corner--${corner}`"
    >
      <MTooltip :text="`Tooltip in the ${corner} corner`">
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="text"
            :data-test="`corner-${corner}`"
          >
            {{ corner }}
          </MButton>
        </template>
      </MTooltip>
    </div>

    <MButton
      data-test="open-dialog"
      @click="dialog = true"
    >
      Open dialog
    </MButton>
    <MDialog
      v-model="dialog"
      title="Tooltip in a dialog"
    >
      <MTooltip text="Shown above the modal dialog">
        <template #default="{ props }">
          <MButton
            v-bind="props"
            variant="outlined"
            data-test="in-dialog"
          >
            Inside the dialog
          </MButton>
        </template>
      </MTooltip>
    </MDialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MDialog from '#kit/components/ui/dialog/index.vue'
import MTooltip from '#kit/components/ui/tooltip/index.vue'

const longText = 'By continuing you accept that the service is provided as is. '.repeat(8).trim()
const corners = ['top-start', 'top-end', 'bottom-start', 'bottom-end']
const dialog = ref(false)
</script>

<style lang="scss">
.fixture-tooltip-stress {
  display: grid;
  gap: 48rem;
  justify-items: start;
  padding-block: 48rem;

  &__row {
    display: flex;
    flex-wrap: wrap;
    gap: 48rem;
  }

  &__corner {
    position: fixed;

    &--top-start {
      inset-block-start: 0;
      inset-inline-start: 0;
    }

    &--top-end {
      inset-block-start: 0;
      inset-inline-end: 0;
    }

    &--bottom-start {
      inset-block-end: 0;
      inset-inline-start: 0;
    }

    &--bottom-end {
      inset-block-end: 0;
      inset-inline-end: 0;
    }
  }
}
</style>
