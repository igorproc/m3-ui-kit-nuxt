<template>
  <aside
    class="m-layout-aside"
    :class="[
      `m-layout-aside--${side}`,
      { 'm-layout-aside--sticky': sticky },
    ]"
    v-bind="layoutItemAttrs"
    :style="layoutItemStyles"
  >
    <slot />
  </aside>
</template>

<script setup lang="ts">
// Боковая зона лейаута. Мульти-инстанс (auto-id), приоритет задаёт order или DOM:
// кто раньше — тот владеет углом. По умолчанию тянется с контентом,
// sticky прижимает к viewport с высотой 100dvh − insets
interface Props {
  /** Логические start/end предпочтительны; left/right — legacy-алиасы */
  position?: 'left' | 'right' | 'start' | 'end'
  sizeToken?: string
  /** Прижать к viewport (высота между прибитыми краями, скролл внутри) */
  sticky?: boolean
  order?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'start',
  sizeToken: undefined,
  sticky: false,
  order: undefined,
})

const side = computed<'start' | 'end'>(() => {
  if (props.position === 'left') return 'start'
  if (props.position === 'right') return 'end'
  return props.position
})

const { layoutItemStyles, layoutItemAttrs } = useLayoutItem({
  kind: side,
  sizeToken: computed(() => props.sizeToken),
  sticky: computed(() => props.sticky),
  order: computed(() => props.order),
})
</script>

<style lang="scss">
.m-layout-aside {
  min-height: 0;

  &--sticky {
    overflow-y: auto;
    z-index: z(aside);
  }
}
</style>
