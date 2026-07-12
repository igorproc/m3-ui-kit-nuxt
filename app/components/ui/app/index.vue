<template>
  <component
    :is="tag"
    ref="root"
    class="ui-app"
  >
    <slot />

    <slot
      name="loading"
      :progress="readonlyProgress"
      :is-loading="readonlyIsLoading"
    />

    <ClientOnly>
      <core-scope />
    </ClientOnly>
  </component>

  <div
    id="ui-overlay-host"
    class="ui-app__overlay-host"
  />
</template>

<script setup lang="ts">
import type { ComputedRef, Ref } from 'vue'

interface MAppProps {
  /** HTML element used for the neutral PrimeTime application boundary. */
  tag?: string
}

interface MAppSlots {
  default(): unknown
  loading?(scope: {
    progress: Readonly<Ref<number>>
    isLoading: Readonly<ComputedRef<boolean>>
  }): unknown
}

withDefaults(defineProps<MAppProps>(), {
  tag: 'div',
})

defineSlots<MAppSlots>()

useThemeStore()

// Duplicate detection runs client-side only (in `onMounted`) so the server
// never seeds the flag: otherwise a single hydrated <MApp> would read its own
// SSR-serialized `true` on the client and false-positive on every load.
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
const readonlyProgress = readonly(progress)
const readonlyIsLoading = readonly(computed(() => isLoading.value))
const rootElement = useTemplateRef<HTMLElement>('root')

defineExpose({
  rootElement: readonly(rootElement),
})
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/app/index' as t;

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
