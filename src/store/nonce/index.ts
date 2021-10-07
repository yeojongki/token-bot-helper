import { useActiveProvider } from '@/hooks/useActiveProvider'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useNonceStore = defineStore({
  id: 'nonce',
  state: () => ({
    nonce: 0,
  }),
  actions: {
    /**
     * 从链上更新当前最新 nonce
     */
    async updateLatestNonce() {
      const { wallet } = useActiveProvider()
      const nonce = await wallet.getTransactionCount('pending')
      this.setNonce(nonce)
    },
    /**
     * 设置当前 nonce
     * @param nonce
     */
    setNonce(nonce: number) {
      this.nonce = nonce
    },
    /**
     * 设置当前 nonce + 1
     * @param nonce
     */
    plusNonce() {
      this.nonce += 1
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useNonceStore, import.meta.hot))
}
