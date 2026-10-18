import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useFileUploadQueue } from './useFileUploadQueue'

const file = (name: string) => new File(['data'], name, { type: 'text/plain', lastModified: 1 })
const settle = async () => {
  await Promise.resolve()
  await nextTick()
}

/** A queue whose uploads wait until the test lets each one go. */
function createQueue(concurrency = 1) {
  const pending = new Map<string, () => void>()
  const upload = vi.fn((target: File) => new Promise<string>((resolve) => {
    pending.set(target.name, () => resolve('ok'))
  }))
  const scope = effectScope()
  const queue = scope.run(() => useFileUploadQueue({ upload, concurrency: () => concurrency }))!
  const status = () => Object.fromEntries(queue.entries.value.map(entry => [entry.file.name, entry.status]))
  const finish = async (name: string) => {
    pending.get(name)?.()
    await settle()
  }
  return { queue, upload, status, finish, stop: () => scope.stop() }
}

describe('useFileUploadQueue', () => {
  it('limits concurrency and schedules the next row asked to go', async () => {
    const { queue, upload, finish, stop } = createQueue()
    queue.add([file('a.txt'), file('b.txt')])
    queue.start()

    expect(upload).toHaveBeenCalledTimes(1)
    await finish('a.txt')
    expect(upload).toHaveBeenCalledTimes(2)
    stop()
  })

  it('clamps progress and aborts active work', () => {
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

  it('sends nothing that was only added', () => {
    const { queue, upload, stop } = createQueue()
    queue.add([file('a.txt'), file('b.txt')])

    expect(upload).not.toHaveBeenCalled()
    stop()
  })

  it('starts only the row it is asked to start', () => {
    const { queue, upload, status, stop } = createQueue(3)
    const [, second] = queue.add([file('a.txt'), file('b.txt'), file('c.txt')])
    queue.start(second!.id)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(status()).toEqual({ 'a.txt': 'queued', 'b.txt': 'uploading', 'c.txt': 'queued' })
    stop()
  })

  it('removing a row nobody started starts no other row', () => {
    const { queue, upload, status, stop } = createQueue()
    const [first] = queue.add([file('a.txt'), file('b.txt')])
    queue.remove(first!.id)

    expect(upload).not.toHaveBeenCalled()
    expect(status()).toEqual({ 'b.txt': 'queued' })
    stop()
  })

  it('cancelling a running upload frees its slot for the next row asked to go', async () => {
    const { queue, status, stop } = createQueue()
    const [first] = queue.add([file('a.txt'), file('b.txt'), file('c.txt')])
    queue.start(first!.id)
    queue.start(queue.entries.value[1]!.id)
    expect(status()).toEqual({ 'a.txt': 'uploading', 'b.txt': 'queued', 'c.txt': 'queued' })

    queue.cancel(first!.id)
    await settle()

    expect(status()).toEqual({ 'a.txt': 'cancelled', 'b.txt': 'uploading', 'c.txt': 'queued' })
    stop()
  })

  it('cancelling a waiting row frees no slot and starts nothing', () => {
    const { queue, upload, status, stop } = createQueue()
    const [first, second] = queue.add([file('a.txt'), file('b.txt'), file('c.txt')])
    queue.start(first!.id)
    queue.start(second!.id)

    queue.cancel(second!.id)

    expect(upload).toHaveBeenCalledTimes(1)
    expect(status()).toEqual({ 'a.txt': 'uploading', 'b.txt': 'cancelled', 'c.txt': 'queued' })
    stop()
  })

  it('a finished upload hands its slot to a row asked to go, never to one only added', async () => {
    const { queue, status, finish, stop } = createQueue()
    const [first, , third] = queue.add([file('a.txt'), file('b.txt'), file('c.txt')])
    queue.start(first!.id)
    queue.start(third!.id)

    await finish('a.txt')

    expect(status()).toEqual({ 'a.txt': 'success', 'b.txt': 'queued', 'c.txt': 'uploading' })
    stop()
  })

  it('retry asks the row to go again', () => {
    const { queue, upload, status, stop } = createQueue()
    const [first] = queue.add([file('a.txt'), file('b.txt')])
    queue.start(first!.id)
    queue.cancel(first!.id)

    queue.retry(first!.id)

    expect(upload).toHaveBeenCalledTimes(2)
    expect(status()).toEqual({ 'a.txt': 'uploading', 'b.txt': 'queued' })
    stop()
  })
})
