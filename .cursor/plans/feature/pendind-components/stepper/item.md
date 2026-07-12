# StepperItem

<pending-status>Pending with the complete Stepper family and root workflow/focus contract.</pending-status>

<identity>Vuetify `VStepperItem` · private horizontal `StepperItem` · Phase 4 · sub</identity>

<problem>A step header needs consistent status, connector relationship, selection request and header/panel accessibility.</problem>

<api>Internal normalized item/index/status/selectable/current props; content slot mirrors item/status. No model or independent registration.</api>

<composition>Receives the root-owned normalized state. Actionable headers reuse `MButton` text/control foundation; current/noneditable/disabled render noninteractive header content. Status icons use `MIcon`.</composition>

<reuse>Root context methods/ids, `MButton`, `MIcon` and nested tokens. No local registry/context or raw button state implementation.</reuse>

<behavior>Status priority: disabled, error, complete, current, pending. Click requests root transition with reason item; leaf never mutates model.</behavior>

<accessibility>Current has `aria-current=step`; interactive header controls panel id; disabled uses native/noninteractive semantics; visible title is required; status icons are decorative.</accessibility>

<styles>Nested item and connector tokens cover each status; interactive state remains in reused button foundation.</styles>

<tests>Status priority, request routing, ids/ARIA, focusability, long labels, RTL connector and SSR.</tests>

<done>Horizontal header is a pure view over root workflow state.</done>

<questions>None.</questions>
