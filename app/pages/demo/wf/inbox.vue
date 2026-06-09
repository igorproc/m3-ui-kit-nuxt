<template>
  <m-layout class="wf-inbox">
    <m-system-bar>
      <m-spacer />

      <m-icon :name="ICONS.widgets" />

      <m-icon :name="ICONS.playCircle" />

      <m-icon :name="ICONS.arrowDropUp" />
    </m-system-bar>

    <m-layout-aside
      class="wf-inbox__drawer"
      position="start"
      sticky
      size-token="256rem"
    >
      <div class="wf-inbox__profile">
        <div class="wf-inbox__avatar wf-inbox__avatar--large" />

        <div class="wf-inbox__email">
          john@google.com
        </div>
      </div>

      <m-divider />

      <m-list>
        <m-list-item
          v-for="link in links"
          :key="link.text"
          :headline="link.text"
          :leading-icon="link.icon"
          interactive
        />
      </m-list>
    </m-layout-aside>

    <m-layout-main class="wf-inbox__main">
      <m-container
        class="wf-inbox__container"
        fluid
      >
        <m-col
          v-for="card in cards"
          :key="card"
        >
          <m-card
            class="wf-inbox__card"
            variant="elevated"
          >
            <m-list>
              <div class="wf-inbox__subheader">
                {{ card }}
              </div>

              <template
                v-for="n in 6"
                :key="n"
              >
                <m-list-item
                  :headline="`Message ${n}`"
                  supporting-text="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil repellendus distinctio similique"
                  :lines="2"
                >
                  <template #leading>
                    <div class="wf-inbox__avatar" />
                  </template>
                </m-list-item>

                <m-divider
                  v-if="n !== 6"
                  variant="inset"
                />
              </template>
            </m-list>
          </m-card>
        </m-col>
      </m-container>
    </m-layout-main>
  </m-layout>
</template>

<script setup lang="ts">
import { ICONS } from '~~/shared/constants/icons'

definePageMeta({ layout: false })

const cards = ['Today', 'Yesterday']

const links = [
  { icon: ICONS.download, text: 'Inbox' },
  { icon: ICONS.email, text: 'Send' },
  { icon: ICONS.close, text: 'Trash' },
  { icon: ICONS.security, text: 'Spam' },
]
</script>

<style lang="scss">
.wf-inbox {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);

  &__drawer {
    background-color: var(--md-sys-color-surface-container);
  }

  &__profile {
    padding: 16rem;
    background-color: var(--md-sys-color-surface-container-high);
  }

  &__avatar {
    width: 40rem;
    height: 40rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-outline);

    &--large {
      width: 64rem;
      height: 64rem;
      margin-block-end: 16rem;
    }
  }

  &__email {
    font-size: 14rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__main {
    background-color: var(--md-sys-color-surface);
  }

  &__container {
    padding-block: 32rem;
    padding-inline: 24rem;
  }

  &__card {
    padding: 0;
  }

  &__subheader {
    display: flex;
    align-items: center;
    min-height: 48rem;
    padding-inline: 16rem;
    font-size: 14rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
