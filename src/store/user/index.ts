import { defineStore, acceptHMRUpdate } from 'pinia'
import { ChainId } from '@pancakeswap/sdk'
import { WBNB_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { TokenWithPrice } from '../tokenList'
import { getFromStorage, setToStorage } from '@/utils/storage'

export interface TokenPriceMap {
  [chainId: number]: {
    [address: string]: TokenWithPrice
  }
}

const currentTimestamp = () => new Date().getTime()

const namespace = 'user'

export const useUserStore = defineStore({
  id: namespace,
  state: () => ({
    timestamp: currentTimestamp(),
    tokens: {
      [ChainId.MAINNET as number]: getFromStorage<TokenPriceMap>(
        namespace,
        'tokens',
      )?.[ChainId.MAINNET] ?? {
        [WBNB_TOKEN.address]: {
          chainId: WBNB_TOKEN.chainId,
          decimals: WBNB_TOKEN.decimals,
          address: WBNB_TOKEN.address,
          symbol: WBNB_TOKEN.symbol,
          name: WBNB_TOKEN.name,
          price: '',
        },
      },
    } as TokenPriceMap,
  }),
  getters: {
    userAddedTokens: (state) => {
      const { chainId } = useActiveProvider()
      if (!chainId) return []
      return Object.values(state.tokens?.[chainId] ?? {})
    },
  },
  actions: {
    addToken(token: TokenWithPrice) {
      if (!this.tokens) {
        this.tokens = {}
      }

      this.tokens[token.chainId] = this.tokens[token.chainId] || {}

      if (!this.tokens[token.chainId][token.address]) {
        this.tokens[token.chainId][token.address] = token

        setToStorage(namespace, 'tokens', this.tokens)
        this.timestamp = currentTimestamp()
      }
    },
    removeAddedToken({
      address,
      chainId,
    }: {
      address: string
      chainId: ChainId
    }) {
      if (!this.tokens) {
        this.tokens = {}
      }
      this.tokens[chainId] = this.tokens[chainId] || {}
      delete this.tokens[chainId][address]

      setToStorage(namespace, 'tokens', this.tokens)
      this.timestamp = currentTimestamp()
    },
    updateAddedTokenPrice({
      chainId,
      address,
      price,
    }: {
      chainId: ChainId
      address: string
      price: string | number
    }) {
      this.tokens[chainId] = this.tokens[chainId] || {}
      if (this.tokens[chainId][address]) {
        this.tokens[chainId][address].price = price
        this.timestamp = currentTimestamp()
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
