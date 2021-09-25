import { WETHTokenAddress } from '@/constants'
import { USDT_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice } from '@/utils'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const usePriceStore = defineStore({
  id: 'price',
  state: () => ({
    ethPrice: 350,
    loading: false,
  }),
  actions: {
    /**
     * 更新主币价格 (BNB)
     */
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
  import.meta.hot!.accept(acceptHMRUpdate(usePriceStore, import.meta.hot))
}
