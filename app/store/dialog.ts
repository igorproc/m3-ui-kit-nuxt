import { useModal, useVfm } from 'vue-final-modal'
import { skipHydrate } from 'pinia'

export const useDialogStore = defineStore('dialogStore', () => {
  if (import.meta.server) {
    return {
      modal: null,
    }
  }

  const modals = useVfm()

  // Basic dialog (no icon)
  const basic = useModal({
    component: defineAsyncComponent(() => import('~/components/dialog/basic.vue')),
    defaultModelValue: false,
  })

  // Demo Dialog (with icon/actions)
  const demo = useModal({
    component: defineAsyncComponent(() => import('~/components/dialog/demo.vue')),
    defaultModelValue: false,
  })

  const router = useRouter()
  watch(router.currentRoute, async (value, oldValue) => {
    if (value.fullPath !== oldValue.fullPath) {
      await modals.closeAll()
    }
  })

  return {
    modal: skipHydrate({
      basic,
      demo,
    }),
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogStore, import.meta.hot))
}
