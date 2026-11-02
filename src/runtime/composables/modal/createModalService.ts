/**
 * @module modal/createModalService
 *
 * @remarks
 * The app-wide modal registry exposed as `useNuxtApp().$material.modal` —
 * the kit's counterpart of vue-final-modal's `$vfm`.
 *
 * - Every `<MOverlay>` in modal mode registers an entry, so any modal is
 *   addressable by its id (`open` / `close` / `toggle` / `closeAll` / `get`).
 * - `dynamicModals` holds the programmatic modals created by {@link useModal};
 *   the client-only host in `core/global-container.vue` renders them.
 *
 * The registry tracks membership only: an id joins `openedModals` when it starts
 * opening and leaves once fully closed. Lifecycle status and events stay with
 * the component, its handle and its parent modal.
 */
import { shallowReactive } from 'vue'
import type { Component, Slot } from 'vue'
import { openModalPreset } from './presets'
import type { ModalAlertOptions, ModalConfirmOptions } from './presets'
import { createModalHandle } from './createModalHandle'
import type { M3ModalContext, ModalOwner } from './useModalContext'
import type { ModalDismissReason, ModalResult } from './useModal'

export interface ModalRegistryEntry {
  id: string
  isOpen: () => boolean
  /** Resolves once the modal is open (or the open was stopped). */
  open: () => Promise<void>
  /** Resolves once the modal is closed (or the close was stopped). */
  close: () => Promise<void>
  /** The programmatic modal that rendered this surface; a registry close goes through it. */
  owner?: ModalOwner | null
}

export interface ModalSlotOptions {
  component: Component
  attrs?: Record<string, unknown>
}

/** A slot of a programmatic modal: text, a component, or a component with attrs. */
export type ModalSlot = string | Component | ModalSlotOptions

export interface ModalOpenOptions {
  /** Props and listeners bound on the component. */
  props?: Record<string, unknown>
  slots?: Record<string, ModalSlot>
  /** Modal to open inside: closing it closes this one with `parent-closed`. Root when omitted. */
  parent?: M3ModalContext | null
}

/** `open` by component (one-shot, resolves with the result) or by registry id. */
export interface ModalServiceOpen {
  <T = unknown>(component: Component, options?: ModalOpenOptions): Promise<ModalResult<T>>
  (id: string): Promise<void> | undefined
}

/** A programmatic modal while it is mounted by the host. */
export interface DynamicModal {
  id: string
  component: Component
  /** Props, listeners and `modelValue` bound on the component. */
  props: Record<string, unknown>
  slots: Record<string, Slot>
}

export interface ModalService {
  modals: ModalRegistryEntry[]
  openedModals: ModalRegistryEntry[]
  /** Opened modals that render a scrim. */
  openedModalOverlays: ModalRegistryEntry[]
  dynamicModals: DynamicModal[]
  get: (id: string) => ModalRegistryEntry | undefined
  /**
   * Opens a component as a one-shot modal and resolves with its result once it
   * has closed (then it is gone); with an id, opens a registered modal.
   */
  open: ModalServiceOpen
  close: (id: string) => Promise<void> | undefined
  toggle: (id: string, show?: boolean) => Promise<void> | undefined
  /** Closes the topmost open modal, `persistent` included; a programmatic one resolves cancelled with `reason`. */
  closeTop: (reason?: ModalDismissReason) => Promise<void>
  /**
   * Closes every open modal, `persistent` ones included: `persistent` guards
   * against a stray gesture, a programmatic close says what the app wants.
   */
  closeAll: (reason?: ModalDismissReason) => Promise<void>
  /** Asks a short question in an `alertdialog`; resolves `true` only when confirmed. */
  confirm: (options: ModalConfirmOptions) => Promise<boolean>
  /** Shows a notice with one button; resolves once it has closed. */
  alert: (options: ModalAlertOptions) => Promise<void>
  /**
   * A fresh id for a `useModal` handle, unique in this app.
   * @internal
   */
  nextHandleId: () => string
  /**
   * Registers a `<MOverlay>`; returns the unregister function.
   * @internal
   */
  register: (entry: ModalRegistryEntry) => () => void
  /**
   * Makes a `useModal` handle addressable by id without listing it twice.
   * @internal
   */
  registerHandle: (entry: ModalRegistryEntry) => () => void
  /** @internal */
  markOpened: (id: string, withOverlay: boolean) => void
  /** @internal */
  markClosed: (id: string) => void
}

function removeById<T extends { id: string }>(list: T[], id: string) {
  const index = list.findIndex(item => item.id === id)
  if (index !== -1) list.splice(index, 1)
}

export function createModalService(): ModalService {
  const modals = shallowReactive<ModalRegistryEntry[]>([])
  const openedModals = shallowReactive<ModalRegistryEntry[]>([])
  const openedModalOverlays = shallowReactive<ModalRegistryEntry[]>([])
  const dynamicModals = shallowReactive<DynamicModal[]>([])
  // A `useModal` handle renders a component whose own <MOverlay> is the listed
  // entry, so handles are reachable by id but kept out of `modals`.
  const handles = new Map<string, ModalRegistryEntry>()
  let handleCount = 0

  const get = (id: string) => modals.find(entry => entry.id === id) ?? handles.get(id)
  const isOpened = (id: string) => openedModals.some(entry => entry.id === id)

  function toggle(id: string, show?: boolean) {
    const entry = get(id)
    if (!entry) return undefined
    return (show ?? !entry.isOpen()) ? entry.open() : entry.close()
  }

  function register(entry: ModalRegistryEntry) {
    modals.push(entry)
    return () => {
      removeById(modals, entry.id)
      removeById(openedModals, entry.id)
      removeById(openedModalOverlays, entry.id)
    }
  }

  function markOpened(id: string, withOverlay: boolean) {
    const entry = get(id)
    if (!entry || isOpened(id)) return
    openedModals.push(entry)
    if (withOverlay) openedModalOverlays.push(entry)
  }

  function markClosed(id: string) {
    removeById(openedModals, id)
    removeById(openedModalOverlays, id)
  }

  const closeEntry = (entry: ModalRegistryEntry, reason: ModalDismissReason) =>
    entry.owner ? entry.owner.close(reason) : entry.close()

  function openComponent<T>(component: Component, options: ModalOpenOptions = {}): Promise<ModalResult<T>> {
    const handle = createModalHandle<Component, T>(service, { component, attrs: options.props, slots: options.slots }, options.parent ?? null)
    return handle.open().then((result) => {
      handle.destroy()
      return result
    })
  }

  const open = ((target: string | Component, options?: ModalOpenOptions) =>
    typeof target === 'string' ? get(target)?.open() : openComponent(target, options)) as ModalServiceOpen

  const service: ModalService = {
    modals,
    openedModals,
    openedModalOverlays,
    dynamicModals,
    get,
    open,
    close: id => get(id)?.close(),
    toggle,
    closeTop: async (reason = 'programmatic') => {
      const top = openedModals.findLast(entry => entry.isOpen())
      if (top) await closeEntry(top, reason)
    },
    closeAll: async (reason = 'programmatic') => {
      await Promise.all([...openedModals].map(entry => closeEntry(entry, reason)))
    },
    register,
    registerHandle: (entry) => {
      handles.set(entry.id, entry)
      return () => handles.delete(entry.id)
    },
    markOpened,
    markClosed,
    nextHandleId: () => `m3-modal-${++handleCount}`,
    confirm: options => openModalPreset(service, 'confirm', options),
    alert: options => openModalPreset(service, 'alert', options).then(() => undefined),
  }

  return service
}
