<template>
  <MOverlay
    :id="dialogId"
    ref="overlay"
    v-model="modelValue"
    v-bind="layerProps"
    mode="modal"
    :content-transition="contentTransition ?? `ui-navigation-drawer-slide-${side}`"
    :content-class="['ui-navigation-drawer', `ui-navigation-drawer--${side}`, containerClass, contentClass]"
    :aria-labelledby="$slots.header ? headerId : undefined"
    @before-open="emit('beforeOpen', $event)"
    @before-close="emit('beforeClose', $event)"
    @opened="emit('opened')"
    @closed="emit('closed')"
    @click-outside="emit('clickOutside')"
  >
    <template
      v-if="$slots.activator"
      #activator="activator"
    >
      <slot
        name="activator"
        v-bind="activator"
        :props="{ ...activator.props, 'aria-controls': dialogId }"
      />
    </template>

    <div class="ui-navigation-drawer__surface">
      <header
        v-if="$slots.header"
        :id="headerId"
        class="ui-navigation-drawer__header"
      >
        <slot name="header" />
      </header>

      <div class="ui-navigation-drawer__content">
        <nav
          v-if="items.length"
          class="ui-navigation-drawer__nav"
        >
          <template
            v-for="(group, index) in groups"
            :key="group.key"
          >
            <MDivider
              v-if="index > 0"
              class="ui-navigation-drawer__divider"
            />

            <div
              class="ui-navigation-drawer__group"
              :role="group.section ? 'group' : undefined"
              :aria-labelledby="group.section ? `${headerId}-${group.key}` : undefined"
            >
              <span
                v-if="group.section"
                :id="`${headerId}-${group.key}`"
                class="ui-navigation-drawer__section"
              >
                {{ group.section }}
              </span>

              <NavigationItem
                v-for="item in group.items"
                :key="item.id"
                host="drawer"
                placement="start"
                :label="item.label"
                :icon="item.icon"
                :active-icon="item.activeIcon"
                :badge="item.badge"
                :badge-label="item.badgeLabel"
                :disabled="item.disabled"
                :active="item.id === selectedValue"
                @select="onSelect(item.id, $event)"
              />
            </div>
          </template>
        </nav>

        <slot />
      </div>
    </div>
  </MOverlay>
</template>

<script setup lang="ts">
import { computed, useAttrs, useId, useTemplateRef } from 'vue'
import MOverlay from '#kit/components/ui/overlay/index.vue'
import MDivider from '#kit/components/ui/divider/index.vue'
import NavigationItem from '#kit/components/fragments/navigation-item/index.vue'
import { pickModalLayerProps } from '#kit/components/ui/overlay/props'
import { useNavigationModel } from '#kit/utils/navigation/useNavigationModel'
import { mNavigationDrawerProps } from './props'
import type { MNavigationDrawerEmits, MNavigationDrawerItem, MNavigationDrawerSlots } from './props'

const props = defineProps(mNavigationDrawerProps)
const emit = defineEmits<MNavigationDrawerEmits>()
defineSlots<MNavigationDrawerSlots>()

const modelValue = defineModel<boolean>({ default: false })
/** Id of the current destination. */
const current = defineModel<string | null>('current', { default: null })

const { selectedValue, select } = useNavigationModel(() => props.items, current)

interface Group { key: number, section?: string, items: MNavigationDrawerItem[] }

// Consecutive destinations of one section share a heading.
const groups = computed(() => props.items.reduce<Group[]>((list, item) => {
  const last = list.at(-1)
  if (last && last.section === item.section) last.items.push(item)
  else list.push({ key: list.length, section: item.section, items: [item] })
  return list
}, []))

function onSelect(id: string, event: MouseEvent) {
  select(id)
  emit('select', id, event)
}

// The native <dialog> root is the accessible dialog; the header slot names it,
// or the consumer's `aria-label`, which falls through to it.
const headerId = useId()
const layerProps = computed(() => pickModalLayerProps(props))
const overlay = useTemplateRef<InstanceType<typeof MOverlay>>('overlay')

// The trigger's `aria-controls` names the <dialog>; an `id` the consumer set on
// the drawer reaches that element too, so it wins over the generated one.
const attrs = useAttrs()
const generatedId = useId()
const dialogId = computed(() => (typeof attrs.id === 'string' ? attrs.id : generatedId))

const id = computed(() => overlay.value?.id)
const close = () => overlay.value?.close() ?? Promise.resolve()

defineExpose({ id, close })
</script>

<style lang="scss">
@use '#kit/assets/stylesheet/components/navigation-drawer/index' as t;

