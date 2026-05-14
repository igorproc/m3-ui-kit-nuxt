<template>
  <m-layout class="layout-youtube">
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="sidebar" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>
  </m-layout>
</template>
