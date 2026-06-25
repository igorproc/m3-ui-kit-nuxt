/**
 * Public prop surface for `<MAppBar>`.
 *
 * The legacy `variant` (`center-aligned | small | medium | large`) is a *size*
 * taxonomy, not the MD3 surface style (`elevated | filled | …`). Per the prop
 * unification spec it is renamed to `type` to avoid colliding with the shared
 * `variant` contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MAppBarType = 'center-aligned' | 'small' | 'medium' | 'large'

export const mAppBarProps = {
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  type: { type: String as PropType<MAppBarType>, default: 'center-aligned' },
  /** Прибить к верху, когда app-bar — прямой ребёнок m-layout */
  sticky: { type: Boolean, default: true },
  /** @deprecated принудительный override — elevate теперь автоматический (по скроллу лейаута) */
  isScrolled: { type: Boolean, default: false },
}

export type MAppBarProps = ExtractPublicPropTypes<typeof mAppBarProps>
