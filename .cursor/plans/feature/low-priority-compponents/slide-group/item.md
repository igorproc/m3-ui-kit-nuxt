# SlideGroupItem: low priority private leaf

<identity>
Status: low priority · Vuetify reference: `VSlideGroupItem` · Candidate target: private sub-component
</identity>

<problem>
An eventual slide-group child needs stable registration, element/ref tracking, selected/disabled state and active-item reveal without using DOM index as the application model.
</problem>

<candidate-contract>
Internal stable `value`, `disabled` and element registration; slot state exposes selected/blocked/toggle/focus visibility where selection is part of the approved parent design. It has no independent model or public import.
</candidate-contract>

<reuse>
Parent context and canonical selection ticket with `onScopeDispose`; parent owns scroll calculations and listeners. Visual content owns its own surface/state tokens.
</reuse>

<accessibility>
Disabled items are skipped by ordered navigation. Leaf does not invent roles because consumers may be chips, tabs or other controls. Focus/selection semantics remain with the visual child and parent family contract.
</accessibility>

<promotion-gate>
Finalize only after deciding whether `MSlideGroup` owns selection or acts as a selection-neutral overflow primitive.
</promotion-gate>

