<template>
  <!-- MMenu ships no item component: its source names `ui-menu__item` as the
       markup consumers put inside it, and it promotes buttons to menu items. -->
  <button
    type="button"
    class="ui-menu__item"
  >
    <span class="ui-menu__item-label"><slot /></span>
    <span
      v-if="$slots.trailing"
      class="ui-menu__item-shortcut"
    ><slot name="trailing" /></span>
  </button>
</template>
