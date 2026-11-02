<template>
  <div
    v-bind="rootAttrs()"
    class="ui-rating"
    :class="[
      `ui-rating--${color}`,
      {
        'ui-rating--disabled': disabled,
        'ui-rating--readonly': readonly,
        'ui-rating--invalid': isError,
      },
    ]"
  >
    <span
      v-if="label || $slots.label"
      :id="labelId"
      class="ui-rating__label"
    >
      <slot name="label">{{ label }}</slot>
      <span
        v-if="required"
        class="ui-rating__required"
        aria-hidden="true"
      > *</span>
    </span>

    <div
      ref="root"
      v-bind="controlAttrs(sliderAttrs())"
      class="ui-rating__control"
      role="slider"
      @focus="focused = true"
      @blur="focused = false"
      @keydown="onKeydown"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerLeave"
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
          <!-- Both glyphs share one glyph-sized box: the fill's share is a share
               of the glyph, and the full glyph sits exactly over the empty one.
               The preview lies under the committed fill, so only what it adds shows. -->
          <span class="ui-rating__glyph">
            <MIcon
              class="ui-rating__icon ui-rating__icon--empty"
              :name="emptyIcon"
            />
            <span
              v-if="previewValue !== null"
              class="ui-rating__preview"
              :style="{ width: `${shareOf(previewValue, index - 1) * 100}%` }"
            >
              <MIcon
                class="ui-rating__icon ui-rating__icon--full"
                :name="icon"
              />
            </span>
            <span
              class="ui-rating__fill"
              :style="{ width: `${shareOf(solidValue, index - 1) * 100}%` }"
            >
              <MIcon
                class="ui-rating__icon ui-rating__icon--full"
                :name="icon"
              />
            </span>
          </span>
        </slot>
      </span>
    </div>

    <input
      v-if="name || path"
      type="hidden"
      :name="name ?? path"
      :value="normalizedModel"
    >

    <ChoiceSupport
      v-if="hasSupport()"
      :id="supportId()"
      class="ui-rating__support"
      :is-error="isError"
      :message="message"
    >
      <template
        v-if="$slots.helper"
        #helper="scope"
      >
        <slot
          name="helper"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.error"
        #error="scope"
      >
        <slot
          name="error"
          v-bind="scope"
        />
      </template>
    </ChoiceSupport>
  </div>
</template>

<script setup lang="ts">
import ChoiceSupport from '#kit/components/fragments/choice-support/index.vue'
import MIcon from '#kit/components/ui/icon/index.vue'
import { createRangeKeyboardController } from '#kit/composables/slider/createRangeKeyboardController'
import { useControlAttrs } from '#kit/composables/useControlAttrs'
import { useChoiceField } from '#kit/utils/choice/useChoiceField'
import { ratingValueAt } from '#kit/utils/rating/pointer'
import { mRatingProps } from './props'
import type { MRatingSlots } from './props'

// The root holds the label, the slider and the support line; ARIA goes on
// the slider itself.
defineOptions({ inheritAttrs: false })
const { rootAttrs, controlAttrs } = useControlAttrs()

const props = defineProps(mRatingProps)
const slots = defineSlots<MRatingSlots>()
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
// A preview below the value shows the lower value; above it, only the addition is faded.
const solidValue = computed(() => Math.min(normalizedModel.value, renderedValue.value))
// A primary press that started on the control: only its release commits.
let pressed = false

function commit(value: number) {
  if (props.disabled || props.readonly) return
  const next = controller.snap(value)
  if (next === model.value) return
  model.value = next
  emit('change', next)
}

function itemBoxes() {
  const items = root.value?.querySelectorAll<HTMLElement>('.ui-rating__item') ?? []

  return Array.from(items, item => ({
    cell: item.getBoundingClientRect(),
    glyph: (item.querySelector('.ui-rating__glyph') ?? item).getBoundingClientRect(),
  }))
}

function valueFromPointer(event: PointerEvent) {
  const options = { rtl: rtl.value, step: safeStep.value, length: safeLength.value }
  return controller.snap(ratingValueAt(itemBoxes(), event.clientX, options))
}

function onPointerDown(event: PointerEvent) {
  pressed = event.button === 0 && !props.disabled && !props.readonly
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

function onPointerLeave() {
  pressed = false
  clearPreview()
}

function onPointerCommit(event: PointerEvent) {
  if (!pressed) return
  pressed = false
  const pointed = valueFromPointer(event)
  commit(props.clearable && pointed === normalizedModel.value ? 0 : pointed)
  if (event.pointerType === 'touch') clearPreview()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.disabled && !props.readonly) controller.onKeydown(event)
}

