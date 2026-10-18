/**
 * Public prop surface for `<MFileUpload>`.
 *
 * Every phrase the component shows or announces comes from `messages`: the kit
 * ships no copy it cannot translate. A missing phrase leaves its place empty
 * (and warns in dev where the place is a control's name), never English.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { FileUploadStatus, FileUploadTaskContext } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MFileRejectMessages } from '#kit/components/ui/file-input/props'
import { makeReadonlyProps, makeStateProps } from '#kit/shared/utils/props'

export interface MFileUploadMessages {
  /** Text in the dropzone. */
  drop?: string
  /** The dropzone's button. Without it the button is an icon named after `label`. */
  choose?: string
  /** Accessible name of the queue. */
  queue?: string
  /** Shown while the queue is empty. */
  empty?: string
  /** The action that starts every queued file. Without it only the per-file actions start uploads. */
  startAll?: string
  /** Status words after a file's size, also announced as each file changes state. */
  status?: Partial<Record<FileUploadStatus, string>>
  /** Why a file was refused, per reason; also said while a refused type is dragged over. */
  reject?: MFileRejectMessages
  /**
   * Why an upload failed, from whatever `upload` threw — a 413 is "too
   * large", a timeout "try again", a 403 "not allowed".
   */
  error?: (error: unknown) => string | undefined
  /** Names of the row actions. `{name}` is replaced with the file's name, so each is unique. */
  start?: string
  cancel?: string
  retry?: string
  remove?: string
}

export const mFileUploadProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  /** Names the whole control (a group): the dropzone, the queue and the messages. */
  label: { type: String, default: undefined },
  /** What is accepted ("PDF or PNG, up to 5 MB, 10 files") — shown in the dropzone and read with its button. */
  hint: { type: String, default: undefined },
  /** Marks the group required, with a decorative `*` by its label. */
  required: { type: Boolean, default: false },
  accept: { type: String, default: undefined },
  multiple: { type: Boolean, default: true },
  maxFiles: { type: Number, default: undefined },
  maxSize: { type: Number, default: undefined },
  upload: { type: Function as PropType<(file: File, context: FileUploadTaskContext) => Promise<unknown>>, default: undefined },
  /** Start uploading as soon as files arrive — the ones already in `v-model` included. */
  autoStart: { type: Boolean, default: false },
  concurrency: { type: Number, default: 3 },
  messages: { type: Object as PropType<MFileUploadMessages>, default: () => ({}) },
}

export type MFileUploadProps = ExtractPublicPropTypes<typeof mFileUploadProps>
