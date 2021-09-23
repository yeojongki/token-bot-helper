import { WBNB_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { ChainId } from '@pancakeswap/sdk'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { deserializeToken } from './utils'

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
}

const currentTimestamp = () => new Date().getTime()

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    timestamp: currentTimestamp(),
    tokens: {
      [ChainId.MAINNET as number]: {
        [WBNB_TOKEN.address]: {
          chainId: WBNB_TOKEN.chainId,
          decimals: WBNB_TOKEN.decimals,
          address: WBNB_TOKEN.address,
          symbol: WBNB_TOKEN.symbol,
          name: WBNB_TOKEN.name,
        },
      },
    } as {
      [chainId: number]: {
        [address: string]: SerializedToken
      }
    },
  }),
  getters: {
    userAddedTokens(state) {
      const { chainId } = useActiveProvider()
      if (!chainId) return []
      return Object.values(state.tokens?.[chainId] ?? {}).map(deserializeToken)
    },
  },
  actions: {
    addSerializedToken({
      serializedToken,
    }: {
      serializedToken: SerializedToken
    }) {
      if (!this.tokens) {
        this.tokens = {}
      }

      this.tokens[serializedToken.chainId] =
        this.tokens[serializedToken.chainId] || {}
      this.tokens[serializedToken.chainId][serializedToken.address] =
        serializedToken
      this.timestamp = currentTimestamp()
    },
    removeSerializedToken({
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
      this.timestamp = currentTimestamp()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
