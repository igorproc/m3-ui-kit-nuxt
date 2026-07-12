# Reuse map: новые возможности → существующий kit

Все ссылки ниже обязательны для `<reuse>` соответствующего плана.

| Новая возможность | Переиспользовать | Не создавать заново |
|---|---|---|
| Autocomplete / Combobox | `MTextField` field surface, `MMenu` overlay positioning, `MDropdown` listbox keyboard/context, `createSingle`/`createGroup` | второй field, menu, selection registry |
| ColorInput | `MTextField`, `MOverlay` после его появления, `MButtonIcon` | собственный dialog/menu stack |
| FileInput / FileUpload | `MTextField` chrome, `MButton`, `MIcon`, `MProgressLinear`, `useDrag`, `useStack` | file input field styles, raw pointer listeners |
| ChipGroup | `useSelectionGroup`, dedicated chip context, existing `MChip`; overflow uses wrap/native scroll until low-priority SlideGroup is promoted | second selection registry, generic-context auto-registration, index model, visual symbol leaf |
| useVirtualScroll / Lazy | `useSSRWindowSize`, `useEventListener`, `useRaf`; lazy additionally uses observer/idle utilities | loader/fetch state, wrapper/item components, independent scroll loops, per-item listeners |
| Timeline / Breadcrumbs / Banner / Alert | `MSurface`, `MButton`, `MIcon` | raw colors, shapes and action controls |
| Rating | selection utility, `MIcon` | per-icon store/listeners |
| OTP | `MTextField` validation conventions, `createContext` | array model and ad-hoc focus graph |
| Form/validation utilities | `useField`, `useFormSchema`, VeeValidate integration | second validation engine |
| Overlay consumers | `useStack`, `useModal`, `MOverlay` | parallel z-index, focus restore and scroll lock |

Existing families documented in `components-should-update/` must be extended
in place instead of introducing a same-purpose public alias.
