import { BUSD_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice } from '@/utils'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useBnxStore = defineStore({
  id: 'bnx',
  state: () => ({
    bnxPrice: 0,
    goldPrice: 0,
    bnxAddress: '0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97',
    goldAddress: '0xb3a6381070B1a15169DEA646166EC0699fDAeA79',
  }),
  actions: {
    updateBnxAndGoldPrice() {
      this.updateBnxPrice()
      this.updateGoldPrice()
    },
    updateBnxPrice() {
      const { provider } = useActiveProvider()
      getTokenPrice(BUSD_TOKEN.address, this.bnxAddress, provider)
        .then((price) => {
          this.bnxPrice = price
        })
        .catch((err) => {
          console.log(err)
        })
    },
    updateGoldPrice() {
      const { provider } = useActiveProvider()
      getTokenPrice(BUSD_TOKEN.address, this.goldAddress, provider)
        .then((price) => {
          this.goldPrice = price
        })
        .catch((err) => {
          console.log(err)
        })
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useBnxStore, import.meta.hot))
}
