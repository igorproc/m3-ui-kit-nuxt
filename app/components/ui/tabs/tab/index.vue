<template>
  <component
    :is="componentTag"
    :id="ctx.tabId(value)"
    ref="btnRef"
    class="ui-tabs__tab"
    :class="{
      'ui-tabs__tab--active': ticket.isSelected.value,
      'ui-tabs__tab--disabled': disabled,
    }"
    :type="isLink ? undefined : 'button'"
    :to="isLink ? to : undefined"
    role="tab"
    :aria-selected="ticket.isSelected.value"
    :aria-controls="ctx.panelId(value)"
    :tabindex="ticket.isSelected.value ? 0 : -1"
    :disabled="isLink ? undefined : disabled"
    :aria-disabled="isLink && disabled ? 'true' : undefined"
    @click="onSelect"
  >
    <span
      v-if="icon"
      class="ui-tabs__tab-icon"
    >
      <m-icon :name="icon" />
    </span>

    <span class="ui-tabs__tab-label">
      <slot>
        {{ label }}
      </slot>
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useTabsContext } from '~/composables/tabs/useTabs'
import MIcon from '~/components/ui/icon/index.vue'
import type { MTabProps } from './props'

const props = withDefaults(defineProps<MTabProps>(), { disabled: false })
const NuxtLink = defineAsyncComponent(async () => await import('#app/components/nuxt-link'))
const isLink = computed(() => props.to !== undefined)
const componentTag = computed(() => isLink.value ? NuxtLink : 'button')

const ctx = useTabsContext()

const btnRef = ref<HTMLElement | null>(null)

const ticket = ctx.register({
  value: props.value,
  disabled: () => props.disabled,
})

onScopeDispose(() => ctx.unregister(ticket.id))

// Move DOM focus here when the orchestrator's keyboard nav targets this tab.
watch(ctx.focusedValue, (value) => {
  if (value !== props.value) return

  nextTick(() => btnRef.value?.focus())
})

function onSelect(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }

  ticket.select()
}
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/tabs/index' as t;

.ui-tabs__tab {
  $prefix: 'md-tabs';
  $t: material-map(t.$tokens, $prefix);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: g($t, 'tab-gap');
  padding-inline: g($t, 'tab-padding-inline');
  min-height: g($t, 'tab-min-height');
  flex: 1;
  border: none;
  background-color: transparent;
  color: g($t, 'tab-text-color');
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transition:
    color var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);

  @include typescale(g($t, 'typography-label'));

  &-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: g($t, 'tab-icon-size');
  }

  &-label {
    white-space: nowrap;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: g($t, 'state-layer-bg');
    opacity: 0;
    transition: opacity var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &:hover::before {
    opacity: g($t, 'state-layer-opacity-hover');
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: g($t, 'indicator-height');
    background-color: g($t, 'indicator-color');
    border-radius: 3rem 3rem 0 0;
    transform: translateX(-50%);
    transition: width var(--sys-motion-duration-short-3) var(--sys-motion-easing-standard);
  }

  &--active {
    color: g($t, 'active-color');

    &::after {
      width: g($t, 'indicator-active-width');
    }

    &::before {
      background-color: g($t, 'state-layer-active-bg');
    }
  }

  &--disabled {
    cursor: default;
    opacity: g($t, 'disabled-opacity');
    pointer-events: none;
  }
}
</style>
