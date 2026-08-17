/**
 * @module globals
 *
 * @remarks
 * Environment constants for SSR-safe DOM access. `IN_BROWSER` is `true` only on
 * the client, mirroring `@vuetify/v0`'s constant so ported overlay/listener
 * primitives can short-circuit on the server.
 */

/** `true` when running in a browser (client), `false` during SSR. */
export const IN_BROWSER: boolean = import.meta.client
