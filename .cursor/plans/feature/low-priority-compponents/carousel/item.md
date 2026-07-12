# CarouselItem: low priority private leaf

<identity>Status: low priority · Vuetify `VCarouselItem` · Candidate target: private adapter leaf</identity>

<problem>Each slide needs stable-value panel registration, active/visited state, ids and transition/inert behavior without an independent model.</problem>

<candidate-contract>Internal normalized source item/value/key/disabled and content slot exposing active/visited. No public import, direct navigation or timer.</candidate-contract>

<composition>Thin adapter over `WindowItem`; parent carousel owns selection, swipe, controls, indicators and autoplay. The leaf does not register a second carousel ticket.</composition>

<reuse>`WindowItem` mount/active/inert behavior and carousel nested content tokens. Media content remains consumer/future image-pipeline owned.</reuse>

<accessibility>Slide position/set size and labelling must remain coherent for retained/lazy panels; inactive content is hidden/inert and never focusable.</accessibility>

<promotion-gate>Finalize only with parent and approved MWindow/autoplay/accessibility policy.</promotion-gate>

