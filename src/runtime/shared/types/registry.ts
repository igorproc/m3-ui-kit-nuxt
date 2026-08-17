/**
 * @module types/registry
 *
 * @remarks
 * Core types shared by the ported v0 registry chain (`createRegistry` →
 * `createModel` → `createSelection` → `createGroup`/`createSingle`).
 */

/** Stable identifier for a registry ticket. */
export type ID = string | number

/**
 * A string literal union that still accepts arbitrary strings, preserving
 * autocomplete for the known members. Ported from v0's `Extensible`.
 */
export type Extensible<T extends string> = T | (string & {})
