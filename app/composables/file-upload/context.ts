import type { ComputedRef, Ref } from 'vue'
import type { FileRejection } from '~~/shared/utils/file'
import type { FileUploadEntry } from './useFileUploadQueue'
import { createContext } from '~~/shared/utils/createContext'

export interface FileUploadContext<TResult = unknown> {
  entries: Readonly<Ref<readonly FileUploadEntry<TResult>[]>>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  accept: ComputedRef<string | undefined>
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