$t: material-map(t.$tokens, 'md-navigation-drawer');

.ui-navigation-drawer {
  &__surface {
    // A flex child of the <MOverlay> panel: full height, pinned to its side.
    align-self: stretch;
    margin-inline-end: auto;
    display: flex;
    flex-direction: column;
    gap: g($t, 'surface.gap');
    width: g($t, 'surface.width');
    min-width: g($t, 'surface.min.width');
    max-width: g($t, 'surface.max.width');
    height: 100%;
    padding: g($t, 'surface.padding');
    padding-block: g($t, 'surface.safe-area.top') g($t, 'surface.safe-area.bottom');
    background-color: g($t, 'surface.color');
    color: g($t, 'surface.text.color');
    box-shadow: g($t, 'surface.shadow');

    @include forced-colors {
      border: 1px solid CanvasText;
    }
  }

  &__header {
    padding: g($t, 'header.padding.block.start') g($t, 'header.padding.inline') g($t, 'header.padding.block.end');

    @include typescale(g($t, 'header.typography'));
  }

  // The header stays put; a long list scrolls under it without moving the page.
  &__content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &__nav,
  &__group {
    display: flex;
    flex-direction: column;
  }

  &__section {
    display: flex;
    align-items: center;
    min-height: g($t, 'section.min.height');
    padding-inline: g($t, 'section.padding');
    color: g($t, 'section.color');

    @include typescale(g($t, 'section.typography'));
  }

  &__divider {
    margin-inline: g($t, 'divider.margin.inline');
  }
}

// The edge that meets the window keeps clear of its cutout: the left one in
// LTR for a start drawer, the right one in RTL.
.ui-navigation-drawer--start {
  .ui-navigation-drawer__surface {
    padding-inline-start: g($t, 'surface.safe-area.left');
    border-start-end-radius: g($t, 'surface.shape');
    border-end-end-radius: g($t, 'surface.shape');
  }

  .ui-navigation-drawer__surface:dir(rtl) {
    padding-inline-start: g($t, 'surface.safe-area.right');
  }
}

.ui-navigation-drawer--end {
  .ui-navigation-drawer__surface {
    margin-inline: auto 0;
    padding-inline-end: g($t, 'surface.safe-area.right');
    border-start-start-radius: g($t, 'surface.shape');
    border-end-start-radius: g($t, 'surface.shape');
  }

  .ui-navigation-drawer__surface:dir(rtl) {
    padding-inline-end: g($t, 'surface.safe-area.left');
  }
}

// Slide in from the drawer's own edge; the scrim fades separately. The panel
// carries the same timing (Vue reads it to know when the phase ends) while the
// surface moves by its own width. Reduced motion needs no rule of its own: the
// duration tokens shorten under it, and the slide stays a slide.
// The panel is MOverlay's element: its own `.ui-overlay__panel` transition wins
// over a lone transition class whenever the overlay sheet loads later (a prod
// build), so on the panel the drawer's own class doubles the selector.
.ui-navigation-drawer.ui-navigation-drawer-slide-start-enter-active,
.ui-navigation-drawer.ui-navigation-drawer-slide-end-enter-active,
.ui-navigation-drawer-slide-start-enter-active .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-end-enter-active .ui-navigation-drawer__surface {
  transition: transform g($t, 'motion.enter.duration') g($t, 'motion.enter.easing');
}

.ui-navigation-drawer.ui-navigation-drawer-slide-start-leave-active,
.ui-navigation-drawer.ui-navigation-drawer-slide-end-leave-active,
.ui-navigation-drawer-slide-start-leave-active .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-end-leave-active .ui-navigation-drawer__surface {
  transition: transform g($t, 'motion.exit.duration') g($t, 'motion.exit.easing');
}

// The edges are logical: in RTL the start edge is on the right, so the
// direction of travel flips with it.
.ui-navigation-drawer-slide-start-enter-from .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-start-leave-to .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-end-enter-from .ui-navigation-drawer__surface:dir(rtl),
.ui-navigation-drawer-slide-end-leave-to .ui-navigation-drawer__surface:dir(rtl) {
  transform: translateX(-100%);
}

.ui-navigation-drawer-slide-end-enter-from .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-end-leave-to .ui-navigation-drawer__surface,
.ui-navigation-drawer-slide-start-enter-from .ui-navigation-drawer__surface:dir(rtl),
.ui-navigation-drawer-slide-start-leave-to .ui-navigation-drawer__surface:dir(rtl) {
  transform: translateX(100%);
}
</style>
