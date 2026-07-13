import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { FileUploadTaskContext } from '~/composables/file-upload/useFileUploadQueue'
import { makeReadonlyProps, makeStateProps } from '~~/shared/utils/props'

export const mFileUploadProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  accept: { type: String, default: undefined },
  multiple: { type: Boolean, default: true },
  maxFiles: { type: Number, default: undefined },
  maxSize: { type: Number, default: undefined },
  upload: { type: Function as PropType<(file: File, context: FileUploadTaskContext) => Promise<unknown>>, default: undefined },
  autoStart: { type: Boolean, default: false },
  concurrency: { type: Number, default: 3 },
}

export type MFileUploadProps = ExtractPublicPropTypes<typeof mFileUploadProps>
