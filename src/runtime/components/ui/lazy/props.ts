import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MLazyMode = 'eager' | 'on-idle' | 'on-view' | 'on-interaction'
export type MLazyInteraction = 'pointerenter' | 'pointerdown' | 'click' | 'focus'

export const mLazyProps = {
  mode: { type: String as PropType<MLazyMode>, default: 'on-view' },
  once: { type: Boolean, default: true },
  timeout: { type: Number, default: 2000 },
  rootMargin: { type: String, default: '200px 0px' },
  threshold: {
    type: [Number, Array] as PropType<number | number[]>,
    default: 0,
  },
  interactions: {
    type: Array as PropType<MLazyInteraction[]>,
    default: () => ['pointerenter', 'focus', 'click'],
  },
  minWidth: { type: [String, Number], default: undefined },
  minHeight: { type: [String, Number], default: undefined },
  transition: { type: [String, Boolean], default: 'ui-lazy' },
  disabled: { type: Boolean, default: false },
}

export type MLazyProps = ExtractPublicPropTypes<typeof mLazyProps>
