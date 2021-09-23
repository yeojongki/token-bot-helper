import { WETHTokenAddress } from '@/constants'
import { USDT_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice } from '@/utils'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useTokenListStore = defineStore({
  id: 'tokenList',
  state: () => ({
    ethPrice: 400,
    loading: false,
  }),
  actions: {
    async updateEthPrice() {
      const { provider } = useActiveProvider()

      try {
        this.loading = true
        const price = await getTokenPrice(
          WETHTokenAddress,
          USDT_TOKEN.address,
          provider,
          this.ethPrice,
        )

        this.ethPrice = price
      } catch (error) {
        console.error('update eth price error', error)
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useTokenListStore, import.meta.hot))
}
