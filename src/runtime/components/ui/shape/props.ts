import type { ExtractPublicPropTypes, PropType } from 'vue'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'
import type { M3ShapeName } from '#kit/assets/icon/shapes'
import type { MorphTransitionInput } from '#kit/utils/motion'

export const makeMShapeProps = propsFactory({
  /** Shape from the M3 Expressive library; a change morphs to it. */
  name: { type: String as PropType<M3ShapeName>, required: true as const },
  /** Ordered shapes this instance cycles through; their adjacent pairs are built once and shared. */
  sequence: { type: Array as PropType<readonly M3ShapeName[]>, default: undefined },
  /** How each morph moves: a transition name or partial options. */
  transition: { type: [String, Object] as PropType<MorphTransitionInput>, default: 'expressive' },
  /** Override of the transition's own duration, in milliseconds. */
  duration: { type: Number, default: undefined },
  /** Accessible name; when set the shape is announced as an image, otherwise it is hidden as decoration. */
  label: { type: String, default: undefined },
})

export const mShapeProps = makeMShapeProps()

export type MShapeProps = ExtractPublicPropTypes<typeof mShapeProps>
