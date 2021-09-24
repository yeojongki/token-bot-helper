import { WETHTokenAddress } from '@/constants'
import ERC20_ABI from '@/constants/erc20'
import { USDT_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice } from '@/utils'
import { Contract } from '@ethersproject/contracts'
import { ChainId, Token } from '@pancakeswap/sdk'
import { defineStore, acceptHMRUpdate } from 'pinia'

export class TokenWithPrice extends Token {
  price?: string | number
  constructor(
    chainId: ChainId,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string,
    price?: string,
    projectLink?: string,
  ) {
    super(chainId, address, decimals, symbol, name, projectLink)
    this.price = price
  }
}

export const useTokenListStore = defineStore({
  id: 'tokenList',
  state: () => ({
    ethPrice: 400,
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
    async getTokenDetail(address: string) {
      try {
        const { provider, chainId } = useActiveProvider()
        const tokenContract = new Contract(address, ERC20_ABI, provider)
        const [decimals, symbol, name] = await Promise.all([
          await tokenContract.decimals(),
          await tokenContract.symbol(),
          await tokenContract.name(),
        ])
        return new Token(chainId, address, decimals, symbol, name)
      } catch (error) {}
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useTokenListStore, import.meta.hot))
}
