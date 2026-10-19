/**
 * Public prop surface for `<MFileUpload>`.
 *
 * Every phrase the component shows or announces comes from `messages`: the kit
 * ships no copy it cannot translate. A missing phrase leaves its place empty
 * (and warns in dev where the place is a control's name), never English.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { FileUploadEntry, FileUploadQueue, FileUploadStatus, FileUploadTaskContext } from '#kit/composables/file-upload/useFileUploadQueue'
import type { MFileRejectMessages } from '#kit/components/ui/file-input/props'
import type { FileRejection } from '#kit/shared/utils/file'
import { makeReadonlyProps } from '#kit/shared/utils/props'

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
  /**
   * How a file's size reads. The default writes the unit symbols `B`, `KB`,
   * `MB`, `GB` with a dot; pass a formatter for the app's locale.
   */
  size?: (bytes: number) => string
  /** Names of the row actions. `{name}` is replaced with the file's name, so each is unique. */
  start?: string
  cancel?: string
  retry?: string
  remove?: string
}

export const mFileUploadProps = {
  /** Takes no files and offers no action; the whole group recedes. */
  disabled: { type: Boolean, default: false },
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
  /**
   * A queue the app keeps (`useFileUploadQueue`), so a status outlives the
   * component: a tab or sheet that mounts it again shows the uploads where they
   * are instead of sending the files once more. With it, `upload` and
   * `concurrency` are the queue's own.
   */
  queue: { type: Object as PropType<FileUploadQueue>, default: undefined },
  /** Start uploading as soon as files arrive — the ones already in `v-model` included. */
  autoStart: { type: Boolean, default: false },
  concurrency: { type: Number, default: 3 },
  messages: { type: Object as PropType<MFileUploadMessages>, default: () => ({}) },
}

export type MFileUploadProps = ExtractPublicPropTypes<typeof mFileUploadProps>

/** Scope of `#item`: one row of the queue. The slot renders the row element (`li`) itself. */
export interface MFileUploadItemSlotProps {
  entry: FileUploadEntry
  start: () => void
  cancel: () => void
  retry: () => void
  remove: () => void
}

export interface MFileUploadSlots {
  /** Replaces the dropzone and its drag handling. */
  dropzone?: (props: { openPicker: () => void, addFiles: (files: readonly File[]) => void }) => unknown
  /** The text of the refusal line under the dropzone. */
  rejection?: (props: { rejection: FileRejection }) => unknown
  /** Replaces the whole queue. */
  list?: (props: { entries: readonly FileUploadEntry[] }) => unknown
  /** One row of the queue. */
  item?: (props: MFileUploadItemSlotProps) => unknown
  /** Shown while the queue is empty; outranks `messages.empty`. */
  empty?: () => unknown
  /** Replaces the start-all action. */
  actions?: (props: { start: (id?: string) => void, entries: readonly FileUploadEntry[] }) => unknown
}
