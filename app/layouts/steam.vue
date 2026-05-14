<template>
  <m-layout
    full-height
    class="layout-steam"
  >
    <m-layout-header>
      <slot name="header" />
    </m-layout-header>

    <m-layout-aside position="left">
      <slot name="sidebar" />
    </m-layout-aside>

    <m-layout-main>
      <slot />
    </m-layout-main>

    <m-layout-aside position="right">
      <slot name="friends" />
    </m-layout-aside>
  </m-layout>
</template>
