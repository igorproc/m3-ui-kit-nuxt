import type { ComputedRef, Ref } from 'vue'
import type { FileRejection } from '#kit/shared/utils/file'
import type { MFileUploadMessages } from '#kit/components/ui/file-upload/props'
import type { FileUploadEntry } from './useFileUploadQueue'
import { createContext } from '#kit/shared/utils/context/createContext'

export interface FileUploadContext<TResult = unknown> {
  entries: Readonly<Ref<readonly FileUploadEntry<TResult>[]>>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  accept: ComputedRef<string | undefined>
  /** The group's name, the fallback name of an icon-only dropzone button. */
  label: ComputedRef<string | undefined>
  /** Id of the element holding `hint`, when there is one. */
  hintId: ComputedRef<string | undefined>
  hint: ComputedRef<string | undefined>
  messages: ComputedRef<MFileUploadMessages>
  addFiles: (files: readonly File[], source: 'picker' | 'drop') => void
  openPicker: () => void
  start: (id?: string) => void
  cancel: (id: string) => void
  retry: (id: string) => void
  remove: (id: string) => void
  reject: (rejection: FileRejection) => void
}

export const [useFileUploadContext, provideFileUploadContext]
  = createContext<FileUploadContext>('m3:file-upload')
