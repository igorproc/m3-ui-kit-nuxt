<template>
  <div
    ref="root"
    class="ui-lazy"
    :class="rootClasses"
    :style="reserveStyle"
    v-bind="rootAttrs"
  >
    <div
      v-if="view === 'placeholder'"
      class="ui-lazy__placeholder"
    >
      <slot
        name="placeholder"
        v-bind="slotState"
      />
    </div>

    <div
      v-else-if="view === 'fallback'"
      class="ui-lazy__fallback"
    >
      <slot
        name="fallback"
        v-bind="slotState"
      />
    </div>

    <div
      v-else-if="view === 'error' && $slots.error"
      class="ui-lazy__error"
    >
      <slot
        name="error"
        v-bind="slotState"
        :error="error"
      />
    </div>

    <Suspense
      v-if="isMounted"
      :key="attempt"
      v-bind="suspenseAttrs"
    >
      <div class="ui-lazy__content">
        <slot v-bind="slotState" />
      </div>
    </Suspense>

    <div
      v-if="!$slots.error"
      class="ui-lazy__alert"
    >
      <div
        v-bind="alertAttrs"
        class="ui-lazy__message"
      >
        {{ view === 'error' ? errorText : '' }}
      </div>

      <MButton
        v-if="view === 'error'"
        variant="outlined"
        @click="retry"
      >
        {{ retryLabel }}
      </MButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import { useLazyControl } from '#kit/composables/lazy/useLazyControl'
import { useLazyWarnings } from '#kit/composables/lazy/useLazyWarnings'
import { mLazyProps } from './props'
import type { MLazyEmits, MLazySlots, MLazySlotState } from './props'

const props = defineProps(mLazyProps)
const activeModel = defineModel<boolean | undefined>('active', { default: undefined })
const emit = defineEmits<MLazyEmits>()
const slots = defineSlots<MLazySlots>()

const {
  root,
  status,
  view,
  attempt,
  isMounted,
  isActivator,
  activation,
  error,
  activate,
  retry,
  rootAttrs,
  suspenseAttrs,
  alertAttrs,
} = useLazyControl(activeModel, props, {
  onActivate: next => emit('activate', next),
  onVisible: () => emit('visible'),
  onPending: () => emit('pending'),
  onResolve: () => emit('resolve'),
  onError: captured => emit('error', captured),
}, {
  hasFallback: () => Boolean(slots.fallback),
})

useLazyWarnings(props, slots, () => root.value, () => isActivator.value)

const waitedOnClient = shallowRef(false)

onMounted(() => {
  waitedOnClient.value = status.value === 'idle'
})

const rootClasses = computed(() => [
  `ui-lazy--${status.value}`,
  {
    'ui-lazy--animated': props.transition && (waitedOnClient.value || attempt.value > 0),
    'ui-lazy--activator': isActivator.value,
  },
])

const reserveStyle = computed(() => ({
  minWidth: toCssSize(props.minWidth),
  minHeight: toCssSize(props.minHeight),
}))

const slotState = computed<MLazySlotState>(() => ({
  status: status.value,
  isActive: status.value === 'active',
  activation: activation.value,
  activate,
  retry,
}))

function toCssSize(value: string | number | undefined) {
  return typeof value === 'number' ? `${value}rem` : value
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/lazy' as t;

.ui-lazy {
  $t: material-map(t.$tokens, 'md-lazy');

  display: block;

  &:focus-visible {
    @include focus-ring;
  }

  &--activator {
    cursor: pointer;
  }

  &__placeholder,
  &__fallback,
  &__error,
  &__content {
    min-width: inherit;
    min-height: inherit;
  }

  &__alert {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: g($t, 'alert.gap');
  }

  &__message {
    max-width: 100%;
    color: g($t, 'alert.message.color');
    overflow-wrap: anywhere;

    @include typescale('body-medium');
  }

  &--animated > &__fallback,
  &--animated > &__error,
  &--animated > &__content,
  &--animated#{&}--error > &__alert {
    animation: ui-lazy-reveal g($t, 'reveal.duration') g($t, 'reveal.easing');
  }
}

@keyframes ui-lazy-reveal {
  from {
    opacity: 0;
  }
}
</style>
