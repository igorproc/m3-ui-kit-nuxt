<template>
  <div
    ref="root"
    class="ui-lazy"
    :class="`ui-lazy--${status}`"
    :style="boundaryStyle"
    @pointerenter="onInteraction('pointerenter', $event)"
    @pointerdown="onInteraction('pointerdown', $event)"
    @click="onInteraction('click', $event)"
    @focusin="onInteraction('focus', $event)"
  >
    <Transition
      :name="transitionName"
      mode="out-in"
    >
      <div
        v-if="status === 'error'"
        key="error"
        class="ui-lazy__error"
      >
        <slot
          name="error"
          v-bind="slotState"
          :error="capturedError"
        />
      </div>

      <div
        v-else-if="isActivated"
        :key="retryKey"
        class="ui-lazy__content"
      >
        <Suspense
          @pending="onPending"
          @resolve="onResolve"
        >
          <div class="ui-lazy__boundary">
            <slot v-bind="slotState" />
          </div>

          <template #fallback>
            <div class="ui-lazy__fallback">
              <slot
                v-if="$slots.fallback"
                name="fallback"
                v-bind="slotState"
              />
              <slot
                v-else
                name="placeholder"
                v-bind="slotState"
              />
            </div>
          </template>
        </Suspense>
      </div>

      <div
        v-else
        key="placeholder"
        class="ui-lazy__placeholder"
      >
        <slot
          name="placeholder"
          v-bind="slotState"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { mLazyProps } from './props'
import type { MLazyInteraction } from './props'

export type MLazyStatus = 'idle' | 'pending' | 'active' | 'error'
export type MLazyActivationReason = 'eager' | 'idle' | 'view' | 'interaction' | 'manual'

export interface MLazyActivation {
  reason: MLazyActivationReason
  event?: Event
}

export interface MLazySlotState {
  status: MLazyStatus
  isActive: boolean
  activation: MLazyActivation | null
  activate: () => void
  retry: () => void
}

interface IdleWindow extends Window {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

const props = defineProps(mLazyProps)
const activeModel = defineModel<boolean | undefined>('active', { default: undefined })

const emit = defineEmits<{
  (event: 'activate', activation: MLazyActivation): void
  (event: 'visible' | 'pending' | 'resolve'): void
  (event: 'error', error: unknown): void
}>()

defineSlots<{
  default(props: MLazySlotState): unknown
  placeholder?(props: MLazySlotState): unknown
  fallback?(props: MLazySlotState): unknown
  error?(props: MLazySlotState & { error: unknown }): unknown
}>()

const root = ref<HTMLElement>()
const internalActive = ref(props.disabled || props.mode === 'eager' || activeModel.value === true)
const status = ref<MLazyStatus>(internalActive.value ? 'pending' : 'idle')
const activation = shallowRef<MLazyActivation | null>(
  props.disabled || props.mode === 'eager' ? { reason: 'eager' } : null,
)
const capturedError = shallowRef<unknown>()
const retryKey = ref(0)

const isControlled = computed(() => activeModel.value !== undefined)
const isActivated = computed(() => isControlled.value ? activeModel.value === true : internalActive.value)
const transitionName = computed(() => props.transition === false ? undefined : props.transition)
const boundaryStyle = computed(() => ({
  minWidth: toCssSize(props.minWidth),
  minHeight: toCssSize(props.minHeight),
}))

const slotState = computed<MLazySlotState>(() => ({
  status: status.value,
  isActive: status.value === 'active',
  activation: activation.value,
  activate: () => activate('manual'),
  retry,
}))

const observer = useIntersectionObserver(
  root,
  (entries) => {
    const visible = entries.some(entry => entry.isIntersecting)

    if (visible) {
      emit('visible')
      activate('view')
    } else if (!props.once && props.mode === 'on-view' && !isControlled.value) {
      deactivate()
    }
  },
  {
    immediate: false,
    rootMargin: props.rootMargin,
    threshold: props.threshold,
  },
)

let cancelIdle: (() => void) | undefined

function toCssSize(value: string | number | undefined) {
  if (typeof value === 'number') return `${value}rem`
  return value
}

function activate(reason: MLazyActivationReason, event?: Event) {
  if (isActivated.value || (props.once && status.value === 'active')) return

  const nextActivation = { reason, event }
  activation.value = nextActivation
  capturedError.value = undefined
  status.value = 'pending'
  internalActive.value = true
  activeModel.value = true
  emit('activate', nextActivation)

  if (props.once) stopTriggers()
}

function deactivate() {
  internalActive.value = false
  activeModel.value = false
  status.value = 'idle'
  activation.value = null
}

function retry() {
  capturedError.value = undefined
  status.value = 'pending'
  retryKey.value += 1

  if (!isActivated.value) activate('manual')
}

function onPending() {
  status.value = 'pending'
  emit('pending')
}

function onResolve() {
  status.value = 'active'
  emit('resolve')
}

function onInteraction(interaction: MLazyInteraction, event: Event) {
  if (props.mode !== 'on-interaction' || !props.interactions.includes(interaction)) return
  activate('interaction', event)
}

function scheduleIdle() {
  if (!import.meta.client) return

  const idleWindow = window as IdleWindow

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(() => activate('idle'), { timeout: props.timeout })
    cancelIdle = () => idleWindow.cancelIdleCallback?.(handle)
    return
  }

  const handle = window.setTimeout(() => activate('idle'), props.timeout)
  cancelIdle = () => window.clearTimeout(handle)
}

function stopTriggers() {
  observer.stop()
  cancelIdle?.()
  cancelIdle = undefined
}

function startTriggers() {
  stopTriggers()

  if (props.disabled || props.mode === 'eager') {
    activate('eager')
  } else if (props.mode === 'on-view') {
    observer.resume()
  } else if (props.mode === 'on-idle') {
    scheduleIdle()
  }
}

watch(
  () => [props.mode, props.disabled, props.rootMargin, props.threshold] as const,
  () => {
    if (!isActivated.value || !props.once) startTriggers()
  },
)

watch(activeModel, (value) => {
  if (value === true && !internalActive.value) {
    internalActive.value = true
    activation.value = { reason: 'manual' }
    status.value = 'pending'
  } else if (value === false) {
    internalActive.value = false
    status.value = 'idle'
    activation.value = null
    if (!props.once) nextTick(startTriggers)
  }
})

onErrorCaptured((error) => {
  capturedError.value = error
  status.value = 'error'
  emit('error', error)
  return false
})

onMounted(startTriggers)
onScopeDispose(stopTriggers)
</script>

<style lang="scss">
@use '~/assets/stylesheet/components/lazy' as t;

.ui-lazy {
  $t: material-map(t.$tokens, 'md-lazy');

  display: block;

  &__content,
  &__boundary,
  &__placeholder,
  &__fallback,
  &__error {
    min-width: inherit;
    min-height: inherit;
  }

  &-enter-active {
    transition:
      opacity g($t, 'motion-duration') g($t, 'motion-easing'),
      transform g($t, 'motion-duration') g($t, 'motion-easing');
  }

  &-leave-active {
    transition: opacity g($t, 'motion-exit-duration') g($t, 'motion-easing');
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }

  &-enter-from {
    transform: translateY(g($t, 'motion-offset'));
  }

  @media (prefers-reduced-motion: reduce) {
    &-enter-active,
    &-leave-active {
      transition: none;
    }

    &-enter-from {
      transform: none;
    }
  }
}
</style>
