<template>
  <div
    class="ui-app-bar__headline"
    :class="{ 'ui-app-bar__headline--subtitle': hasSubtitle }"
  >
    <slot>
      <component
        :is="titleTag"
        v-if="title"
        class="ui-app-bar__title"
        :class="{ 'ui-app-bar__title--single': !ctx.wraps.value }"
      >
        <!-- Inside the heading: the tooltip's wrappers are phrasing content, the heading's own text stays its name. -->
        <MTooltip
          v-if="!ctx.wraps.value"
          class="ui-app-bar__tooltip"
          :text="title"
          :disabled="!truncated"
          placement="bottom"
        >
          <span
            ref="text"
            class="ui-app-bar__text"
          >{{ title }}</span>
        </MTooltip>

        <template v-else>
          {{ title }}
        </template>
      </component>
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
import { computed, onScopeDispose, toRef, useSlots, useTemplateRef } from 'vue'
import { useAppBarContext } from '#kit/composables/app-bar/useAppBar'
import { useTitleTruncation } from '#kit/composables/app-bar/useTitleTruncation'
import MTooltip from '#kit/components/ui/tooltip/index.vue'
import { mAppBarTitleProps } from './props'

const props = defineProps(mAppBarTitleProps)
const slots = useSlots()

const ctx = useAppBarContext()

// Report subtitle presence up so the container can pick the taller MD3 height
// variant even when this title is composed as a child rather than a prop.
const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle)
onScopeDispose(ctx.registerSubtitle(hasSubtitle))
onScopeDispose(ctx.registerTitle(toRef(props, 'title')))

const titleTag = computed(() => {
  const level = props.headingLevel ?? ctx.headingLevel.value
  return level ? `h${level}` : 'p'
})

// A one-line title cut by its ellipsis shows the full text in a tooltip.
const textEl = useTemplateRef<HTMLElement>('text')
const truncated = useTitleTruncation(textEl, () => props.title)
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app-bar/index' as *;

.ui-app-bar__headline {
  grid-area: #{g($title, 'area')};
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

  // One line: the text inside the tooltip's trigger carries the ellipsis; a
  // column flex stretches the trigger to the heading's width.
  &--single {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
}

// The tooltip's own wrapper takes no box, so its trigger is the heading's flex
// item. Compound: it must outrank `.ui-tooltip` whatever the chunk order.
.ui-tooltip.ui-app-bar__tooltip {
  display: contents;
}

.ui-app-bar__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-app-bar__subtitle {
  margin: 0;
  color: g($title, 'subtitle.color');
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  @include apply-typography(g($title, 'subtitle.typography.small'));
}
</style>
