<template>
  <div class="ui-app-bar__headline">
    <slot>
      <p
        v-if="title"
        class="ui-app-bar__title"
      >
        {{ title }}
      </p>
    </slot>

    <slot name="subtitle">
      <p
        v-if="subtitle"
        class="ui-app-bar__subtitle"
      >
        {{ subtitle }}
      </p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, useSlots } from 'vue'
import { useAppBarContext } from '#kit/composables/app-bar/useAppBar'
import { mAppBarTitleProps } from './props'

const props = defineProps(mAppBarTitleProps)
const slots = useSlots()

const ctx = useAppBarContext()

// Report subtitle presence up so the container can pick the taller MD3 height
// variant even when this title is composed as a child rather than a prop.
const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle)
onScopeDispose(ctx.registerSubtitle(hasSubtitle))
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar__headline {
  grid-area: #{g($title, 'grid-name')};
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: g($title, 'gap');
  min-width: 0;
}

.ui-app-bar__title {
  margin: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  @include apply-typography(g($title, 'typography.small'));
}

.ui-app-bar__subtitle {
  margin: 0;
  color: g($title, 'subtitle.color');
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  @include apply-typography(g($title, 'subtitle.typography'));
}
</style>
