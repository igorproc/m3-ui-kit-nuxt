# StepperActions

<pending-status>Pending with the complete Stepper family and MWindow dependency.</pending-status>

<identity>Vuetify `VStepperActions` · private `StepperActions` · Phase 4 · sub</identity>

<problem>Previous/next/complete controls need one bounds, loading and localization policy.</problem>

<api>Internal current/first/last/canPrev/canNext/navigating plus root prev/next/complete methods. Slots: default, previous, next, complete. No model.</api>

<composition>Default renders `MButton` actions. Last step substitutes complete for next. Whole-control slots receive safe props/actions; root remains navigation owner.</composition>

<reuse>`MButton`, locale labels and root navigation methods. No validation checks, direct model writes or duplicate pending state.</reuse>

<behavior>Previous/next order is stable. Pending guard disables repeated actions and shows loading on the initiating default action. Bounds produce true disabled controls, not prevented clicks.</behavior>

<accessibility>Native buttons, localized labels and predictable DOM/focus order. Completion is not submit unless consumer deliberately replaces/binds it.</accessibility>

<styles>Nested action gap/alignment/wrap tokens only; button states are not copied.</styles>

<tests>Bounds, last-step substitution, pending, safe slots, labels, RTL/order, errors and SSR.</tests>

<done>All workflow actions share root navigation policy without owning step state.</done>

<questions>None.</questions>
