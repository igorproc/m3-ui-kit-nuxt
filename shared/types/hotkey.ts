/**
 * @module types/hotkey
 *
 * @remarks
 * Public types shared by `useHotkey` (behavior + presentation) and `MHotkey`
 * (visual). Keeping them type-only means the visual component and the composable
 * build every label and matcher from one `HotkeyDefinition` — the rendered hint
 * can never drift from the registered combination.
 */
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

/** Modifier tokens. `mod` is the platform abstraction (⌘ on mac, Ctrl elsewhere). */
export type HotkeyModifier = 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'

/** Canonical named (non-character) keys. */
export type HotkeyNamedKey
  = 'enter'
    | 'escape'
    | 'space'
    | 'tab'
    | 'backspace'
    | 'delete'
    | 'arrow-up'
    | 'arrow-down'
    | 'arrow-left'
    | 'arrow-right'

/** A single key token: a modifier, a named key, or any character key. */
export type HotkeyKey = HotkeyModifier | HotkeyNamedKey | (string & {})

/** Target platform for resolution/presentation. */
export type HotkeyPlatform = 'auto' | 'mac' | 'windows' | 'linux'

/** Resolved (non-`auto`) platform. */
export type ResolvedHotkeyPlatform = Exclude<HotkeyPlatform, 'auto'>

/** A reactive combination definition. */
export interface HotkeyDefinition {
  keys: HotkeyKey[]
  platform?: HotkeyPlatform
}

/** One rendered key: canonical token + spoken label + glyph + modifier flag. */
export interface HotkeyDisplayKey {
  /** Canonical token (e.g. `mod`, `shift`, `enter`, `p`). */
  key: HotkeyKey
  /** Spoken label for accessibility (e.g. `Command`, `Shift`, `Enter`, `P`). */
  label: string
  /** Visual glyph (e.g. `⌘`, `⇧`, `↵`, `P`). */
  symbol: string
  isModifier: boolean
}

export interface UseHotkeyOptions {
  /** Reactive enable flag. @default true */
  enabled?: MaybeRefOrGetter<boolean>
  /** Reactive scope; an active overlay scope suppresses lower scopes. */
  scope?: MaybeRefOrGetter<string | undefined>
  /** Trigger event. @default 'keydown' */
  event?: 'keydown' | 'keyup'
  /** Allow firing while typing in inputs/textarea/contenteditable. @default false */
  inputs?: boolean
  /** Call `preventDefault` after a full match. @default true */
  preventDefault?: boolean
  /** Call `stopPropagation` after a full match. @default false */
  stopPropagation?: boolean
  /** Allow auto-repeat to fire. @default false */
  repeat?: boolean
  /** Require the modifier set to match exactly (no extras). @default true */
  exact?: boolean
}

/** Readonly presentation model shared with `MHotkey`. */
export interface HotkeyPresentation {
  keys: Readonly<ComputedRef<HotkeyKey[]>>
  displayKeys: Readonly<ComputedRef<HotkeyDisplayKey[]>>
  ariaLabel: Readonly<ComputedRef<string>>
  platform: Readonly<ComputedRef<ResolvedHotkeyPlatform>>
  /** Whether the shortcut is currently enabled (not disabled/paused). */
  isActive: Readonly<ComputedRef<boolean>>
  /** Definition keys currently held down. */
  pressedKeys: Readonly<Ref<HotkeyKey[]>>
}

/** Full `useHotkey` return: presentation + lifecycle controls. */
export interface UseHotkeyReturn extends HotkeyPresentation {
  /** Whether every definition key is currently held down. */
  isPressed: Readonly<ComputedRef<boolean>>
  isPaused: Readonly<Ref<boolean>>
  pause: () => void
  resume: () => void
  stop: () => void
}
