# M3 Migration Workflow Rules

## 1. Discovery and Context Gathering
- **Browser Reference Scanning**: Before starting work on any component migration, browse the M3 Material Design specification URL provided (e.g., `https://m3.material.io/...`). Scan the nested links/subsections in that component's documentation to understand the layout, specs, guidelines, and behavioral context of how the component is expected to look and behave. Do not waste time parsing full design tokens lists on the web if they are already mapped locally.
- **Figma Design Inspection**: Access and scan all relevant layers/nodes of the Figma design kit community template provided. Check sizes, spacings, borders, colors, and layout constraints to match our implementation.
- **Token Map Alignment**: On every component, verify the declared component-specific design tokens against the M3 spec and local variables.

## 2. Zero-Runtime M3 Component Refactoring
- **Declarative Value Transition**: Transfer the component's legacy static stylesheet variables to the new zero-runtime M3 architecture. Map all styling variables inside an `_index.scss` file in the component's folder (following the structure in [badge/_index.scss](file:///d:/dev/primetime/ui/kit/app/assets/stylesheet/components/badge/_index.scss)).
- **Preserve Behavior and Logic**: Never touch or alter the Vue component logic (`<script setup>` or core template structure) unless explicitly requested or needed to fix/propagate styles cleanly.
- **Static Resolution**: Ensure all design tokens are picked from the local `$tokens` map using `g($t, 'path-to-token')`.
