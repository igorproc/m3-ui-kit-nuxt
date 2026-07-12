# StepperWindow

<pending-status>Pending adapter between the complete Stepper root and pending MWindow foundation.</pending-status>

<identity>Vuetify `VStepperWindow` · private `StepperWindow` · Phase 4 · adapter</identity>

<problem>Step panels need generic mounting/motion while preventing `MWindow` navigation from bypassing step guards.</problem>

<api>Internal normalized items, readonly selected value, mount policy and panel slot. No public model/navigation methods.</api>

<composition>Render `MWindow` as a controlled display adapter and private StepperWindowItems. Root is the only writer; window next/select is not exposed through this adapter.</composition>

<reuse>`MWindow`, root ids/current state and window tokens. No second selection context or transition implementation.</reuse>

<accessibility>Supplies panel semantics and paired header ids; inactive behavior delegates to MWindow hidden/inert policy.</accessibility>

<styles>Only stepper-specific panel spacing; motion remains MWindow-owned.</styles>

<tests>Readonly synchronization, guarded changes only, mount policies, ids/ARIA, transitions and SSR.</tests>

<done>Stepper panels reuse Window without creating an alternate navigation path.</done>

<questions>None.</questions>
