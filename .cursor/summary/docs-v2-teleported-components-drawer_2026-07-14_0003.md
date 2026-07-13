# docs_v2 teleported components drawer

## Result

Moved the docs_v2 components drawer out of the `m-layout-aside` DOM subtree by
composing it with public `m-overlay` in `popover` mode. The drawer keeps
`aside/nav/link` semantics while reusing the shared overlay host, stack,
Escape and outside-dismiss lifecycle.

The rail remains the owner of delayed hover/focus opening. The teleported
drawer emits enter/leave signals for both pointer and focus, so moving between
the rail and overlay cancels the close timer even though the nodes no longer
share DOM containment.

## Overlay adjustment

`MOverlay` popover roots now use `pointer-events: none`; actual slotted content
already restores pointer events. This prevents the viewport-sized overlay root
from blocking the underlying page while retaining outside-click detection.

The drawer passes `docs-components-drawer-overlay` to the existing Vue
`Transition`. Opacity transitions on the overlay root so Vue detects and waits
for the leave duration; the nested drawer performs the translate/scale motion.
Reduced-motion disables both transitions.

## Verification

- docs_v2 `components-drawer.spec.ts`: 3 tests passed;
- docs_v2 targeted ESLint and Stylelint passed;
- kit `overlay.spec.ts`: 9 tests passed;
- kit targeted Overlay Stylelint passed.

No Nuxt build or dev server was started.
