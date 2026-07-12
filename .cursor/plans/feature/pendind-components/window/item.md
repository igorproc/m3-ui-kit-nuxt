# WindowItem

<pending-status>Pending with MWindow foundation; promotes only together with the parent after mount/inert/registration lifecycle validation.</pending-status>

<identity>Vuetify `VWindowItem` · private `WindowItem` · Phase 4 foundation · sub</identity>

<problem>Each normalized panel needs ticket registration, active/visited derivation and mount/inert behavior without a local model.</problem>

<api>Internal props: source item, value, stable key, disabled, mount policy and index. Slot receives item/value/active/visited. No emits/model/public import.</api>

<composition>Inject the required window context, register one `createSingle` ticket and dispose through ticket lifecycle/`onScopeDispose`. Parent supplies normalized identity; item never derives index as business value.</composition>

<reuse>Window context/ticket and parent motion tokens. No second registry, watcher-driven model bridge or independent drag state.</reuse>

<behavior>Compute active from ticket. Mark visited on first active transition. Render according to active/visited/eager policy; retained inactive root gets hidden/inert. Direction comes from parent selection order.</behavior>

<accessibility>Default root is semantic-neutral and exposes safe ids/active state for adapters. Hidden content cannot receive focus. Consumer panel roles remain possible without duplicated roles.</accessibility>

<styles>Consume nested item enter/leave/active/inactive branches from window tokens. Motion preserves geometry and honors reduced motion.</styles>

<ssr-lifecycle>No mounted initialization. Registration/disposal is scope-safe; initial active/visited state matches SSR selection.</ssr-lifecycle>

<tests>Registration cleanup, all mount branches, hidden/inert, dynamic disable/removal, direction, SSR and tokens.</tests>

<done>Panel lifecycle is entirely derived from the parent window ticket and mount policy.</done>

<questions>None.</questions>
