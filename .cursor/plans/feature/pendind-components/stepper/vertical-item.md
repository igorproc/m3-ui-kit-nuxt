# StepperVerticalItem

<pending-status>Pending with StepperVertical and shared Window mount/focus behavior.</pending-status>

<identity>Vuetify `VStepperVerticalItem` · private vertical item · Phase 4 · sub</identity>

<problem>A vertical step combines status header, connector and conditionally mounted body without owning navigation.</problem>

<api>Internal normalized item/status/current/selectable/mount and root request plus panel/action slots. No model/registry.</api>

<composition>Reuses StepperItem status/header rules, renders body through WindowItem-derived mount state and embeds VerticalActions for the active step.</composition>

<reuse>Root state/ids, StepperItem visual logic, Window mounting and MIcon/MButton leaves. No duplicated ticket/context.</reuse>

<behavior>Header request routes to root. Inactive retained body is hidden/inert; actions exist only for active body. Status does not derive from mounted content.</behavior>

<accessibility>Header/panel ids paired; current uses aria-current step; inactive body cannot receive focus; reading order remains source order.</accessibility>

<styles>Nested vertical header/body/connector/status tokens from family map.</styles>

<tests>Statuses, guarded header, body mount/inert, action presence, ids, focus, RTL and SSR.</tests>

<done>Vertical item composes existing state/panel primitives without another workflow state.</done>

<questions>None.</questions>
