# StepperVertical

<pending-status>Pending with the complete Stepper family; must prove state parity with horizontal rendering.</pending-status>

<identity>Vuetify `VStepperVertical` · private vertical renderer · Phase 4 · sub</identity>

<problem>Vertical workflow interleaves header, connector, body and local actions, unlike horizontal header/window layout.</problem>

<api>Internal normalized items/current/mount/navigation state and forwarded item/panel/action slots. No model/context.</api>

<composition>Immediate child of root; receives direct props and renders VerticalItems. Root context remains the single cross-branch workflow authority.</composition>

<reuse>Root state/methods, VerticalItem/Actions, Window mount semantics and family tokens. No duplicate selection or breakpoint auto renderer.</reuse>

<behavior>DOM reading order is header → active body → local actions → next header. Only active body is exposed; mount retention follows root policy.</behavior>

<accessibility>Ordered list semantics and uninterrupted reading/focus order. CSS never visually reorders steps.</accessibility>

<styles>Nested vertical rail, connector, indentation and body motion tokens; logical properties support RTL.</styles>

<tests>Order, dynamic steps, active body, mount modes, RTL, focus and SSR.</tests>

<done>Vertical presentation is a stateless renderer of the same root workflow.</done>

<questions>None.</questions>
