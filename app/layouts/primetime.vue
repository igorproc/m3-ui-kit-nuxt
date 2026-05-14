<template>
  <m-layout class="layout-primetime">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-footer>
      <slot name="footer" />
    </m-layout-footer>
  </m-layout>
</template>
