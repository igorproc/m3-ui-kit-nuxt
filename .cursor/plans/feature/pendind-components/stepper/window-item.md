# StepperWindowItem

<pending-status>Pending with StepperWindow and WindowItem lifecycle semantics.</pending-status>

<identity>Vuetify `VStepperWindowItem` · private `StepperWindowItem` · Phase 4 · adapter leaf</identity>

<problem>Each normalized step must bind source content and step ARIA ids to one WindowItem.</problem>

<api>Internal item/value/index/headerId/panelId and content slot. No model, emits or registry.</api>

<composition>Thin adapter over private WindowItem slot/state. It does not register a second step ticket and never requests navigation.</composition>

<reuse>WindowItem active/visited/mount state and root ids. No local transition/status logic.</reuse>

<accessibility>Panel root uses paired id/labelledby and appropriate hidden/inert behavior; active panel may receive programmatic focus only through root policy.</accessibility>

<styles>Uses Window motion tokens and stepper panel content spacing only.</styles>

<tests>Value binding, slot source item, ids, active/inert/mount behavior and SSR.</tests>

<done>One adapter binds step metadata to the existing window panel lifecycle.</done>

<questions>None.</questions>
