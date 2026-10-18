<template>
  <section class="fixture-stress">
    <h1>MTimePicker — stress content</h1>

    <div
      v-for="width in [280, 360, 600]"
      :key="width"
      class="fixture-stress__box"
      :style="{ width: `min(${width}rem, 100%)` }"
    >
      <h2>{{ width }}</h2>
      <MTimePicker
        v-model="byWidth[width]"
        layout="horizontal"
        hour-cycle="h12"
        label="Choose when the weekly report is sent to everyone on the team"
        :data-test="`width-${width}`"
      />
    </div>

    <div class="fixture-stress__box">
      <h2>cycle on the fly</h2>
      <MButton
        variant="outlined"
        data-test="toggle-cycle"
        @click="cycle = cycle === 'h23' ? 'h12' : 'h23'"
      >
        {{ cycle }}
      </MButton>
      <MTimePicker
        v-model="flying"
        :hour-cycle="cycle"
        data-test="cycle"
      />
      <output data-test="cycle-value">{{ flying }}</output>
    </div>

    <MTimePicker
      v-model="unreadable"
      data-test="unreadable"
    />

    <MTimePicker
      v-model="arabic"
      locale="ar-EG"
      hour-cycle="auto"
      label="اختر الوقت"
      data-test="arabic"
    />

    <MTimePicker
      v-model="korean"
      locale="ko-KR"
      hour-cycle="h12"
      mode="input"
      label="시간 입력"
      hour-label="시"
      minute-label="분"
      data-test="korean"
    />
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import MButton from '#kit/components/ui/button/index.vue'
import MTimePicker from '#kit/components/ui/time-picker/index.vue'

const byWidth = reactive<Record<number, string>>({ 280: '07:30', 360: '13:15', 600: '23:55' })
const cycle = ref<'h12' | 'h23'>('h23')
const flying = ref('00:30')
const unreadable = ref('25:99')
const arabic = ref('20:10')
const korean = ref('15:40')
</script>

<style lang="scss">
.fixture-stress {
  display: grid;
  justify-items: start;
  gap: 24rem;

  &__box {
    display: grid;
    gap: 8rem;
    max-width: 100%;
  }
}
</style>
