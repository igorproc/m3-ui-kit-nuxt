/**
 * Public prop surface for `<MBanner>` — a neutral contextual action surface
 * for page/section-level situations.
 *
 * The banner is deliberately severity-free: it is neither the inline
 * severity-oriented `MAlert` nor the transient `MSnackbar`. It stays in
 * document flow and owns no placement, sticky behavior, timer or queue.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'
import type { MVariant } from '#kit/shared/types/props'

/** Presentation of content and actions. `auto` switches on a CSS threshold. */
export type MBannerLayout = 'auto' | 'inline' | 'stacked'

/** Neutral surface presets. No accent container exists by design. */
export type MBannerVariant = Extract<MVariant, 'plain' | 'tonal'>

/** Live-region behavior. `off` suits permanent content already in SSR HTML. */
export type MBannerAnnounce = 'polite' | 'off'

export const mBannerProps = {
  /** Plain-text title; the `title` slot takes precedence. */
  title: { type: String, default: undefined },
  /** Plain-text body; the default slot takes precedence. */
  text: { type: String, default: undefined },
  /**
   * Leading icon. There is no default: the banner has no severity to infer one
   * from. `false` suppresses an icon supplied by a wrapper preset.
   */
  icon: { type: [String, Boolean] as PropType<MIconName | false>, default: undefined },
  /** Presentation of the actions row. */
  layout: { type: String as PropType<MBannerLayout>, default: 'auto' },
  /** Neutral surface preset: `plain` is the page's surface with a divider, `tonal` a tinted container. */
  variant: { type: String as PropType<MBannerVariant>, default: 'plain' },
  /** Renders the dismiss control. */
  closable: { type: Boolean, default: false },
  /**
   * Accessible name of the dismiss control. No default: copy the kit would
   * invent cannot be in the app's language.
   */
  closeLabel: { type: String, default: undefined },
  /** Announcement when the banner appears. */
  announce: { type: String as PropType<MBannerAnnounce>, default: 'polite' },
  /** Closing from inside moves focus to what follows the banner; `false` leaves it to the caller. */
  returnFocus: { type: Boolean, default: true },
}

export type MBannerProps = ExtractPublicPropTypes<typeof mBannerProps>

/** Payload of the `actions` slot. */
export interface MBannerActionsSlot {
  close: () => void
}

/** Payload of the whole-control `close` slot. */
export interface MBannerCloseSlot {
  close: () => void
  /** Kebab-case keys: the SSR renderer lowercases a camelCase attribute. */
  props: {
    'type': 'button'
    'class': string
    'aria-label': string | undefined
    'onClick': () => void
  }
}
