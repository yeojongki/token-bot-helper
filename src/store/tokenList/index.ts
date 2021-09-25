import ERC20_ABI from '@/constants/erc20'
import { useActiveProvider } from '@/hooks/useActiveProvider'
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
  actions: {
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
