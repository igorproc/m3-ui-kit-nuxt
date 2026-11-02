import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { file, flush, messages, mount, pending, unmount } from './helpers'

afterEach(unmount)

describe('m-file-upload · variants', () => {
  describe('anatomy', () => {
    it('renders one picker, the dropzone, the refusal line, the queue and the status region', async () => {
      const wrapper = await mount({ label: 'Attachments', messages })

      expect(wrapper.findAll('input[type="file"]')).toHaveLength(1)
      expect(wrapper.find('.ui-file-upload__dropzone').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__rejection').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__list').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__status').exists()).toBe(true)
      expect(wrapper.find('.ui-file-input').exists()).toBe(false)
    })

    it('draws the label with a decorative asterisk when required', async () => {
      const wrapper = await mount({ label: 'Attachments', required: true })

      expect(wrapper.find('.ui-file-upload__label').text()).toContain('Attachments')
      expect(wrapper.find('.ui-file-upload__required').text()).toBe('*')
    })

    it('draws no label without one', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-file-upload__label').exists()).toBe(false)
    })

    it('ships no copy of its own', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find('.ui-file-upload__dropzone-text').exists()).toBe(false)
      expect(wrapper.find('.ui-file-upload__empty').exists()).toBe(false)
      expect(wrapper.find('.ui-file-upload__start').exists()).toBe(false)
    })
  })

  describe('dropzone', () => {
    it('shows the drop text and a text button from messages', async () => {
      const wrapper = await mount({ messages: { ...messages, drop: 'Drop files here' } })

      expect(wrapper.find('.ui-file-upload__dropzone-text').text()).toBe('Drop files here')
      expect(wrapper.find('.ui-file-upload__choose').text()).toBe('Choose files')
    })

    it('falls back to an icon button without a choose phrase', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find('.ui-file-upload__choose .ui-icon').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__choose').text()).toBe('')
    })

    it('shows the hint under the button', async () => {
      const wrapper = await mount({ hint: 'PDF, up to 5 MB' })

      expect(wrapper.find('.ui-file-upload__hint').text()).toBe('PDF, up to 5 MB')
    })

    it('recedes only when disabled: a read-only dropzone keeps its ink', async () => {
      const disabled = await mount({ disabled: true })
      expect(disabled.find('.ui-file-upload__dropzone').classes()).toContain('ui-file-upload__dropzone--disabled')

      const readonly = await mount({ readonly: true })
      expect(readonly.find('.ui-file-upload__dropzone').classes()).not.toContain('ui-file-upload__dropzone--disabled')
    })
  })

  describe('queue rows', () => {
    it.each([
      ['queued', {}],
      ['uploading', { upload: pending, autoStart: true }],
      ['success', { upload: () => Promise.resolve(), autoStart: true }],
      ['error', { upload: () => Promise.reject(new Error('500')), autoStart: true }],
    ] as const)('marks a %s row with its status modifier and status word', async (status, props) => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages, ...props })
      await flush()
      await flush()

      expect(wrapper.find('.ui-file-upload__item').classes()).toContain(`ui-file-upload__item--${status}`)
      expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain(messages.status[status])
    })

    it('marks a cancelled row', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages, upload: pending, autoStart: true })

      await wrapper.find('.ui-file-upload__action--cancel').trigger('click')
      await flush()

      expect(wrapper.find('.ui-file-upload__item').classes()).toContain('ui-file-upload__item--cancelled')
      expect(wrapper.find('.ui-file-upload__action--retry').exists()).toBe(true)
    })

    it('shows progress while uploading', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages, upload: pending, autoStart: true })

      expect(wrapper.find('.ui-file-upload__item-progress').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__action--cancel').exists()).toBe(true)
    })

    it('tells status in words and in a glyph, not only in colour', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages })

      expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain('Queued')
      expect(wrapper.find('.ui-file-upload__item-icon').exists()).toBe(true)
    })

    it('keeps the long name whole in its title and shortens only the stem', async () => {
      const name = 'a_very_long_file_name_that_will_not_fit_2026_10_07.pdf'
      const wrapper = await mount({ modelValue: [file(name)], messages })

      expect(wrapper.find('.ui-file-upload__item-name').attributes('title')).toBe(name)
      expect(wrapper.find('.ui-file-upload__item-extension').text()).toBe('.pdf')
    })

    it('offers start and remove on a queued row', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), messages })

      expect(wrapper.find('.ui-file-upload__action--start').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__action--remove').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__action--cancel').exists()).toBe(false)
      expect(wrapper.find('.ui-file-upload__action--retry').exists()).toBe(false)
    })

    it('gives every action the element class beside its modifier', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), messages })
      const actions = wrapper.findAll('.ui-file-upload__item-actions > *')

      expect(actions.length).toBe(2)
      for (const action of actions) {
        expect(action.classes()).toContain('ui-file-upload__action')
      }
    })

    it('formats sizes with the formatter of the app', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages: { ...messages, size: (bytes: number) => `${bytes} байт` } })

      expect(wrapper.find('.ui-file-upload__item-meta').text()).toContain('4 байт')
    })

    it('shows the empty phrase while the queue is empty', async () => {
      const wrapper = await mount({ messages: { ...messages, empty: 'Nothing yet' } })

      expect(wrapper.find('.ui-file-upload__empty').text()).toBe('Nothing yet')
      expect(wrapper.find('.ui-file-upload__list').classes()).toContain('ui-file-upload__list--empty')
    })
  })

  describe('start-all', () => {
    it('offers start-all from messages while rows remain', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => Promise.resolve(), messages: { ...messages, startAll: 'Start uploads' } })

      expect(wrapper.find('.ui-file-upload__start').text()).toBe('Start uploads')
    })

    it('does not offer start-all with auto-start', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], upload: () => new Promise(() => {}), autoStart: true, messages: { ...messages, startAll: 'Start uploads' } })

      expect(wrapper.find('.ui-file-upload__start').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('replaces the dropzone and hands it the picker', async () => {
      const wrapper = await mount({}, {
        slots: { dropzone: ({ openPicker }: { openPicker: () => void }) => h('button', { class: 'own-zone', onClick: openPicker }, 'Pick') },
      })

      expect(wrapper.find('.own-zone').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__dropzone').exists()).toBe(false)
    })

    it('renders one row per file through the item slot', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt'), file('b.txt')], messages }, {
        slots: { item: ({ entry }: { entry: { file: File } }) => h('li', { class: 'own-row' }, entry.file.name) },
      })

      expect(wrapper.findAll('.own-row').map(row => row.text())).toEqual(['a.txt', 'b.txt'])
    })

    it('replaces the whole queue with the list slot', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages }, {
        slots: { list: ({ entries }: { entries: readonly unknown[] }) => h('div', { class: 'own-list' }, String(entries.length)) },
      })

      expect(wrapper.find('.own-list').text()).toBe('1')
      expect(wrapper.find('.ui-file-upload__list').exists()).toBe(false)
    })

    it('shows the empty slot over the empty phrase', async () => {
      const wrapper = await mount({ messages: { ...messages, empty: 'Nothing yet' } }, { slots: { empty: () => h('p', { class: 'own-empty' }, 'Drop something') } })

      expect(wrapper.find('.own-empty').exists()).toBe(true)
      expect(wrapper.find('.ui-file-upload__empty').exists()).toBe(false)
    })

    it('replaces the start-all action with the actions slot', async () => {
      const wrapper = await mount({ modelValue: [file('a.txt')], messages }, {
        slots: { actions: ({ entries }: { entries: readonly unknown[] }) => h('button', { class: 'own-start' }, String(entries.length)) },
      })

      expect(wrapper.find('.own-start').text()).toBe('1')
    })
  })
})
