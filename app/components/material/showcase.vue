<template>
  <section class="demo-material__showcase">
    <h2 class="demo-material__section-title">
      Component Showcase
    </h2>

    <div
      v-for="section in sections"
      :key="section.title"
      class="demo-material__showcase-item"
    >
      <h3 class="demo-material__showcase-subtitle">
        {{ section.title }}
      </h3>

      <div class="demo-material__variants">
        <div
          v-for="(variant, idx) in section.variants"
          :key="idx"
          class="demo-material__preview-container"
          :class="`demo-material__preview-container--${section.id}`"
        >
          <div class="demo-material__preview-content">
            <component :is="variant.render" />
          </div>
          <span class="demo-material__preview-label">{{ variant.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { h, resolveComponent, reactive, computed } from 'vue'
import { ICONS } from '~~/shared/constants/icons'

// -----------------------------------------------------------------------------
// State for Interactive Components
// -----------------------------------------------------------------------------
const state = reactive({
  sliderValContinuous: 50,
  sliderValDiscrete: 20,
  sliderValRange: [20, 80],
  sliderValVertical: 40,
  sliderValVerticalDiscrete: 30,
  sliderValVerticalRange: [25, 75],
  dropdownValFilled: 'option1',
  dropdownValOutlined: 'option2',
  dropdownValMultiple: ['option1', 'option3'],
  showDialog: false,
  showSheet: false,
  showSnackbar: false,
  showMenu: false,
  textFieldVal: '',
  searchVal: '',
  searchValFilled: 'Wireless headphones',
  checkboxVal: true,
  checkboxUnchecked: false,
  switchVal: true,
  switchOff: false,
  radioVal: 'a',
  segmentedVal: ['map'],
  dateVal: null,
  dateValConstrained: null,
  timeVal: null,
  timeVal12h: null,
  expansionVal: 0,
  tabsVal: 'tab1',
})

const dropdownOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

const fabItems = [
  { label: 'Share', icon: ICONS.info },
  { label: 'Settings', icon: ICONS.settings },
  { label: 'Delete', icon: ICONS.close },
]

// Fixed bounds for the constrained date-picker demo (captured once at setup —
// `useDatePicker` reads min/max non-reactively).
const dateMin = new Date('2002-01-01')
const dateMax = new Date()

// -----------------------------------------------------------------------------
// Render Helpers
// -----------------------------------------------------------------------------
const hIcon = (name: string, style?: string) => {
  return h(resolveComponent('m-icon'), { name, style })
}

const hBtn = (label: string, variant: string = 'filled', iconName?: string) => {
  const slots: any = { default: () => label }
  if (iconName) slots.prepend = () => hIcon(iconName)
  return h(resolveComponent('m-button'), { variant }, slots)
}

// Activator button that flips an overlay's open state on click. The previous
// demos rendered a plain `hBtn` with NO click handler, so the dialog/sheet/
// snackbar never actually opened — this wires the `onClick` they were missing.
type OverlayKey = 'showDialog' | 'showSheet' | 'showSnackbar'
const hActivator = (label: string, key: OverlayKey, variant: string = 'filled', iconName?: string) => {
  const slots: any = { default: () => label }
  if (iconName) slots.prepend = () => hIcon(iconName)
  return h(resolveComponent('m-button'), { variant, onClick: () => (state[key] = true) }, slots)
}

// Render an M3 shape sized + tinted via its wrapper (shape inherits currentColor).
const hShape = (name: string, color: string = 'var(--md-sys-color-primary)') =>
  h('div', { style: `width: 72rem; height: 72rem; color: ${color};` }, [
    h(resolveComponent('m-shape'), { name }),
  ])

// Wrap a vertical slider in a fixed-height column so it lays out and isn't clipped.
const hVerticalSlider = (props: Record<string, unknown>) =>
  h('div', { style: 'height: 200rem; display: flex; justify-content: center;' }, [
    h(resolveComponent('m-slider'), props),
  ])

// -----------------------------------------------------------------------------
// Configuration (Items for v-for)
// -----------------------------------------------------------------------------
const sections = computed(() => [
  {
    id: 'badge',
    title: 'Badge',
    variants: [
      { label: 'Small (Dot)', render: () => h(resolveComponent('m-badge'), { dot: true }) },
      { label: 'Large (Value)', render: () => h(resolveComponent('m-badge'), { value: 3 }) },
      { label: 'Max Value (99+)', render: () => h(resolveComponent('m-badge'), { value: 999, max: 99 }) },
    ],
  },
  {
    id: 'button',
    title: 'Button',
    variants: [
      { label: 'Filled', render: () => hBtn('Filled', 'filled') },
      { label: 'Filled Icon', render: () => hBtn('Add', 'filled', 'ic:baseline-plus') },
      { label: 'Outlined', render: () => hBtn('Outlined', 'outlined') },
      { label: 'Tonal', render: () => hBtn('Tonal', 'tonal') },
      { label: 'Elevated', render: () => hBtn('Elevated', 'elevated') },
      { label: 'Text', render: () => hBtn('Text', 'text') },
      { label: 'FAB', render: () => h(resolveComponent('m-button-fab'), { color: 'primary' }, { default: () => hIcon('ic:baseline-plus') }) },
      { label: 'Extended FAB', render: () => h(resolveComponent('m-button-extended-fab'), { color: 'primary' }, { default: () => 'Create', prepend: () => hIcon('ic:baseline-plus') }) },
      { label: 'Icon Button', render: () => h(resolveComponent('m-button-icon'), { variant: 'filled' }, { default: () => hIcon(ICONS.settings) }) },
      { label: 'Segmented', render: () => h(resolveComponent('m-button-segmented'), { 'items': [{ label: 'Map', value: 'map' }, { label: 'Transit', value: 'transit' }], 'modelValue': state.segmentedVal, 'onUpdate:modelValue': (v: string[]) => state.segmentedVal = v, 'multiple': true }) },
      { label: 'Split', render: () => h(resolveComponent('m-button-split'), { variant: 'filled', items: [{ label: 'Reply All', value: 'reply_all', icon: 'ic:baseline-reply-all' }] }, { default: () => 'Reply' }) },
    ],
  },
  {
    id: 'card',
    title: 'Card',
    variants: [
      {
        label: 'Elevated with Slots',
        render: () => h(resolveComponent('m-card'), { variant: 'elevated' }, {
          header: () => h('div', { style: 'padding: 16rem 16rem 0; font-weight: 500;' }, 'Card Title'),
          default: () => h('div', { style: 'padding: 16rem; color: var(--md-sys-color-on-surface-variant);' }, 'This is the main content slot of the card.'),
          actions: () => h('div', { style: 'padding: 8rem 16rem; display: flex; justify-content: flex-end;' }, [hBtn('Cancel', 'text'), hBtn('Save', 'filled')]),
        }),
      },
      { label: 'Outlined', render: () => h(resolveComponent('m-card'), { variant: 'outlined' }, { default: () => h('div', { style: 'padding: 16rem;' }, 'Outlined Card') }) },
    ],
  },
  {
    id: 'checkbox',
    title: 'Checkbox',
    variants: [
      { label: 'Checked', render: () => h(resolveComponent('m-checkbox'), { 'label': 'Accept Terms', 'modelValue': state.checkboxVal, 'onUpdate:modelValue': (v: boolean) => state.checkboxVal = v }) },
      { label: 'Unchecked', render: () => h(resolveComponent('m-checkbox'), { 'label': 'Subscribe', 'modelValue': state.checkboxUnchecked, 'onUpdate:modelValue': (v: boolean) => state.checkboxUnchecked = v }) },
      { label: 'Disabled', render: () => h(resolveComponent('m-checkbox'), { label: 'Cannot Select', disabled: true }) },
      { label: 'Disabled Checked', render: () => h(resolveComponent('m-checkbox'), { label: 'Locked on', disabled: true, modelValue: true }) },
    ],
  },
  {
    id: 'chip',
    title: 'Chip',
    variants: [
      { label: 'Assist (Slot combinations)', render: () => h(resolveComponent('m-chip'), { variant: 'assist' }, { default: () => 'Add to calendar', leading: () => hIcon('ic:baseline-plus') }) },
      { label: 'Filter (Selected)', render: () => h(resolveComponent('m-chip'), { variant: 'filter', selected: true }, { default: () => 'Filter applied' }) },
      { label: 'Input (Trailing Slot)', render: () => h(resolveComponent('m-chip'), { variant: 'input' }, { default: () => 'User Name', trailing: () => hIcon(ICONS.close) }) },
    ],
  },
  {
    id: 'date-picker',
    title: 'Date Picker',
    variants: [
      { label: 'Standard', render: () => h(resolveComponent('m-date-picker'), { 'label': 'Select Date', 'modelValue': state.dateVal, 'onUpdate:modelValue': (v: any) => state.dateVal = v }) },
      { label: 'Constrained (2002 → Today)', render: () => h(resolveComponent('m-date-picker'), { 'label': 'Birth date', 'minDate': dateMin, 'maxDate': dateMax, 'modelValue': state.dateValConstrained, 'onUpdate:modelValue': (v: any) => state.dateValConstrained = v }) },
    ],
  },
  {
    id: 'dialog',
    title: 'Dialog & Overlays',
    variants: [
      {
        label: 'Dialog',
        render: () => h('div', [
          hActivator('Open Dialog', 'showDialog', 'filled'),
          h(resolveComponent('m-dialog'), { 'modelValue': state.showDialog, 'onUpdate:modelValue': (v: boolean) => state.showDialog = v, 'title': 'Settings' }, {
            default: () => h('p', 'Adjust your settings here. Content is slotted.'),
            actions: () => h(resolveComponent('m-button'), { variant: 'text', onClick: () => state.showDialog = false }, { default: () => 'Close' }),
          }),
        ]),
      },
      {
        label: 'Bottom Sheet',
        render: () => h('div', [
          hActivator('Open Sheet', 'showSheet', 'tonal', ICONS.arrowUp),
          h(resolveComponent('m-sheet'), { 'modelValue': state.showSheet, 'onUpdate:modelValue': (v: boolean) => state.showSheet = v }, {
            default: () => h('div', { style: 'padding: 24rem;' }, [
              h('h3', { style: 'margin: 0 0 8rem;' }, 'Sheet Content'),
              h('p', { style: 'margin: 0;' }, 'Drag the handle down to dismiss, or tap the scrim.'),
            ]),
          }),
        ]),
      },
      {
        label: 'Snackbar',
        render: () => h('div', [
          hActivator('Show Snackbar', 'showSnackbar', 'outlined'),
          h(resolveComponent('m-snackbar'), { 'modelValue': state.showSnackbar, 'onUpdate:modelValue': (v: boolean) => state.showSnackbar = v, 'text': 'Action completed successfully.', 'actionLabel': 'Undo' }),
        ]),
      },
      {
        label: 'Menu (anchored)',
        render: () => h('div', { style: 'position: relative; display: inline-flex;' }, [
          h(resolveComponent('m-button'), { variant: 'tonal', onClick: () => { state.showMenu = !state.showMenu } }, { default: () => 'Open Menu' }),
          h(resolveComponent('m-menu'), { 'modelValue': state.showMenu, 'onUpdate:modelValue': (v: boolean) => state.showMenu = v, 'absolute': true, 'origin': 'top left' }, {
            default: () => h(resolveComponent('m-list'), { style: 'min-width: 160rem;' }, {
              default: () => [
                h(resolveComponent('m-list-item'), { headline: 'Profile', onClick: () => state.showMenu = false }),
                h(resolveComponent('m-list-item'), { headline: 'Settings', onClick: () => state.showMenu = false }),
                h(resolveComponent('m-list-item'), { headline: 'Logout', onClick: () => state.showMenu = false }),
              ],
            }),
          }),
        ]),
      },
      {
        label: 'FAB Menu (right)',
        render: () => h('div', { style: 'min-height: 220rem; display: flex; align-items: flex-end; justify-content: center;' }, [
          h(resolveComponent('m-fab-menu'), { items: fabItems, openIcon: 'ic:baseline-plus', closeIcon: ICONS.close }),
        ]),
      },
      {
        label: 'FAB Menu (left)',
        render: () => h('div', { style: 'min-height: 220rem; display: flex; align-items: flex-end; justify-content: center;' }, [
          h(resolveComponent('m-fab-menu'), { items: fabItems, align: 'left', openIcon: 'ic:baseline-plus', closeIcon: ICONS.close }),
        ]),
      },
      {
        label: 'Extended FAB Menu (activator slot)',
        render: () => h('div', { style: 'min-height: 220rem; display: flex; align-items: flex-end; justify-content: center;' }, [
          h(resolveComponent('m-fab-menu'), { items: fabItems }, {
            activator: ({ toggle, isOpen }: { toggle: () => void, isOpen: boolean }) =>
              h(resolveComponent('m-button-extended-fab'), { color: 'primary', onClick: toggle }, {
                default: () => (isOpen ? 'Close' : 'Actions'),
                prepend: () => hIcon(isOpen ? ICONS.close : 'ic:baseline-plus'),
              }),
          }),
        ]),
      },
    ],
  },
  {
    id: 'divider',
    title: 'Divider',
    variants: [
      { label: 'Horizontal', render: () => h('div', { style: 'width: 200rem; padding: 16rem 0;' }, [h(resolveComponent('m-divider'))]) },
    ],
  },
  {
    id: 'dropdown',
    title: 'Dropdown',
    variants: [
      { label: 'Filled', render: () => h(resolveComponent('m-dropdown'), { 'label': 'Select Option', 'options': dropdownOptions, 'modelValue': state.dropdownValFilled, 'onUpdate:modelValue': (v: string) => state.dropdownValFilled = v }) },
      { label: 'Outlined Multiple', render: () => h(resolveComponent('m-dropdown'), { 'label': 'Select Many', 'variant': 'outlined', 'multiple': true, 'options': dropdownOptions, 'modelValue': state.dropdownValMultiple, 'onUpdate:modelValue': (v: string[]) => state.dropdownValMultiple = v }) },
    ],
  },
  {
    id: 'expansion-panel',
    title: 'Expansion Panel',
    variants: [
      {
        label: 'Accordion',
        render: () => h(resolveComponent('m-expansion-panels'), { 'modelValue': state.expansionVal, 'onUpdate:modelValue': (v: number) => state.expansionVal = v }, {
          default: () => [
            h(resolveComponent('m-expansion-panel'), { title: 'Section 1' }, { default: () => 'Content for section 1' }),
            h(resolveComponent('m-expansion-panel'), { title: 'Section 2' }, { default: () => 'Content for section 2' }),
          ],
        }),
      },
    ],
  },
  {
    id: 'list',
    title: 'List',
    variants: [
      {
        label: 'List with Item Slots',
        render: () => h(resolveComponent('m-list'), { style: 'width: 300rem; border: 1rem solid var(--md-sys-color-outline-variant); border-radius: 8rem;' }, {
          default: () => [
            h(resolveComponent('m-list-item'), { headline: 'Item 1', supportingText: 'Detailed description' }, {
              leading: () => hIcon(ICONS.folder),
              trailing: () => hIcon(ICONS.moreVert),
            }),
            h(resolveComponent('m-list-item'), { headline: 'Item 2' }, {
              leading: () => hIcon(ICONS.person),
            }),
          ],
        }),
      },
    ],
  },
  {
    id: 'loading',
    title: 'Loading',
    variants: [
      { label: 'Circular Small', render: () => h(resolveComponent('m-loading'), { size: 'small' }) },
      { label: 'Circular Medium', render: () => h(resolveComponent('m-loading'), { size: 'medium' }) },
      { label: 'Circular Large', render: () => h(resolveComponent('m-loading'), { size: 'large' }) },
      { label: 'Expressive Medium', render: () => h(resolveComponent('m-loading'), { variant: 'expressive', size: 'medium' }) },
      { label: 'Expressive Large', render: () => h(resolveComponent('m-loading'), { variant: 'expressive', size: 'large' }) },
    ],
  },
  {
    id: 'shape',
    title: 'Shape',
    variants: [
      { label: 'Flower', render: () => hShape('flower') },
      { label: 'Heart', render: () => hShape('heart', 'var(--md-sys-color-error)') },
      { label: 'Sunny', render: () => hShape('sunny', 'var(--md-sys-color-secondary)') },
      { label: 'Hexagon', render: () => hShape('hexagon') },
      { label: 'Pentagon', render: () => hShape('pentagon', 'var(--md-sys-color-secondary)') },
      { label: '7-Sided Cookie', render: () => hShape('7SidedCookie') },
      { label: '4-Leaf Clover', render: () => hShape('4LeafClover', 'var(--md-sys-color-secondary)') },
      { label: 'Pill', render: () => hShape('pill', 'var(--md-sys-color-error)') },
    ],
  },
  {
    id: 'progress',
    title: 'Progress',
    variants: [
      { label: 'Linear Determinate', render: () => h(resolveComponent('m-progress'), { variant: 'linear', value: 45, style: 'width: 200rem;' }) },
      { label: 'Linear Indeterminate', render: () => h(resolveComponent('m-progress'), { variant: 'linear', indeterminate: true, style: 'width: 200rem;' }) },
      { label: 'Linear Expressive', render: () => h(resolveComponent('m-progress'), { variant: 'linear', value: 60, expressive: true, style: 'width: 200rem;' }) },
      { label: 'Linear Small', render: () => h(resolveComponent('m-progress'), { variant: 'linear', value: 50, size: 'small', style: 'width: 200rem;' }) },
      { label: 'Circular Determinate', render: () => h(resolveComponent('m-progress'), { variant: 'circular', value: 75 }) },
      { label: 'Circular Indeterminate', render: () => h(resolveComponent('m-progress'), { variant: 'circular', indeterminate: true }) },
      { label: 'Circular Expressive', render: () => h(resolveComponent('m-progress'), { variant: 'circular', value: 65, expressive: true }) },
      { label: 'Circular Large', render: () => h(resolveComponent('m-progress'), { variant: 'circular', value: 50, size: 'large' }) },
    ],
  },
  {
    id: 'radio',
    title: 'Radio',
    variants: [
      { label: 'Group', render: () => h('div', { style: 'display: flex; gap: 16rem;' }, [
        h(resolveComponent('m-radio'), { 'label': 'Option A', 'value': 'a', 'modelValue': state.radioVal, 'onUpdate:modelValue': (v: string) => state.radioVal = v }),
        h(resolveComponent('m-radio'), { 'label': 'Option B', 'value': 'b', 'modelValue': state.radioVal, 'onUpdate:modelValue': (v: string) => state.radioVal = v }),
      ]) },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    variants: [
      { label: 'Empty', render: () => h(resolveComponent('m-search'), { 'placeholder': 'Search...', 'modelValue': state.searchVal, 'onUpdate:modelValue': (v: string) => state.searchVal = v }) },
      { label: 'Filled (clear button)', render: () => h(resolveComponent('m-search'), { 'placeholder': 'Search...', 'modelValue': state.searchValFilled, 'onUpdate:modelValue': (v: string) => state.searchValFilled = v }) },
      { label: 'Disabled', render: () => h(resolveComponent('m-search'), { placeholder: 'Search...', disabled: true, modelValue: 'Cannot edit' }) },
    ],
  },
  {
    id: 'slider',
    title: 'Slider — Horizontal',
    variants: [
      { label: 'Continuous', render: () => h(resolveComponent('m-slider'), { 'showValue': true, 'label': 'Continuous', 'modelValue': state.sliderValContinuous, 'onUpdate:modelValue': (v: number) => state.sliderValContinuous = v }) },
      { label: 'Discrete', render: () => h(resolveComponent('m-slider'), { 'discrete': true, 'step': 10, 'showValue': true, 'label': 'Discrete', 'modelValue': state.sliderValDiscrete, 'onUpdate:modelValue': (v: number) => state.sliderValDiscrete = v }) },
      { label: 'Range', render: () => h(resolveComponent('m-slider'), { 'range': true, 'showValue': true, 'label': 'Range', 'modelValue': state.sliderValRange, 'onUpdate:modelValue': (v: number[]) => state.sliderValRange = v }) },
      { label: 'Disabled', render: () => h(resolveComponent('m-slider'), { label: 'Disabled', disabled: true, showValue: true, modelValue: 30 }) },
    ],
  },
  {
    id: 'slider',
    title: 'Slider — Vertical',
    variants: [
      { label: 'Continuous', render: () => hVerticalSlider({ 'orientation': 'vertical', 'showValue': true, 'modelValue': state.sliderValVertical, 'onUpdate:modelValue': (v: number) => state.sliderValVertical = v }) },
      { label: 'Discrete', render: () => hVerticalSlider({ 'orientation': 'vertical', 'discrete': true, 'step': 10, 'showValue': true, 'modelValue': state.sliderValVerticalDiscrete, 'onUpdate:modelValue': (v: number) => state.sliderValVerticalDiscrete = v }) },
      { label: 'Range', render: () => hVerticalSlider({ 'orientation': 'vertical', 'range': true, 'showValue': true, 'modelValue': state.sliderValVerticalRange, 'onUpdate:modelValue': (v: number[]) => state.sliderValVerticalRange = v }) },
      { label: 'Disabled', render: () => hVerticalSlider({ orientation: 'vertical', disabled: true, showValue: true, modelValue: 30 }) },
    ],
  },
  {
    id: 'switch',
    title: 'Switch',
    variants: [
      { label: 'On', render: () => h(resolveComponent('m-switch'), { 'label': 'Wi-Fi', 'modelValue': state.switchVal, 'onUpdate:modelValue': (v: boolean) => state.switchVal = v }) },
      { label: 'Off', render: () => h(resolveComponent('m-switch'), { 'label': 'Airplane mode', 'modelValue': state.switchOff, 'onUpdate:modelValue': (v: boolean) => state.switchOff = v }) },
      { label: 'Disabled Off', render: () => h(resolveComponent('m-switch'), { label: 'Bluetooth', modelValue: false, disabled: true }) },
      { label: 'Disabled On', render: () => h(resolveComponent('m-switch'), { label: 'Location', modelValue: true, disabled: true }) },
    ],
  },
  {
    id: 'tabs',
    title: 'Tabs',
    variants: [
      { // Note: assuming m-tabs takes a list or we can slot m-tab components. Using standard assumption.
        label: 'Basic Tabs',
        render: () => h(resolveComponent('m-tabs'), { 'modelValue': state.tabsVal, 'onUpdate:modelValue': (v: string) => state.tabsVal = v }, {
          // If the component requires slotted `m-tab` elements:
          default: () => [
            h(resolveComponent('m-tabs-tab') || resolveComponent('m-tab') || h('div'), { value: 'tab1' }, { default: () => 'Tab 1' }),
            h(resolveComponent('m-tabs-tab') || resolveComponent('m-tab') || h('div'), { value: 'tab2' }, { default: () => 'Tab 2' }),
          ],
        }),
      },
    ],
  },
  {
    id: 'text-field',
    title: 'Text Field',
    variants: [
      { label: 'Filled with Prepend Slot', render: () => h(resolveComponent('m-text-field'), { 'label': 'Username', 'modelValue': state.textFieldVal, 'onUpdate:modelValue': (v: string) => state.textFieldVal = v }, { prepend: () => hIcon(ICONS.person) }) },
      { label: 'Outlined with Append Slot', render: () => h(resolveComponent('m-text-field'), { variant: 'outlined', label: 'Password', type: 'password' }, { append: () => h(resolveComponent('m-button-icon'), { variant: 'text' }, { default: () => hIcon(ICONS.visibility) }) }) },
      { label: 'Filled with Helper Text', render: () => h(resolveComponent('m-text-field'), { label: 'Email', type: 'email', helperText: 'We will never share your email.' }, { prepend: () => hIcon(ICONS.email) }) },
      { label: 'Error State', render: () => h(resolveComponent('m-text-field'), { variant: 'outlined', label: 'Email', type: 'email', error: true, errorMessage: 'Enter a valid email address.' }) },
      { label: 'Disabled', render: () => h(resolveComponent('m-text-field'), { label: 'Disabled field', disabled: true, modelValue: 'Read only' }) },
    ],
  },
  {
    id: 'time-picker',
    title: 'Time Picker',
    variants: [
      { label: '24-hour', render: () => h(resolveComponent('m-time-picker'), { 'label': 'Set Time', 'modelValue': state.timeVal, 'onUpdate:modelValue': (v: any) => state.timeVal = v }) },
      { label: '12-hour', render: () => h(resolveComponent('m-time-picker'), { 'label': 'Set Time', 'is24h': false, 'modelValue': state.timeVal12h, 'onUpdate:modelValue': (v: any) => state.timeVal12h = v }) },
    ],
  },
  {
    id: 'tooltip',
    title: 'Tooltip',
    variants: [
      { label: 'Tooltip Wrapping Button', render: () => h(resolveComponent('m-tooltip'), { text: 'Information bubble' }, { default: () => hBtn('Hover Me', 'tonal') }) },
    ],
  },
])
</script>

<style lang="scss">
@use 'sass:map';

.demo-material {
  &__showcase {
    display: flex;
    flex-direction: column;
    gap: 48rem;
    padding-bottom: 64rem;
  }

  &__section-title {
    margin: 0;
    color: map.get($theme-color-link, 'on-primary-container');

    @include typescale('headline-large');
  }

  &__showcase-item {
    display: flex;
    flex-direction: column;
    gap: 24rem;
  }

  &__showcase-subtitle {
    margin: 0;
    color: map.get($theme-color-link, 'on-surface-variant');

    @include typescale('title-large');

    border-bottom: 1rem solid map.get($theme-color-link, 'outline-variant');
    padding-bottom: 8rem;
  }

  &__variants {
    display: flex;
    flex-wrap: wrap;
    gap: 24rem;
    align-items: flex-start;
  }

  &__preview-container {
    border: 1rem solid map.get($theme-color-link, 'outline-variant');
    border-radius: map.get($theme-shape-link, 'medium');
    background-color: map.get($theme-color-link, 'surface');
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 240rem;

    // Allow forms/lists to stretch
    &--text-field, &--dropdown, &--list, &--card, &--slider {
      flex: 1;
      min-width: 320rem;
    }
  }

  &__preview-content {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rem;
    min-height: 120rem;
    background-color: map.get($theme-color-link, 'surface-container');
  }

  &__preview-label {
    @include typescale('label-medium');

    padding: 12rem 16rem;
    background-color: map.get($theme-color-link, 'surface-container');
    color: map.get($theme-color-link, 'on-surface-variant');
    border-top: 1rem solid map.get($theme-color-link, 'outline-variant');
    text-align: center;
  }
}
</style>
