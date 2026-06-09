<template>
  <div class="demo-grid">
    <h2 class="demo-grid__title">
      Дефолтная сетка: 4 / 8 / 12 колонок, span относительный
    </h2>
    <m-container>
      <m-col
        v-for="n in 12"
        :key="`a-${n}`"
        cols="1"
      >
        <div class="demo-grid__box">
          1
        </div>
      </m-col>
      <m-col
        v-for="n in 6"
        :key="`b-${n}`"
        cols="2"
      >
        <div class="demo-grid__box">
          2
        </div>
      </m-col>
    </m-container>

    <h2 class="demo-grid__title">
      Three-column (wf): на мобилке столбиком, desktop 2 / 8 / 2
    </h2>
    <m-container>
      <m-col desktop-xs="2">
        <div class="demo-grid__box demo-grid__box--tall">
          aside
        </div>
      </m-col>
      <m-col desktop-xs="8">
        <div class="demo-grid__box demo-grid__box--tall">
          main
        </div>
      </m-col>
      <m-col desktop-xs="2">
        <div class="demo-grid__box demo-grid__box--tall">
          aside
        </div>
      </m-col>
    </m-container>

    <h2 class="demo-grid__title">
      Offset через grid-column-start (+ сброс offset-desktop-xs="0")
    </h2>
    <m-container>
      <m-col
        cols="2"
        offset="1"
        offset-desktop-xs="0"
      >
        <div class="demo-grid__box">
          offset 1 → 0
        </div>
      </m-col>
      <m-col
        cols="1"
        desktop-xs="4"
        offset-desktop-xs="4"
      >
        <div class="demo-grid__box">
          offset-desktop 4
        </div>
      </m-col>
    </m-container>

    <h2 class="demo-grid__title">
      m-row (subgrid) + align="center" + no-gutters
    </h2>
    <m-container>
      <m-row align="center">
        <m-col cols="1">
          <div class="demo-grid__box demo-grid__box--tall">
            tall
          </div>
        </m-col>
        <m-col cols="2">
          <div class="demo-grid__box">
            centered
          </div>
        </m-col>
      </m-row>
      <m-row no-gutters>
        <m-col
          v-for="n in 4"
          :key="`c-${n}`"
          cols="1"
        >
          <div class="demo-grid__box">
            no-gutters
          </div>
        </m-col>
      </m-row>
    </m-container>

    <h2 class="demo-grid__title">
      Кастомное число колонок (:cols="2" :cols-desktop-xs="6") + m-responsive 16/9
    </h2>
    <m-container
      :cols="2"
      :cols-desktop-xs="6"
    >
      <m-col
        v-for="n in 6"
        :key="`d-${n}`"
        cols="1"
      >
        <m-responsive aspect-ratio="16 / 9">
          <div class="demo-grid__box demo-grid__box--fill">
            16 / 9
          </div>
        </m-responsive>
      </m-col>
    </m-container>
  </div>
</template>

<script setup lang="ts">
// Песочница колоночной системы (фаза D auto-layout) — рендерится в default-лейауте
</script>

<style lang="scss">
.demo-grid {
  padding-block: 24rem;

  &__title {
    margin-block: 32rem 16rem;
    padding-inline: 24rem;
    color: var(--md-sys-color-on-surface);

    @include typescale('');
  }

  &__box {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56rem;
    border-radius: 12rem;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
  }

  &__box--tall {
    min-height: 160rem;
  }

  &__box--fill {
    position: absolute;
    inset: 0;
    min-height: 0;
  }
}
</style>
