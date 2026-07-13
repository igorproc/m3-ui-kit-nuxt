import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '~~/shared/utils/props'

export type ConfirmEditPresentation = 'auto' | 'popover' | 'dialog'
export type DirtyCloseBehavior = 'confirm' | 'prevent' | 'discard'

export const mConfirmEditProps = {
  ...makeStateProps(),
  presentation: { type: String as PropType<ConfirmEditPresentation>, default: 'auto' },
  dirtyCloseBehavior: { type: String as PropType<DirtyCloseBehavior>, default: 'confirm' },
  clone: { type: Function as PropType<(value: unknown) => unknown>, default: undefined },
  compare: { type: Function as PropType<(draft: unknown, committed: unknown) => boolean>, default: undefined },
  save: { type: Function as PropType<(draft: unknown, committed: unknown) => unknown | Promise<unknown>>, default: undefined },
  title: { type: String, default: 'Edit' },
  saveText: { type: String, default: 'Save' },
  cancelText: { type: String, default: 'Cancel' },
  discardTitle: { type: String, default: 'Discard changes?' },
  discardText: { type: String, default: 'Unsaved changes will be lost.' },
}

export type MConfirmEditRuntimeProps = ExtractPublicPropTypes<typeof mConfirmEditProps>
