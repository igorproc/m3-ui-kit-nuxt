<template>
  <component
    :is="tag"
    ref="root"
    class="ui-app"
  >
    <a
      v-if="skipLinkLabel"
      class="ui-app__skip-link"
      :href="`#${skipLinkTarget}`"
    >
      {{ skipLinkLabel }}
    </a>

    <slot />

    <slot
      name="loading"
      :progress="progress"
      :is-loading="isLoading"
    />

    <core-scope />
  </component>
</template>

<script setup lang="ts">
import { useMaterialTheme } from '#kit/composables/useMaterialTheme'
import { mAppProps } from './props'
import type { MAppExposed, MAppSlots } from './props'

defineProps(mAppProps)

defineSlots<MAppSlots>()

const theme = useMaterialTheme()
useHead({
  htmlAttrs: {
    'data-definition': () => theme.htmlAttrs['data-definition'],
    'data-palette': () => theme.htmlAttrs['data-palette'],
    'data-contrast': () => theme.htmlAttrs['data-contrast'],
  },
  style: [{ id: 'material-kit-theme', innerHTML: computed(() => theme.themeCss) }],
})

const appRegistered = useState('material-kit:m-app-registered', () => false)

onMounted(() => {
  if (appRegistered.value && process.env.NODE_ENV !== 'production') {
    console.warn('[PrimeTime UI] Only one <MApp> may be mounted per document. Remove the duplicate application boundary.')
  }

  appRegistered.value = true
})

onBeforeUnmount(() => {
  appRegistered.value = false
})

const { progress, isLoading } = useLoadingIndicator({ throttle: 0 })
const rootElement = useTemplateRef<HTMLElement>('root')

defineExpose<MAppExposed>({ rootElement })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app/index' as t;

.ui-app {
  $t: material-map(t.$tokens, 'md-app');

  min-height: g($t, 'root.min-height');
  background-color: g($t, 'root.background');
  color: g($t, 'root.color');

  &__skip-link {
    position: fixed;
    inset-block-start: g($t, 'skip-link.inset');
    inset-inline-start: g($t, 'skip-link.inset');
    z-index: g($t, 'skip-link.z-index');
    display: inline-flex;
    align-items: center;
    min-height: g($t, 'skip-link.min-height');
    padding-inline: g($t, 'skip-link.padding.inline');
    border-radius: g($t, 'skip-link.shape');
    background-color: g($t, 'skip-link.container.color');
    color: g($t, 'skip-link.color');
    box-shadow: g($t, 'skip-link.elevation');

    @include typescale(g($t, 'skip-link.typography'));

    &:not(:focus) {
      @include sr-only;
    }

    &:focus-visible {
      @include focus-ring;
    }

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &__overlay-host {
    position: fixed;
    inset: 0;
    z-index: g($t, 'overlay.host.z-index');
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }
}
</style>
