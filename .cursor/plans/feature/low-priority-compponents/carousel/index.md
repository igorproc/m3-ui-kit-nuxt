# MCarousel: low priority

<identity>
Status: low priority · Vuetify reference: `VCarousel` · Candidate target: public `MCarousel` with private `CarouselItem`
</identity>

<reason-for-low-priority>
Carousel is a substantial media/content presentation composite rather than a foundational navigation primitive. A correct implementation needs controlled value selection, transitions, touch gesture arbitration, autoplay pause rules, controls/indicators, inactive-content semantics, reduced motion and responsive media behavior. These capabilities are useful but do not currently block core product flows.
</reason-for-low-priority>

<candidate-scope>
Compose the approved `MWindow` foundation with carousel-specific previous/next controls, indicators, optional autoplay and swipe. Use stable item values rather than index as the public model. The root is the only selection/timer owner; private items adapt content into Window panels.
</candidate-scope>

<candidate-api>
Typed items/value model, interval/cycle policy, arrows/indicators visibility, touch, direction, mount policy and slots for item/controls/indicators. Exact autoplay naming/defaults require later review. Autoplay must be opt-in and never hidden behind an ambiguous default.
</candidate-api>

<autoplay-policy>
When enabled, pause on hover, focus within, document hidden and user interaction; resume only according to an explicit policy. Stop timers on scope disposal. Reduced-motion preference disables automatic animated movement or requires explicit consumer override. Announce slide changes conservatively and never create repeated live-region noise.
</autoplay-policy>

<interaction>
Keyboard previous/next/Home/End operates only within focused carousel controls. Touch uses `useDrag` and confirms horizontal intent before blocking native scroll. RTL uses logical direction. Controls use `MButtonIcon`; inactive retained slides are hidden/inert through `MWindow`.
</interaction>

<reuse>
`MWindow`/WindowItem, `useTimer`, `useDrag`, `useRaf`, `useEventListener`, `MButtonIcon`, future image pipeline and system motion. Do not create a second panel selection engine, raw timers/listeners or implicit image fetching.
</reuse>

<non-goals>
- no default autoplay;
- no direct dependency on unfinished MImg architecture;
- no data fetching/content CMS integration;
- no index-only business model;
- no carousel behavior inside generic MWindow.
</non-goals>

<promotion-gate>
Promote when a concrete product surface needs a carousel and MWindow plus gesture/timer/image foundations have passed integration testing. Expand parent/item plans together before implementation.
</promotion-gate>

