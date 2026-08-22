<template>
  <component
    :is="tag"
    ref="root"
    class="ui-app"
  >
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
// Явный импорт: в потребителе кит лежит в node_modules, а unimport не переписывает
// его SFC — авто-импорт стора там не инжектится (useThemeStore is not defined в SSR).
import { useThemeStore } from '#kit/store/theme'

interface MAppProps {
  tag?: string
}

interface MAppSlots {
  default(): unknown
  loading?(scope: {
    progress: number
    isLoading: boolean
  }): unknown
}

withDefaults(
  defineProps<MAppProps>(),
  { tag: 'div' },
)

defineSlots<MAppSlots>()

// MApp owns the theme head injection: html attributes (data-definition/palette/contrast)
// and the active palette's generated <style>. SSR-rendered (no FOUC), reactive on the client.
// Pinia unwraps the store's computeds on access, so re-wrap them in local
// `computed`s to keep the head reactive (a plain read would freeze at setup).
const theme = useThemeStore()
useHead({
  htmlAttrs: computed(() => theme.htmlAttrs),
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

defineExpose({ rootElement: rootElement?.value })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/app/index' as t;

.ui-app {
  $t: material-map(t.$tokens, 'md-app');

  min-height: g($t, 'root-min-height');
  background-color: g($t, 'root-background');
  color: g($t, 'root-color');

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
