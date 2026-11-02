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
 * `registerTitle` reports the title text the same way, for the copy a
 * collapsing bar shows in its top row once folded.
 */
import { createContext } from '#kit/shared/utils/context/createContext'
import type { MHeadingLevel } from '#kit/shared/types/props'
import type { Ref } from 'vue'

/** MD3 Expressive size taxonomy (alignment is a separate axis, see `AppBarAlign`). */
export type AppBarSize = 'small' | 'medium' | 'large'

/** Headline alignment axis, orthogonal to size (MD3 Expressive, May 2025). */
export type AppBarAlign = 'start' | 'center'

/** The headline usually names the whole screen, so unlike a card title it may be the page's `h1`. */
export type AppBarHeadingLevel = 1 | MHeadingLevel

/** Root element: the page header, a plain box, or a section of its own. */
export type AppBarTag = 'header' | 'div' | 'section'

/**
 * What the bar does as the page scrolls: `pinned` keeps its size, `collapse`
 * folds a medium or large bar into the small height (M3 exit-until-collapsed).
 */
export type AppBarScrollBehavior = 'pinned' | 'collapse'

export interface AppBarContext {
  /** MD3 size. */
  type: Readonly<Ref<AppBarSize>>
  /** Resolved headline alignment. */
  align: Readonly<Ref<AppBarAlign>>
  /** Heading level of the bar, inherited by a title that names none. */
  headingLevel: Readonly<Ref<AppBarHeadingLevel | undefined>>
  /** The headline wraps to two lines; otherwise it keeps one line and cuts with an ellipsis. */
  wraps: Readonly<Ref<boolean>>
  /**
   * Report subtitle presence up to the container; returns a dispose fn. The
   * container ORs all registrations with its own `subtitle` prop to decide the
   * height variant.
   */
  registerSubtitle: (present: Ref<boolean>) => () => void
  /** Report the title text up for the folded copy; returns a dispose fn. */
  registerTitle: (text: Ref<string>) => () => void
}

export const [useAppBarContext, provideAppBarContext] = createContext<AppBarContext>('m3:app-bar')
