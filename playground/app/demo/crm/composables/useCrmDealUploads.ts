import { effectScope, onScopeDispose } from 'vue'
import { useFileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import type { FileUploadQueue, FileUploadTaskContext } from '#kit/composables/file-upload/useFileUploadQueue'
import { useCrmDelay } from './useCrmDelay'

const SERVER_LIMIT = 5 * 1024 * 1024
const PROGRESS_STEPS = 5

/**
 * One upload queue per deal, owned by whoever calls this (the deal sheet), so a
 * file's status outlives the files tab: switching tabs mounts the uploader
 * again and it finds the uploads where they are instead of sending them twice.
 */
export function useCrmDealUploads() {
  const { wait } = useCrmDelay()
  const scope = effectScope()
  const queues = new Map<string, FileUploadQueue>()

  async function upload(dealId: string, file: File, { signal, reportProgress }: FileUploadTaskContext) {
    for (let step = 1; step <= PROGRESS_STEPS; step += 1) {
      await wait(250, signal)
      reportProgress((step / PROGRESS_STEPS) * 100)
    }

    if (file.size > SERVER_LIMIT) throw new Error('quota')
    return { id: `${dealId}-${file.name}` }
  }

  function queueFor(dealId: string): FileUploadQueue {
    let queue = queues.get(dealId)
    if (!queue) {
      queue = scope.run(() => useFileUploadQueue({ upload: (file, context) => upload(dealId, file, context), concurrency: () => 3 }))!
      queues.set(dealId, queue)
    }
    return queue
  }

  onScopeDispose(() => scope.stop())

  return { queueFor }
}
