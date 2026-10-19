/**
 * Public component types, re-exported through the package's `./types` entry so
 * consumers can type their data without deep imports into the runtime.
 * Type-only, so nothing here exists at runtime and no import cycle can form.
 * Relative paths on purpose: the `#kit` alias is only known inside a Nuxt app.
 */

export type { MButtonDensity, MButtonProps, MButtonShape, MButtonTag, MButtonType, MIconButtonVariant, MIconButtonWidth } from '../../components/ui/button/props'
export type { MFabProps, MFabVariant } from '../../components/ui/button/fab/props'
export type { MExtendedFabProps } from '../../components/ui/button/extended-fab/props'
export type { MSplitButtonProps, MSplitButtonVariant } from '../../components/ui/button/split/props'
export type { MSegmentedItem, MSegmentedModelValue, MSegmentedProps } from '../../components/ui/button/segmented/props'
export type { MButtonGroupItem, MButtonGroupModelValue, MButtonGroupProps, MButtonGroupVariant } from '../../components/ui/button/group/props'
export type { MFabMenuAlign, MFabMenuItem, MFabMenuProps } from '../../components/ui/fab-menu/props'
export type { MLoadingProps, MLoadingSize, MLoadingType } from '../../components/ui/loading/props'
export type { MTableAlign, MTableDensity, MTablePageRange, MTableProps, SortDirection, SortState, TableColumn, TableData } from '../../components/ui/table/types'
