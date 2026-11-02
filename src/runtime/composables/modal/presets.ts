/**
 * @module modal/presets
 *
 * @remarks
 * `$material.modal.confirm()` and `.alert()`: a short question or notice in an
 * `alertdialog`, without a template. Every label is the caller's — the kit
 * ships no English copy. A destructive confirmation takes `color: 'error'`
 * and still says what it does in its label, not by colour alone.
 */
import { defineAsyncComponent, shallowReactive } from 'vue'
import type { MColor } from '#kit/shared/types/props'
import type { DynamicModal } from './createModalService'

export interface ModalConfirmOptions {
  title: string
  text?: string
  confirmLabel: string
  cancelLabel: string
  /** `error` for a destructive action. */
  color?: Extract<MColor, 'error'>
  /** Blocks Escape and the scrim: only the buttons answer. */
  persistent?: boolean
  /** Runs on confirm; while its promise is pending the button is busy, a rejection keeps the dialog open. */
  onConfirm?: () => unknown
}

export interface ModalAlertOptions {
  title: string
  text?: string
  confirmLabel: string
  persistent?: boolean
}

export interface ModalPresetHost {
  dynamicModals: DynamicModal[]
  nextHandleId: () => string
}

// Loaded on first use: the plugin that owns the service runs on every page.
const ModalPreset = defineAsyncComponent(() => import('#kit/components/fragments/modal-preset/index.vue'))

/** Opens a preset dialog; resolves once it has fully closed, `true` only when confirmed. */
export function openModalPreset(host: ModalPresetHost, kind: 'confirm' | 'alert', options: ModalConfirmOptions | ModalAlertOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let accepted = false

    const record = shallowReactive<DynamicModal>({
      id: host.nextHandleId(),
      component: ModalPreset,
      props: {},
      slots: {},
    })

    const render = (open: boolean) => {
      record.props = {
        ...options,
        kind,
        'modelValue': open,
        'onUpdate:modelValue': (value: boolean) => render(value),
        'onAnswer': (value: boolean) => {
          accepted = value
        },
        'onClosed': () => {
          const index = host.dynamicModals.indexOf(record)
          if (index !== -1) host.dynamicModals.splice(index, 1)
          resolve(accepted)
        },
      }
    }

    render(true)
    host.dynamicModals.push(record)
  })
}