const { isError, message, hasSupport, supportId, inputAttrs } = useChoiceField(model, props, slots)
const labelId = `${inputAttrs().id}-label`

// Read-only stays a Tab stop (W24-А): its value is read by focus, as a slider's.
const sliderAttrs = () => {
  const field = inputAttrs()

  return {
    'id': field.id,
    'tabindex': props.disabled ? -1 : 0,
    'aria-valuemin': 0,
    'aria-valuemax': safeLength.value,
    'aria-valuenow': normalizedModel.value,
    'aria-valuetext': props.valueText?.(normalizedModel.value, safeLength.value),
    'aria-label': props.ariaLabel,
    'aria-labelledby': props.label || slots.label ? labelId : undefined,
    'aria-describedby': field['aria-describedby'],
    'aria-invalid': field['aria-invalid'],
    'aria-required': props.required ? 'true' as const : undefined,
    'aria-disabled': props.disabled ? 'true' as const : undefined,
    'aria-readonly': props.readonly ? 'true' as const : undefined,
  }
}

function shareOf(value: number, index: number) {
  return Math.min(1, Math.max(0, value - index))
}

function fillAt(index: number) {
  return shareOf(renderedValue.value, index)
}

watch(normalizedModel, (value) => {
  if (value !== model.value) model.value = value
}, { immediate: true })

if (import.meta.dev) {
  watch([() => props.length, () => props.step], ([length, step]) => {
    if (!(length > 0)) console.warn('[m-rating] length must be greater than zero')
    if (!(step > 0)) console.warn('[m-rating] step must be greater than zero')
  }, { immediate: true })

  // The kit ships no wording: a slider without a name is announced as nothing.
  const attrs = useAttrs()
  onMounted(() => {
    if (!props.ariaLabel && !props.label && !slots.label && !attrs['aria-labelledby']) {
      console.warn('[m-rating] the rating has no accessible name: pass `aria-label` or `aria-labelledby`.')
    }
  })
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/rating' as t;

.ui-rating {
  $t: material-map(t.$tokens, 'md-rating');

  display: inline-flex;
  flex-direction: column;
  max-inline-size: 100%;

  &__label {
    margin-block-end: g($t, 'label.gap');
    color: g($t, 'label.color');

    @include typescale(g($t, 'label.typography'));
  }

  &__required {
    color: g($t, 'label.required');
  }

  &__control {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: g($t, 'root.gap');
    border-radius: g($t, 'root.shape');
    outline: none;

    // A touch commits on release and never drags, so the page keeps its
    // vertical scroll over the stars.
    touch-action: pan-y;

    &:focus-visible {
      @include focus-ring;
    }
  }

  &__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'item.size');
    height: g($t, 'item.size');
    color: g($t, 'item.inactive-color');
  }

  &__glyph {
    position: relative;
    display: inline-flex;
    width: g($t, 'item.icon-size');
    height: g($t, 'item.icon-size');
  }

  &__icon {
    font-size: g($t, 'item.icon-size');
  }

  &__fill,
  &__preview {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    display: flex;
    overflow: hidden;
    color: g($t, 'item.primary-color');
    transition: width g($t, 'motion.duration') g($t, 'motion.easing');
  }

  &__preview {
    opacity: g($t, 'item.preview-opacity');
  }

  &--secondary &__fill,
  &--secondary &__preview {
    color: g($t, 'item.secondary-color');
  }

  &--tertiary &__fill,
  &--tertiary &__preview {
    color: g($t, 'item.tertiary-color');
  }

  &--error &__fill,
  &--error &__preview {
    color: g($t, 'item.error-color');
  }

  // An invalid rating: the empty items take the error role (W25-А); the line says why.
  &--invalid &__item {
    color: g($t, 'item.invalid-color');
  }

  &__support {
    padding-inline-start: 0;
  }

  // Disabled by roles: both glyphs fade to on-surface.
  &--disabled &__item,
  &--disabled &__fill,
  &--disabled &__label {
    color: g($t, 'disabled.color');
  }

  @media (prefers-reduced-motion: reduce) {
    &__fill,
    &__preview { transition: none; }
  }

  // Forced colors would paint filled and empty glyphs in one colour, leaving
  // only the glyph shape; Highlight keeps the value readable at a glance.
  @include forced-colors {
    & &__fill,
    & &__preview { color: Highlight; }

    &--disabled &__item,
    &--disabled &__fill { color: GrayText; }
  }
}
</style>
