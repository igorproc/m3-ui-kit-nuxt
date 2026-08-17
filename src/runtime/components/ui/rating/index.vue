<template>
  <div
    ref="root"
    class="ui-rating"
    :class="[
      `ui-rating--${color}`,
      { 'ui-rating--disabled': disabled, 'ui-rating--readonly': readonly },
    ]"
    role="slider"
    :tabindex="disabled || readonly ? -1 : 0"
    aria-valuemin="0"
    :aria-valuemax="safeLength"
    :aria-valuenow="normalizedModel"
    :aria-valuetext="`${normalizedModel} of ${safeLength}`"
    :aria-label="ariaLabel"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-readonly="readonly ? 'true' : undefined"
    @focus="focused = true"
    @blur="focused = false"
    @keydown="onKeydown"
    @pointermove="onPointerMove"
    @pointerleave="clearPreview"
    @pointerup="onPointerCommit"
  >
    <span
      v-for="index in safeLength"
      :key="index"
      class="ui-rating__item"
      aria-hidden="true"
    >
      <slot
        name="item"
        :index="index - 1"
        :value="index"
        :fill="fillAt(index - 1)"
        :active="fillAt(index - 1) > 0"
        :preview="previewValue !== null"
        :disabled="disabled"
      >
        <MIcon
          class="ui-rating__icon ui-rating__icon--empty"
          :name="emptyIcon"
        />
        <span
          class="ui-rating__fill"
          :style="{ width: `${fillAt(index - 1) * 100}%` }"
        >
          <MIcon
            class="ui-rating__icon ui-rating__icon--full"
            :name="icon"
          />
        </span>
      </slot>
    </span>
    <input
      v-if="name"
      type="hidden"
      :name="name"
      :value="normalizedModel"
    >
  </div>
</template>

<script setup lang="ts">
import MIcon from '#kit/components/ui/icon/index.vue'
import { createRangeKeyboardController } from '#kit/composables/slider/createRangeKeyboardController'
import { mRatingProps } from './props'

const props = defineProps(mRatingProps)
const model = defineModel<number>({ default: 0 })
const focused = defineModel<boolean>('focused', { default: false })
const emit = defineEmits<{
  (event: 'change', value: number): void
  (event: 'preview', value: number | null): void
}>()

const root = ref<HTMLElement>()
const previewValue = ref<number | null>(null)
const safeLength = computed(() => Math.max(1, Math.floor(props.length)))
const safeStep = computed(() => props.step > 0 ? props.step : 1)
const rtl = computed(() => root.value ? getComputedStyle(root.value).direction === 'rtl' : false)
const controller = createRangeKeyboardController({
  min: () => 0,
  max: () => safeLength.value,
  step: () => safeStep.value,
  getValue: () => model.value,
  setValue: commit,
  rtl: () => rtl.value,
})
const normalizedModel = computed(() => controller.snap(Number.isFinite(model.value) ? model.value : 0))
const renderedValue = computed(() => previewValue.value ?? normalizedModel.value)

function commit(value: number) {
  if (props.disabled || props.readonly) return
  const next = controller.snap(value)
  if (next === model.value) return
  model.value = next
  emit('change', next)
}

function valueFromPointer(event: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  if (!rect?.width) return normalizedModel.value
  const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  return controller.snap((rtl.value ? 1 - percent : percent) * safeLength.value)
}

function onPointerMove(event: PointerEvent) {
  if (props.disabled || props.readonly || event.pointerType === 'touch') return
  previewValue.value = valueFromPointer(event)
  emit('preview', previewValue.value)
}

function clearPreview() {
  if (previewValue.value === null) return
  previewValue.value = null
  emit('preview', null)
}

function onPointerCommit(event: PointerEvent) {
  if (props.disabled || props.readonly) return
  const pointed = valueFromPointer(event)
  commit(props.clearable && pointed === normalizedModel.value ? 0 : pointed)
  if (event.pointerType === 'touch') clearPreview()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.disabled && !props.readonly) controller.onKeydown(event)
}

function fillAt(index: number) {
  return Math.min(1, Math.max(0, renderedValue.value - index))
}

watch(normalizedModel, (value) => {
  if (value !== model.value) model.value = value
}, { immediate: true })

if (import.meta.dev) {
  watch([() => props.length, () => props.step], ([length, step]) => {
    if (!(length > 0)) console.warn('[m-rating] length must be greater than zero')
    if (!(step > 0)) console.warn('[m-rating] step must be greater than zero')
  }, { immediate: true })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/rating' as t;

.ui-rating {
  $t: material-map(t.$tokens, 'md-rating');

  display: inline-flex;
  align-items: center;
  gap: g($t, 'root-gap');
  border-radius: g($t, 'root-shape');
  outline: none;
  touch-action: none;

  &:focus-visible {
    outline: g($t, 'root-focus-width') solid g($t, 'root-focus-outline');
    outline-offset: g($t, 'root-focus-offset');
  }

  &--disabled {
    opacity: g($t, 'root-disabled-opacity');
  }

  &__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'item-size');
    height: g($t, 'item-size');
    color: g($t, 'item-inactive-color');
  }

  &__icon {
    font-size: g($t, 'item-icon-size');
  }

  &__fill {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    color: g($t, 'item-primary-color');
    transition: width g($t, 'motion-duration') g($t, 'motion-easing');
  }

  &--secondary &__fill { color: g($t, 'item-secondary-color'); }
  &--tertiary &__fill { color: g($t, 'item-tertiary-color'); }
  &--error &__fill { color: g($t, 'item-error-color'); }

  &:hover &__fill {
    opacity: g($t, 'item-preview-opacity');
  }

  @media (prefers-reduced-motion: reduce) {
    &__fill { transition: none; }
  }
}
</style>
