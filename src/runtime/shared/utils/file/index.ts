export type FileRejectReason = 'type' | 'size' | 'count'

export interface FileRejection {
  file: File
  reasons: FileRejectReason[]
}
export interface FilePolicyOptions {
  accept?: string
  maxFiles?: number
  maxSize?: number
}

export interface FilePolicyResult {
  accepted: File[]
  rejected: FileRejection[]
}

function matchesAccept(file: File, accept?: string) {
  if (!accept?.trim()) return true

  return accept.split(',').some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1))
    return file.type.toLowerCase() === rule
  })
}

export function createFilePolicy(options: FilePolicyOptions = {}) {
  function evaluate(files: Iterable<File>): FilePolicyResult {
    const accepted: File[] = []
    const rejected: FileRejection[] = []

    for (const file of files) {
      const reasons: FileRejectReason[] = []

      if (!matchesAccept(file, options.accept)) reasons.push('type')
      if (options.maxSize !== undefined && file.size > options.maxSize) reasons.push('size')
      if (options.maxFiles !== undefined && accepted.length >= options.maxFiles) reasons.push('count')

      if (reasons.length > 0) rejected.push({ file, reasons })
      else accepted.push(file)
    }

    return { accepted, rejected }
  }

  return { evaluate }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

/**
 * Makes a native `<input type="file">` hold exactly `files`, so `required` and
 * a form submission see the files a field holds even when they came from its
 * model or a drop rather than from the picker. Call on the client only; where
 * `DataTransfer` cannot be constructed the input is left as it is.
 */
export function syncInputFiles(input: HTMLInputElement, files: readonly File[]) {
  const current = input.files ? [...input.files] : []
  if (current.length === files.length && current.every((file, index) => file === files[index])) return

  try {
    const transfer = new DataTransfer()
    for (const file of files) transfer.items.add(file)
    input.files = transfer.files
  } catch {
    // No DataTransfer constructor (Safari before 14.1): the picker's own
    // selection stays, as it did before the sync existed.
  }
}
