import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { field, mount, native, unmount } from './helpers'

afterEach(unmount)

const text = (wrapper: Awaited<ReturnType<typeof mount>>) => (field(wrapper).element as HTMLInputElement).value

describe('m-file-input · variants', () => {
  describe('field axes', () => {
    it('is a read-only text field over one native file input', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-text-field').exists()).toBe(true)
      expect(field(wrapper).attributes('readonly')).toBeDefined()
      expect(native(wrapper).exists()).toBe(true)
    })

    it.each(['filled', 'outlined', 'underline'] as const)('carries the %s variant', async (variant) => {
      const wrapper = await mount({ variant })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--${variant}`)
    })

    it.each(['compact', 'default', 'comfortable'] as const)('carries the %s density', async (density) => {
      const wrapper = await mount({ density })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--density-${density}`)
    })

    it.each(['none', 'extra-small', 'medium', 'large', 'full'] as const)('carries the %s shape', async (shape) => {
      const wrapper = await mount({ shape })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--shape-${shape}`)
    })

    it.each(['top', 'float', 'inset', 'hidden'] as const)('carries the %s label placement', async (labelPlacement) => {
      const wrapper = await mount({ label: 'Attachments', labelPlacement })

      expect(wrapper.find('.ui-text-field').classes()).toContain(`ui-text-field--label-${labelPlacement}`)
    })

    it('forwards required to the visible field and to the native input', async () => {
      const wrapper = await mount({ label: 'Attachments', required: true })

      expect(field(wrapper).attributes('aria-required')).toBe('true')
      expect(native(wrapper).attributes('required')).toBeDefined()
    })
  })

  describe('native input', () => {
    it('carries accept, multiple and the form name', async () => {
      const wrapper = await mount({ accept: 'image/*', multiple: true, name: 'photos' })

      expect(native(wrapper).attributes()).toMatchObject({ accept: 'image/*', name: 'photos' })
      expect(native(wrapper).attributes('multiple')).toBeDefined()
    })

    it('falls back to the adapter path for the form name', async () => {
      const wrapper = await mount({ path: 'photos' })

      expect(native(wrapper).attributes('name')).toBe('photos')
    })

    it.each([
      [true, ''],
      ['user', 'user'],
      ['environment', 'environment'],
    ] as const)('writes capture=%s as the attribute %j', async (capture, attribute) => {
      const wrapper = await mount({ capture })

      expect(native(wrapper).attributes('capture')).toBe(attribute)
    })

    it('leaves capture off by default', async () => {
      const wrapper = await mount()

      expect(native(wrapper).attributes('capture')).toBeUndefined()
    })
  })

  describe('summary', () => {
    it('shows the name of a single file', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt') })

      expect(text(wrapper)).toBe('a.txt')
    })

    it('lists a few files by name', async () => {
      const wrapper = await mount({ multiple: true, modelValue: [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')] })

      expect(text(wrapper)).toBe('a.txt, b.txt')
    })

    it('summarises a long selection with names and a count, no phrase', async () => {
      const files = ['a', 'b', 'c', 'd', 'e'].map(name => new File([name], `${name}.txt`))
      const wrapper = await mount({ multiple: true, modelValue: files })

      expect(text(wrapper)).toBe('a.txt, b.txt, c.txt +2')
    })

    it('adds the size with showSize, in the default unit symbols', async () => {
      const wrapper = await mount({ showSize: true, modelValue: new File(['abc'], 'a.txt') })

      expect(text(wrapper)).toBe('a.txt (3 B)')
    })

    it('formats the size with the formatter of the app', async () => {
      const wrapper = await mount({ showSize: true, modelValue: new File(['abc'], 'a.txt'), formatSize: (bytes: number) => `${bytes} байт` })

      expect(text(wrapper)).toBe('a.txt (3 байт)')
    })

    it('is empty with nothing chosen', async () => {
      const wrapper = await mount()

      expect(text(wrapper)).toBe('')
    })
  })

  describe('actions', () => {
    it('shows a text browse button with a browse label', async () => {
      const wrapper = await mount({ browseLabel: 'Browse' })

      expect(wrapper.find('.ui-file-input__actions button').text()).toBe('Browse')
    })

    it('falls back to an icon button without a browse label', async () => {
      const wrapper = await mount({ label: 'Attachments' })

      expect(wrapper.find('.ui-file-input__actions button .ui-icon').exists()).toBe(true)
    })

    it('shows the clear button only with files and while clearable', async () => {
      const empty = await mount({ clearLabel: 'Remove' })
      expect(empty.find('[aria-label="Remove"]').exists()).toBe(false)

      const chosen = await mount({ clearLabel: 'Remove', modelValue: new File(['a'], 'a.txt') })
      expect(chosen.find('[aria-label="Remove"]').exists()).toBe(true)

      const fixed = await mount({ clearLabel: 'Remove', clearable: false, modelValue: new File(['a'], 'a.txt') })
      expect(fixed.find('[aria-label="Remove"]').exists()).toBe(false)
    })

    it.each(['disabled', 'readonly'] as const)('marks the root inert while %s', async (state) => {
      const wrapper = await mount({ [state]: true })

      expect(wrapper.classes()).toContain('ui-file-input--inert')
    })

    it('carries no inert modifier at rest', async () => {
      const wrapper = await mount()

      expect(wrapper.classes()).not.toContain('ui-file-input--inert')
    })
  })

  describe('slots', () => {
    it('replaces both buttons with the actions slot', async () => {
      const wrapper = await mount({}, {
        slots: { actions: ({ disabled }: { disabled: boolean }) => h('button', { class: 'own', disabled }, 'Pick') },
      })

      expect(wrapper.find('.ui-file-input__actions .own').exists()).toBe(true)
      expect(wrapper.findAll('.ui-file-input__actions button')).toHaveLength(1)
    })

    it('hands the button props to the browse slot', async () => {
      const wrapper = await mount({ label: 'Attachments' }, {
        slots: { browse: ({ props }: { props: Record<string, unknown> }) => h('button', { ...props, class: 'own-browse' }, 'Pick') },
      })

      expect(wrapper.find('.own-browse').attributes('type')).toBe('button')
      expect(wrapper.find('.own-browse').attributes('aria-describedby')).toBeTruthy()
    })

    it('hands the clear props to the clear slot', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt'), clearLabel: 'Remove' }, {
        slots: { clear: ({ props }: { props: { ariaLabel?: string } }) => h('button', { 'class': 'own-clear', 'aria-label': props.ariaLabel }, 'x') },
      })

      expect(wrapper.find('.own-clear').attributes('aria-label')).toBe('Remove')
    })

    it('renders the selection slot under the field with the files and their summary', async () => {
      const wrapper = await mount({ modelValue: new File(['a'], 'a.txt') }, {
        slots: { selection: ({ files, text }: { files: File[], text: string }) => `${files.length}:${text}` },
      })

      expect(wrapper.find('.ui-file-input__selection').text()).toBe('1:a.txt')
    })

    it('forwards the prepend slot', async () => {
      const wrapper = await mount({}, { slots: { prepend: () => h('i', { class: 'own' }) } })

      expect(wrapper.find('.ui-text-field__icon--prepend .own').exists()).toBe(true)
    })
  })

  describe('support line', () => {
    it('reserves no line until an error can reach it', async () => {
      const wrapper = await mount()

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(false)
    })

    it.each([
      ['a bound error message', { errorMessage: undefined }],
      ['an adapter path', { path: 'files' }],
    ])('reserves the line for %s', async (_, props) => {
      const wrapper = await mount(props)

      expect(wrapper.find('.ui-text-field__support').exists()).toBe(true)
    })
  })
})
