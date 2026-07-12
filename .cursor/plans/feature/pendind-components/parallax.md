# MParallax: pending image composite

<identity>
Status: pending with image architecture · Vuetify reference: `VParallax` · Candidate target: public `MParallax` or image-motion composition
</identity>

<reason-for-pending>
Parallax is not an independent primitive. Its media source, responsive dimensions, reserved aspect geometry, loading/error behavior, provider transforms and SSR markup depend on the pending `MImg` plugin/provider/imgProxy/factory architecture. Designing `src/height/scale` now would freeze a parallel image API and later require migration.
</reason-for-pending>

<dependency>
Primary plan: [`MImg pending image architecture`](image.md). Parallax returns to active planning only after the image source/provider and responsive geometry contracts are approved.
</dependency>

<candidate-scope>
An opt-in decorative media container that composes the final image component/source factory with scroll progress and a bounded transform. Prefer native CSS scroll-driven animation when the supported platform policy allows it; otherwise use one lifecycle-safe RAF-coalesced calculation. Slot content remains separate from the transformed decorative media layer.
</candidate-scope>

<architecture-to-decide>
- Whether parallax is a public component, directive/composable or an `MImg` motion option.
- Image source/transform props inherited from MImg versus explicit composition.
- CSS scroll timelines support/fallback policy.
- Scroll container/root selection without global listener duplication.
- Transform range/speed contract and prevention of uncovered container edges.
- Reserved layout/aspect ratio before image load.
- SSR initial transform and hydration parity.
- Interaction with image focal position, cover/contain and provider crops.
</architecture-to-decide>

<motion-accessibility>
Parallax is decorative enhancement. `prefers-reduced-motion` disables displacement and renders a stable image position. Consumer can disable it explicitly. Motion never changes reading order, focus location or semantic image alternative text. Foreground slot content is not transformed with the media by default.
</motion-accessibility>

<performance>
No raw per-instance window scroll loops. Prefer CSS; fallback shares lifecycle-safe event/RAF utilities, reads geometry in one phase and writes one transform without layout thrash. Offscreen instances stop work. Cleanup occurs on scope disposal.
</performance>

<reuse>
Final `MImg`/provider/factory, responsive geometry, `useRaf`, `useEventListener`, visibility utilities and reduced-motion system. Do not duplicate source resolution, image loading/error, proxy transformations or cache policy.
</reuse>

<non-goals>
- no standalone image pipeline;
- no mandatory motion;
- no background content fetching;
- no raw scroll listeners;
- no implementation before MImg architecture.
</non-goals>

<promotion-gate>
Promote with or after `MImg` once provider/source/layout contracts and motion platform policy are approved. At that point decide whether a separate component still provides value over an image-motion composable.
</promotion-gate>

