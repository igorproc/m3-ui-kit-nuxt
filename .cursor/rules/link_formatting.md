# Link Formatting Guidelines

To ensure maximum readability, clean UI presentation, and fully functional, clickable links for both the AI assistant and the developer workspace, all referenced files, line ranges, and code symbols (classes, functions, types, structs) must follow these precise formatting rules.

## 1. Core Format
Always use GitHub-style markdown links with the `file://` scheme.
- **Correct**: `[basename](file:///absolute/path/to/file)`
- **Incorrect**: `[basename](/absolute/path/to/file)` or `[basename](path/to/file)` or just plain text absolute paths.

## 2. Windows Path Handling
For Windows systems, always convert backslashes (`\`) to forward slashes (`/`) and prepend `file:///`.
- **Absolute Windows path**: `d:\dev\primetime\ui\kit\app\components\ui\text-field\index.vue`
- **Formatted URL**: `file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue`

## 3. Line Ranges and Code Symbols
When referencing specific code blocks, line numbers, or code structures, append the standard line anchor (`#L<start>-L<end>` or `#L<line>`).
- **Single Line Reference**: `[onFocus](file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue#L140)`
- **Line Range Reference**: `[index.vue:L100-120](file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue#L100-L120)`

## 4. Avoid Backtick Formatting inside Links
**CRITICAL**: Do NOT wrap the link text inside backticks. Surrounding the link text with backticks breaks standard clickable UI rendering in many Markdown visualizers.
- **Correct**: `[index.vue](file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue)`
- **Incorrect**: `[`index.vue`](file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue)`
- **Incorrect**: `[index.vue:L10-20](file:///d:/dev/primetime/ui/kit/app/components/ui/text-field/index.vue#L10-L20)`

## 5. Concise and Readable Link Text
Use short, meaningful link text (such as file basenames or symbol names) rather than long, absolute paths to keep responses elegant and concise.
- **Correct**: `[Playground.vue](file:///d:/dev/primetime/ui/docs/app/components/docs/component/text-field/Playground.vue)`
- **Incorrect**: `[d:\dev\primetime\ui\docs\app\components\docs\component\text-field\Playground.vue](file:///d:/dev/primetime/ui/docs/app/components/docs/component/text-field/Playground.vue)`
