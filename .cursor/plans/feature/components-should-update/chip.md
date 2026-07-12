# MChip group integration update

<identity>Existing family: `MChip` · Trigger: new `MChipGroup` · Status: approved dependency update</identity>

<problem>The current chip owns only standalone `defineModel<boolean>` selection and cannot participate in a stable-value group without manually duplicated bindings.</problem>

<solution>Add optional `value`, dedicated chip-group context injection and selected-icon rendering while preserving standalone behavior exactly. This is an extension of `MChip`, not a second grouped chip component.</solution>

<api>Add generic optional `value?: TValue` and `showSelectedIcon?: boolean` (default true for filter type). Add `selected-icon` slot receiving selected/disabled/blocked. Existing type/disabled/model/slots remain compatible.</api>

<mode-rule>Dedicated chip context + defined value selects grouped ticket mode. Without value, including inside a group, the chip remains a valid standalone assist/filter/input/suggestion component and stays outside selection/roving registration. Generic `MSelectionGroup` alone never activates grouped chip mode.</mode-rule>

<reuse>`MChipGroupContext`, existing chip button/slots/tokens and selection ticket. No second chip implementation, generic-context auto-detection or local group model.</reuse>

<lifecycle>Register reactive value/disabled/element getters once and stop on scope disposal. Stale view entries cannot survive unmount. Standalone mode creates no ticket.</lifecycle>

<accessibility>Grouped filter chips expose aria-pressed and context tabindex; blocked/disabled are reflected by the ticket. Standalone semantics remain unchanged. Selected marker is decorative because pressed state is announced.</accessibility>

<styles>Extend the co-located chip token map for selected-icon geometry/motion, focus-visible and max-blocked state. Group layout tokens do not leak into the chip SFC.</styles>

<tests>Full standalone regression for every chip type plus explicit standalone chips inside group layout, opt-in value registration, model source exclusivity, selected icon/slot, mixed keyboard bindings, disabled/max and cleanup.</tests>

<done>One MChip supports standalone and dedicated-group modes without ambiguous dual state.</done>

<questions>None.</questions>
