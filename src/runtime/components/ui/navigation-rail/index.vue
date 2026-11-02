<template>
  <nav
    class="ui-navigation-rail"
    :class="[
      `ui-navigation-rail--${mode}`,
      {
        'ui-navigation-rail--expanded': expandedInPlace,
        'ui-navigation-rail--concealed': mode === 'dismissible',
        'ui-navigation-rail--hosted': isAsideHosted,
        'ui-navigation-rail--in-scroller': hostIsScroller,
        'ui-navigation-rail--standalone': standalone,
      },
    ]"
    :aria-label="ariaLabel"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <RailContent
      :items="items"
      :selected-value="selectedValue"
      :expanded="expandedInPlace"
      :list-id="listId"
      :fade-label="toggled"
      @select="onSelect"
    >
      <template
        v-if="$slots.header"
        #header
      >
        <slot
          name="header"
          :expanded="expanded"
          :toggle-attrs="toggleAttrs"
        />
      </template>
    </RailContent>

    <MOverlay
      v-if="mode !== 'standard'"
      :id="dialogId"
      v-model="expanded"
      mode="modal"
      content-transition="ui-navigation-rail-modal"
      content-class="ui-navigation-rail__modal-panel"
      :aria-label="ariaLabel"
    >
      <nav
        class="ui-navigation-rail__modal"
        :aria-label="ariaLabel"
      >
        <RailContent
          :items="items"
          :selected-value="selectedValue"
          expanded
          @select="onSelect"
        >
          <template
            v-if="$slots.header"
            #header
          >
            <slot
              name="header"
              :expanded="expanded"
              :toggle-attrs="toggleAttrs"
            />
          </template>
        </RailContent>
      </nav>
    </MOverlay>
  </nav>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, watch } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import RailContent from '#kit/components/fragments/navigation-rail/content.vue'
import { provideNavigationRailContext } from '#kit/composables/navigation/useNavigationRail'
import { useNavigationModel } from '#kit/utils/navigation/useNavigationModel'
import { mNavigationRailProps } from './props'
import type { MNavigationRailEmits, MNavigationRailSlots, MNavigationRailToggleAttrs } from './props'

const props = defineProps(mNavigationRailProps)
const emit = defineEmits<MNavigationRailEmits>()
defineSlots<MNavigationRailSlots>()

const modelValue = defineModel<string | null>({ default: null })
const expanded = defineModel<boolean>('expanded', { default: false })

// Only a standard rail expands in the grid; the off-grid modes expand over the
// content and keep the grid rail collapsed (modal) or hidden (dismissible).
const expandedInPlace = computed(() => props.mode === 'standard' && expanded.value)

// The width the layout reserves follows what stays in the grid: an expanded
// standard rail pushes the content, a modal one never does.
const sizeToken = computed(() => {
  if (props.mode === 'dismissible') return '0rem'
  return expandedInPlace.value ? '--ui-navigation-rail-width-expanded' : '--ui-navigation-rail-width'
})

// Первый уровень m-layout → start-зона (прижат sticky); внутри m-layout-aside —
// вклад ширины в зону (раскрытие меняет токен → грид анимируется)
const { layoutItemStyles, layoutItemAttrs, hostKind, hostIsScroller } = useLayoutItem({
  kind: 'start',
  sizeToken,
  sticky: true,
})

const standalone = !useLayoutZone()

// Заполняет только боковую зону; в main рейл — обычный контент своей ширины
const isAsideHosted = computed(() => hostKind.value === 'start' || hostKind.value === 'end')

const { single, selectedValue, select } = useNavigationModel(() => props.items, modelValue)

provideNavigationRailContext({
  register: ticket => single.register(ticket),
  unregister: id => single.unregister(id),
  select: id => single.select(id),
  selectedValue: single.selectedValue,
  expanded: expandedInPlace,
})

const listId = useId()
const dialogId = useId()

// Labels fade between the two layouts only once the rail has been toggled: on
// the first render they are already where they belong.
const toggled = shallowRef(false)
watch(expanded, () => {
  toggled.value = true
})

