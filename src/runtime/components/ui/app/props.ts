import type { ExtractPublicPropTypes, ShallowRef } from 'vue'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'

export interface MAppLoadingState {
  progress: number
  isLoading: boolean
}

export interface MAppSlots {
  default?: () => unknown
  loading?: (state: MAppLoadingState) => unknown
}

export interface MAppExposed {
  rootElement: Readonly<ShallowRef<HTMLElement | null>>
}

export const makeMAppProps = propsFactory({
  /** Root element tag; the boundary adds no landmark role of its own. */
  tag: { type: String, default: 'div' },
  /** Text of the "skip to content" link, the first Tab stop of the page; without it the link is not rendered. */
  skipLinkLabel: { type: String, default: undefined },
  /** Id of the element the skip link moves to, e.g. the page's `<main>`. */
  skipLinkTarget: { type: String, default: 'main' },
})

export const mAppProps = makeMAppProps()

export type MAppProps = ExtractPublicPropTypes<typeof mAppProps>
