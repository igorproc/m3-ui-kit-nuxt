import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useFileUploadQueue } from '#kit/composables/file-upload/useFileUploadQueue'
import MFileUpload from './index.vue'

const file = (name: string) => new File(['data'], name, { type: 'text/plain', lastModified: 1 })

describe('useFileUploadQueue', () => {
  it('renders one picker with default dropzone and empty list state', async () => {
    const wrapper = await mountSuspended(MFileUpload)
    expect(wrapper.findAll('input[type="file"]')).toHaveLength(1)
    expect(wrapper.find('.ui-file-upload__dropzone').exists()).toBe(true)
    expect(wrapper.find('.ui-file-upload__empty').exists()).toBe(true)
  })

  it('limits concurrency and schedules the next queued entry', async () => {
    const resolvers: Array<() => void> = []
    const upload = vi.fn(() => new Promise<string>(resolve => resolvers.push(() => resolve('ok'))))
    const scope = effectScope()
    const queue = scope.run(() => useFileUploadQueue({ upload, concurrency: () => 1 }))!
    queue.add([file('a.txt'), file('b.txt')])
    queue.start()
    expect(upload).toHaveBeenCalledTimes(1)
    resolvers.shift()?.()
    await Promise.resolve()
    await nextTick()
    expect(upload).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('clamps progress and aborts active work', async () => {
    let context: { signal: AbortSignal, reportProgress: (value: number) => void } | undefined
    const scope = effectScope()
    const queue = scope.run(() => useFileUploadQueue({
      upload: (_file, task) => {
        context = task
        return new Promise(() => {})
      },
      concurrency: () => 1,
    }))!
    const [entry] = queue.add([file('a.txt')])
    queue.start()
    context?.reportProgress(120)
    expect(entry?.progress).toBe(100)
    queue.cancel(entry!.id)
    expect(context?.signal.aborted).toBe(true)
    expect(entry?.status).toBe('cancelled')
    scope.stop()
  })
})
