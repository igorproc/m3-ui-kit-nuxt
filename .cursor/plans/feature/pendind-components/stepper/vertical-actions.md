# StepperVerticalActions

<pending-status>Pending with StepperVertical and shared root action contract.</pending-status>

<identity>Vuetify `VStepperVerticalActions` · private vertical action layout · Phase 4 · sub</identity>

<problem>Actions inside an active vertical body require local alignment while retaining the root action contract.</problem>

<api>Same safe state/methods and slots as StepperActions plus vertical layout modifier. No model/context.</api>

<composition>Thin presentation adapter over StepperActions behavior; receives direct props from VerticalItem.</composition>

<reuse>StepperActions contract/default MButtons and nested vertical action tokens. No separate navigation or pending state.</reuse>

<accessibility>Previous/next/complete DOM order is unchanged; native disabled/loading semantics remain intact.</accessibility>

<styles>Vertical indentation, gap, wrapping and narrow-width alignment only.</styles>

<tests>Bounds, last step, pending, order, narrow layout, RTL and SSR.</tests>

<done>Vertical actions alter layout only and cannot diverge from root navigation.</done>

<questions>None.</questions>
