# MImg: pending image architecture

<identity>
Status: pending architecture discussion · Vuetify reference: `VImg` · Candidate target: public `MImg` plus image infrastructure
</identity>

<reason-for-pending>
A useful `MImg` is likely larger than a visual wrapper around native `<img>`. Its durable contract depends on decisions about a Nuxt/plugin integration, image providers, `imgProxy`, source factories, transformations, responsive source generation, caching and security boundaries. Implementing the small wrapper first could freeze incompatible props and duplicate the later pipeline.
</reason-for-pending>

<architecture-to-decide>
- Whether the kit owns an image plugin/module or only a provider-neutral component.
- Provider/factory contract for source URLs and transformation descriptors.
- `imgProxy` integration, signing, allowed origins and SSR/client URL parity.
- Responsive `srcset`/`sizes`, widths, formats, quality and DPR generation.
- Native/Nuxt Image interoperability and fallback when no provider is configured.
- Lazy loading, preload/fetch priority, decoding and above-the-fold policy.
- Placeholder, blur/hash/color preview and error-source behavior.
- Cache keys, invalidation and whether caching remains entirely provider-owned.
- Security/privacy policy for remote URLs and referrer/cross-origin attributes.
</architecture-to-decide>

<candidate-component-scope>
The eventual `MImg` should reserve layout through dimensions/aspect ratio, keep native image semantics, expose cover/contain positioning, loading/error/placeholder slots and forward appropriate native responsive attributes. It must not hide network requests or create a client fetch store.
</candidate-component-scope>

<candidate-api-boundary>
Separate semantic media input from resolved transport:

```ts
type MImageSource = string | MImageSourceDescriptor

interface MImageSourceDescriptor {
  src: string
  width?: number
  height?: number
  format?: string
  quality?: number
  modifiers?: Record<string, string | number | boolean>
}
```

Exact fields are not approved. They must be derived from the selected provider/factory architecture rather than copied from Vuetify or Nuxt Image.
</candidate-api-boundary>

<reuse>
Native `<img>` remains the semantic/loading source of truth. Reuse `useInView` only if native loading/provider behavior is insufficient, and reuse the chosen Nuxt/image-provider ecosystem instead of implementing transforms or caching in the component.
</reuse>

<non-goals>
- no ad-hoc URL string concatenation in the SFC;
- no hidden fetch/cache store;
- no mandatory proprietary provider;
- no client-only source resolution that changes SSR markup;
- no early public API before plugin/factory/imgProxy boundaries are approved.
</non-goals>

<promotion-gate>
Return to the active roadmap only after the image provider/plugin, proxy/factory, SSR and security contracts are reviewed together. Then expand this file into the complete implementation specification and decide whether infrastructure requires separate plans.
</promotion-gate>

<dependent-composites>
[`MParallax`](parallax.md) is pending beside this plan and must reuse the final source/provider/responsive geometry contract rather than define a parallel image API.
</dependent-composites>
