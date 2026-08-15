/**
 * @module useAppBar
 *
 * @remarks
 * Context pair for the compound `<MAppBar>` family. The container owns the
 * resolved size/alignment and provides them so leaf children (`<MAppBarNav>`,
 * `<MAppBarTitle>`, `<MAppBarActions>`) can style themselves without the
 * container computing any layout — the god `dynamicGridStyles` is gone, each
 * child self-places via its own `grid-area`. Namespace: `m3:app-bar`.
 *
 * `registerSubtitle` lets a composed `<MAppBarTitle>` report subtitle presence
 * back up, so the container can pick the taller MD3 height variant even when the
 * title lives in a child rather than the container's `subtitle` prop.
 */
import { createContext } from '~~/shared/utils/createContext'
import type { Ref } from 'vue'

/** MD3 Expressive size taxonomy (alignment is a separate axis, see `AppBarAlign`). */
export type AppBarSize = 'small' | 'medium' | 'large'

/** Headline alignment axis, orthogonal to size (MD3 Expressive, May 2025). */
export type AppBarAlign = 'start' | 'center'

export interface AppBarContext {
  /** Resolved size (the deprecated `center-aligned` alias is normalized away). */
  type: Readonly<Ref<AppBarSize>>
  /** Resolved headline alignment. */
  align: Readonly<Ref<AppBarAlign>>
  /**
   * Report subtitle presence up to the container; returns a dispose fn. The
   * container ORs all registrations with its own `subtitle` prop to decide the
   * height variant.
   */
  registerSubtitle: (present: Ref<boolean>) => () => void
}

export const [useAppBarContext, provideAppBarContext] = createContext<AppBarContext>('m3:app-bar')
