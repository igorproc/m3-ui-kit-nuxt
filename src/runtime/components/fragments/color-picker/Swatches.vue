<template>
  <div
    :id="listId"
    class="ui-color-swatches"
    :class="{ 'ui-color-swatches--locked': ctx.locked.value }"
    role="listbox"
    :aria-label="ctx.messages.value.swatches"
    :aria-activedescendant="activeDescendant"
    :aria-disabled="ctx.disabled.value || undefined"
    :aria-readonly="ctx.readonly.value || undefined"
    :tabindex="ctx.disabled.value ? -1 : 0"
    @focus="onFocus"
    @blur="focused = false"
    @keydown="onKeydown"
  >
    <div
      v-for="(swatch, index) in entries"
      :id="swatch.id"
      :key="`${index}-${swatch.value}`"
      class="ui-color-swatches__item"
      :class="{
        'ui-color-swatches__item--selected': swatch.selected,
        'ui-color-swatches__item--active': focused && activeIndex === index,
      }"
      role="option"
      :aria-selected="swatch.selected"
      :aria-label="swatch.label"
      :style="{ '--swatch-color': swatch.value }"
      @pointerdown.prevent
      @click="choose(index)"
    >
      <MIcon
        v-if="swatch.selected"
        :name="ICONS.check"
        class="ui-color-swatches__check"
        :class="{ 'ui-color-swatches__check--dark': swatch.light }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Private palette of `MColorPicker`: a listbox with one tab stop, walked with
 * the arrows (the kit's listbox engine — no third keyboard controller), chosen
 * with Enter or Space. A swatch is the chosen one when it is the same colour
 * as the model, however either is spelled.
 */
import MIcon from '#kit/components/ui/icon/index.vue'
import { ICONS } from '#kit/shared/constants/icons'
import { useColorPickerContext } from '#kit/composables/color-picker/context'
import { useListbox } from '#kit/composables/listbox/useListbox'
import { isLightColor, normalizeSwatch, parseColor } from '#kit/shared/utils/color'
import type { ColorSwatch, RGBA } from '#kit/shared/utils/color'

interface Props {
  swatches: readonly ColorSwatch[]
}

const props = defineProps<Props>()

const ctx = useColorPickerContext()
const listId = useId()
const focused = ref(false)

/** Two spellings of one colour (`#6750a4`, `#6750A4`, `rgb(103 80 164)`) are one colour. */
function sameColor(left: RGBA, right: RGBA) {
  return Math.round(left.r) === Math.round(right.r)
    && Math.round(left.g) === Math.round(right.g)
    && Math.round(left.b) === Math.round(right.b)
    && Math.round(left.a * 100) === Math.round(right.a * 100)
}

const entries = computed(() => {
  const current = parseColor(ctx.value.value)
  return props.swatches.map(normalizeSwatch).map((swatch, index) => {
    const parsed = parseColor(swatch.value)
    return {
      ...swatch,
      // Index + value: two equal swatches in one palette stay two options.
      id: `${listId}-${index}`,
      disabled: ctx.locked.value,
      selected: current.ok && parsed.ok && sameColor(current.rgba, parsed.rgba),
      light: parsed.ok && isLightColor(parsed.rgba),
    }
  })
})

const { activeIndex, activeDescendant, setActive, move } = useListbox(entries, focused, () => false)

function onFocus() {
  focused.value = true
  const selected = entries.value.findIndex(entry => entry.selected)
  setActive(selected >= 0 ? selected : 0)
}

function choose(index: number) {
  const swatch = entries.value[index]
  if (!swatch || ctx.locked.value) return
  setActive(index)
  if (ctx.selectColor(swatch.value)) ctx.commit('swatch')
}

const isRtl = (event: KeyboardEvent) => getComputedStyle(event.currentTarget as Element).direction === 'rtl'

function onKeydown(event: KeyboardEvent) {
  const forward = isRtl(event) ? 'ArrowLeft' : 'ArrowRight'
  const backward = isRtl(event) ? 'ArrowRight' : 'ArrowLeft'
  const actions: Partial<Record<string, () => void>> = {
    [forward]: () => move('next'),
    [backward]: () => move('previous'),
    ArrowDown: () => move('next'),
    ArrowUp: () => move('previous'),
    Home: () => move('first'),
    End: () => move('last'),
    Enter: () => choose(activeIndex.value),
    [' ']: () => choose(activeIndex.value),
  }
  const action = actions[event.key]
  if (!action) return

  event.preventDefault()
  action()
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/color-picker/index' as t;

.ui-color-swatches {
  $t: material-map(t.$tokens, 'm-color-picker');

  display: flex;
  flex-wrap: wrap;
  gap: g($t, 'swatches.gap');
  border-radius: g($t, 'swatches.radius');
  outline: none;

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: g($t, 'swatches.size');
    height: g($t, 'swatches.size');
    border: g($t, 'swatches.outline-width') solid g($t, 'swatches.outline');
    border-radius: g($t, 'swatches.radius');
    background-color: var(--swatch-color);
    cursor: pointer;

    // The colour is the option itself: forcing would flatten every swatch.
    @include forced-colors {
      forced-color-adjust: none;
      border-color: CanvasText;
    }

    @media (prefers-reduced-motion: no-preference) {
      transition: transform g($t, 'swatches.motion.duration') g($t, 'swatches.motion.easing');

      @include can-hover {
        &:hover {
          transform: scale(g($t, 'swatches.hover-scale'));
        }
      }
    }

    // The chosen swatch: a ring in the content ink and a check, never colour
    // alone.
    &--selected {
      outline: g($t, 'swatches.selected.width') solid g($t, 'swatches.selected.ring');
      outline-offset: g($t, 'swatches.selected.width');

      @include forced-colors {
        outline-color: Highlight;
      }
    }

    // The keyboard's position in the list: the kit's focus ring.
    &--active {
      @include focus-ring;
    }
  }

  // The check stands out from the swatch it sits on: light ink on a dark
  // colour, dark ink on a light one.
  &__check {
    color: g($t, 'swatches.selected.check.on-dark');
    font-size: g($t, 'swatches.selected.check.size');

    &--dark {
      color: g($t, 'swatches.selected.check.on-light');
    }
  }

  &--locked &__item {
    cursor: default;
  }
}
</style>
