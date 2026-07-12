# MTextField composition updates

<identity>Existing `MTextField` · Consumers: MFileInput, MDropdown, MAutocomplete, MColorInput, MTextarea/NumberInput where applicable</identity>

<problem>Field wrappers вынуждены копировать props/value presentation, потому что current props не factory и native input content нельзя заменить стабильным slot.</problem>

<solution>
- создать `makeMTextFieldProps()` через existing `propsFactory`, сохранив `mTextFieldProps`;
- добавить typed `#value` slot вокруг input/value region с safe native input default;
- сохранить prepend/append/helper/error semantics;
- не превращать MTextField в headless MField и не ломать string model default.
</solution>

<value-slot>
Slot получает id, model/display, native/input props, focus/error/disabled states и handlers. Wrappers могут показать readonly non-string content, но обязаны сохранить field label/describedby semantics. Default rendering остаётся текущим `<input>`.
</value-slot>

<reuse>Existing MTextField template, `useTextField`, token map and prop utilities. Это extraction/composition update, не redesign.</reuse>

<tests>Regression existing API/styles; factory overrides/types; default native input; custom value slot label/focus/ARIA; wrapper examples FileInput/Dropdown.</tests>

<done>Field wrappers используют MTextField напрямую и не копируют его public props/chrome.</done>
