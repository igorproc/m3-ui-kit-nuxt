/**
 * @module logger
 *
 * @remarks
 * Minimal logger **shim** standing in for `@vuetify/v0`'s `useLogger`. The
 * registry chain only uses it for dev-time `warn()` diagnostics, so porting v0's
 * full logger (`createPlugin` + adapters + levels) would be dead weight here.
 * Non-error levels are gated behind `import.meta.dev`; `error` always logs.
 *
 * If richer logging is ever needed, swap this for the full v0 port without
 * touching call sites — the surface (`warn`/`error`/`info`/`debug`/`log`) matches.
 */
export interface Logger {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

const PREFIX = '[m3]'

const logger: Logger = {
  log: (...args) => {
    if (import.meta.dev) console.log(PREFIX, ...args)
  },
  info: (...args) => {
    if (import.meta.dev) console.info(PREFIX, ...args)
  },
  debug: (...args) => {
    if (import.meta.dev) console.debug(PREFIX, ...args)
  },
  warn: (...args) => {
    if (import.meta.dev) console.warn(PREFIX, ...args)
  },
  error: (...args) => {
    console.error(PREFIX, ...args)
  },
}

/**
 * Returns the shared logger instance.
 */
export function useLogger(): Logger {
  return logger
}
