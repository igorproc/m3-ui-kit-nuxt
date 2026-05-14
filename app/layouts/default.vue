<template>
  <m-layout class="layout-default">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="aside-left" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <slot name="footer" />
    </m-layout-footer>
  </m-layout>
</template>
