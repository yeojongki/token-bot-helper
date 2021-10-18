import ERC20_ABI from '@/constants/erc20'
import { BUSD_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice } from '@/utils'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { utils } from 'ethers'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useBnxStore = defineStore({
  id: 'bnx',
  state: () => ({
    updateLoading: false,
    bnxPrice: 0,
    goldPrice: 0,
    bnxAddress: '0x8C851d1a123Ff703BD1f9dabe631b69902Df5f97',
    goldAddress: '0xb3a6381070B1a15169DEA646166EC0699fDAeA79',
    bnxBalance: 0,
    goldBalance: 0,
  }),
  actions: {
    /**
     * 更新 bnx gold 价格和余额
     */
    async updateBnxAndGold() {
      this.updateLoading = true
      try {
        await Promise.all([
          this.updateBnxPrice(),
          this.updateGoldPrice(),
          this.updateBnxAndGoldBalance(),
        ])
      } finally {
        this.updateLoading = false
      }
    },
    /**
     * 更新 bnx gold 余额
     */
    async updateBnxAndGoldBalance() {
      const { wallet, account } = useActiveProvider()
      const bnxContract = new Contract(this.bnxAddress, ERC20_ABI, wallet)
      const goldContract = new Contract(this.goldAddress, ERC20_ABI, wallet)

      const bnxBalancePromise = bnxContract
        .balanceOf(account)
        .then((result: BigNumber) => {
          this.bnxBalance = +utils.formatEther(result)
        })
        .catch((err: any) => {
          console.log(err)
        })

      const goldBalancePromise = goldContract
        .balanceOf(account)
        .then((result: BigNumber) => {
          this.goldBalance = +utils.formatEther(result)
        })
        .catch((err: any) => {
          console.log(err)
        })

      await Promise.all([bnxBalancePromise, goldBalancePromise])
    },
    /**
     * 更新 bnx 价格
     */
    updateBnxPrice() {
      return new Promise((resolve, reject) => {
        const { provider } = useActiveProvider()
        getTokenPrice(this.bnxAddress, BUSD_TOKEN.address, provider)
          .then((price) => {
            this.bnxPrice = price
            resolve(price)
          })
          .catch((err) => {
            console.log(err)
            reject(err)
          })
      })
    },
    /**
     * 更新 gold 价格
     */
    updateGoldPrice() {
      return new Promise((resolve, reject) => {
        const { provider } = useActiveProvider()
        getTokenPrice(this.goldAddress, BUSD_TOKEN.address, provider)
          .then((price) => {
            this.goldPrice = price
            resolve(price)
          })
          .catch((err) => {
            console.log(err)
            reject(err)
          })
      })
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useBnxStore, import.meta.hot))
}