const toggleAttrs = computed<MNavigationRailToggleAttrs>(() => ({
  'aria-expanded': expanded.value,
  'aria-controls': props.mode === 'standard' ? listId : dialogId,
  'onClick': () => {
    expanded.value = !expanded.value
  },
}))

// Every activation is reported, the active destination's too: pressing it
// again is how an app scrolls a section back to its top or resets it.
function onSelect(id: string, event: MouseEvent) {
  select(id)
  emit('select', id, event)
}
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-rail/index' as t;

$t: material-map(t.$tokens, 'md-navigation-rail');

// Width tokens exported globally (consumed by layouts and the rail's own width).
:root {
  --ui-navigation-rail-width: #{t.$width};
  --ui-navigation-rail-width-expanded: #{t.$width-expanded};
}

.ui-navigation-rail {
  width: var(--ui-navigation-rail-width);
  background-color: g($t, 'container.color');
  display: flex;
  flex-direction: column;
  color: g($t, 'container.text.color');
  transition: width g($t, 'container.motion.duration') g($t, 'container.motion.easing');
  overflow: hidden;

  // Вложенный в зону случай (m-layout-aside): прижат с учётом прибитых краёв
  // лейаута; на первом уровне generated-правило движка (#id > [data-m3-zone])
  // специфичнее и переопределяет это per-item оффсетами
  position: sticky;
  top: g($t, 'container.in-page.top');
  height: g($t, 'container.in-page.height');
  z-index: z(aside);

  &--standalone {
    height: g($t, 'container.standalone.height');
    max-height: g($t, 'container.standalone.max-height');
  }

  &--expanded {
    width: var(--ui-navigation-rail-width-expanded);
  }

  // A dismissible rail is not in the grid while collapsed; it only opens over the content.
  &--concealed {
    display: none;
  }

  // Page content of a `full-height` main: main is the scroller and already
  // sits between the pinned bands, so the rail sticks to main's own top and is
  // as tall as main's visible height.
  &--in-scroller {
    top: 0;
    height: g($t, 'container.in-scroller.height');
  }

  // A hosting side zone (m-layout-aside) already owns viewport anchoring and
  // receives this component's width contribution. Inside it the rail fills the
  // zone and must not create a second sticky viewport box.
  &--hosted {
    width: 100%;
    min-height: 0;
    height: auto;
    position: static;
    z-index: auto;
  }

  // The container is set apart by its tone alone, which forced colors drop.
  @include forced-colors {
    outline: 1px solid CanvasText;
    outline-offset: -1px;
  }
}

// The expanded rail over the content: a flex child of the <MOverlay> panel,
// full height, pinned to the start edge.
.ui-navigation-rail__modal {
  align-self: stretch;
  margin-inline-end: auto;
  display: flex;
  flex-direction: column;
  width: var(--ui-navigation-rail-width-expanded);
  max-width: 100%;
  height: 100%;
  background-color: g($t, 'modal.color');
  color: g($t, 'container.text.color');
  box-shadow: g($t, 'modal.shadow');
  border-start-end-radius: g($t, 'modal.shape');
  border-end-end-radius: g($t, 'modal.shape');

  @include forced-colors {
    border: 1px solid CanvasText;
  }
}

// Slides in from the start edge, as the drawer; the panel carries the same
// timing because Vue ends the phase by the panel's duration.
.ui-navigation-rail-modal {
  &-enter-active,
  &-enter-active .ui-navigation-rail__modal {
    transition: transform g($t, 'modal.motion.enter.duration') g($t, 'modal.motion.enter.easing');
  }

  &-leave-active,
  &-leave-active .ui-navigation-rail__modal {
    transition: transform g($t, 'modal.motion.exit.duration') g($t, 'modal.motion.exit.easing');
  }
}

.ui-navigation-rail-modal-enter-from .ui-navigation-rail__modal,
.ui-navigation-rail-modal-leave-to .ui-navigation-rail__modal {
  transform: translateX(-100%);
}

.ui-navigation-rail-modal-enter-from .ui-navigation-rail__modal:dir(rtl),
.ui-navigation-rail-modal-leave-to .ui-navigation-rail__modal:dir(rtl) {
  transform: translateX(100%);
}
</style>
