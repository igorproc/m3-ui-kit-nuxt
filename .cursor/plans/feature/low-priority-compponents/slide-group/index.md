# MSlideGroup: low priority

<identity>
Status: low priority · Vuetify reference: `VSlideGroup` · Candidate target: public `MSlideGroup` with private `SlideGroupItem`
</identity>

<clarification>
This is not a content carousel. It is a scrollable strip of peer controls/content—commonly chips or tabs—with overflow arrows, optional selection and active-item reveal. The distinct carousel family owns timed slides, media panels and carousel navigation semantics.
</clarification>

<reason-for-low-priority>
Current chip/tab consumers can use wrapping or native overflow. A polished slide group requires coordinated scroll state, drag/gesture arbitration, RTL normalization, overflow controls, focus navigation and active-item reveal. Those capabilities are useful but do not currently block the higher-priority data/navigation foundations.
</reason-for-low-priority>

<candidate-api>
Stable-value model; single/multiple/mandatory selection; `direction`; arrow visibility policy; center/reveal active item; default/prev/next slots. Exact API must avoid duplicating `MChipGroup`/`MTabs` selection contracts when used only as an overflow shell.
</candidate-api>

<composition>
```text
MSlideGroup
├── viewport/track
├── optional MButtonIcon previous/next
├── selection/ordered item context when requested
└── private SlideGroupItem tickets
```
</composition>

<reuse>
Canonical selection registry, `MButtonIcon`, `useDrag`, `useEventListener`, `useRaf`, logical scroll utilities and system motion. Do not create per-item global listeners, index models or carousel state.
</reuse>

<promotion-gate>
Promote when multiple component families require the same accessible overflow arrows/drag/reveal behavior and native scroll/wrap no longer provides acceptable UX. Review whether selection is intrinsic or whether the primitive should be a selection-neutral overflow container composed around existing groups.
</promotion-gate>

