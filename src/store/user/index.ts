import { defineStore, acceptHMRUpdate } from 'pinia'
import { ChainId } from '@pancakeswap/sdk'
import { WBNB_TOKEN } from '@/constants/tokens'
import { TokenPoolType, TokenWithPrice } from '../tokens'
import { getFromStorage, setToStorage } from '@/utils/storage'
import { providers, Wallet } from 'ethers'
import { message } from 'ant-design-vue'
import request from '@/utils/request'
import { defaultRpc } from '@/constants'
import { userNamespace as namespace } from '@/constants/namespace'
import { usePrivateKey } from '@/hooks/usePrivateKey'
import { PRIVATEKEY_KEY } from '@/constants/storageKey'

export interface TokenPriceMap {
  [chainId: number]: {
    [address: string]: TokenWithPrice
  }
}

export interface TokenSortEvent {
  moved: {
    element: TokenWithPrice
    newIndex: number
    oldIndex: number
  }
}

const TOKENS_KEY = 'tokens'

// const currentTimestamp = () => new Date().getTime()

let provider = new providers.JsonRpcProvider(defaultRpc)
let wallet = null as Wallet | null

export const useUserStore = defineStore({
  id: namespace,
  state: () => ({
    chainId: ChainId.MAINNET,
    // timestamp: currentTimestamp(),
    /**
     * 私钥
     */
    privateKey: usePrivateKey(),
    /**
     * 当前节点
     */
    rpc: defaultRpc,
    /**
     * 节点列表
     */
    rpcList: [
      // import.meta.env.VITE_RPC_NODE,
      defaultRpc,
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed1.ninicoin.io',
    ],
    /**
     * 添加的 token
     */
    tokens: {
      [ChainId.MAINNET as number]: getFromStorage<TokenPriceMap>(
        namespace,
        TOKENS_KEY,
      )?.[ChainId.MAINNET] ?? {
        [WBNB_TOKEN.address]: {
          chainId: WBNB_TOKEN.chainId,
          decimals: WBNB_TOKEN.decimals,
          address: WBNB_TOKEN.address,
          symbol: WBNB_TOKEN.symbol,
          name: WBNB_TOKEN.name,
          skipWatch: false,
          price: '',
        },
      },
    } as TokenPriceMap,
  }),
  getters: {
    userAddedTokens: state => {
      const chainId = state.chainId
      if (!chainId) return []
      return Object.values(state.tokens?.[chainId] ?? {}).sort(
        (a, b) => a.sort! - b.sort!,
      )
    },
  },
  actions: {
    /**
     * 设置当前节点
     * @param rpc
     */
    async setCurrentRpc(rpc: string) {
      this.rpc = rpc
      provider = rpc.startsWith('wss')
        ? new providers.WebSocketProvider(rpc)
        : new providers.JsonRpcProvider(rpc)
    },
    /**
     * 测试节点延迟
     * @param rpc
     */
    async testRpcDelay(rpc: string) {
      const start = +new Date()
      await request(rpc, {
        method: 'eth_chainId',
        params: [],
        jsonrpc: '2.0',
      })
      message.success(`当前节点延迟: ${+new Date() - start}ms`)
    },
    /**
     * 设置私钥
     * @param privateKey
     */
    setPrivateKey(privateKey: string) {
      this.privateKey = privateKey
      setToStorage(namespace, PRIVATEKEY_KEY, privateKey)
    },
    /**
     * 将当前 token 储存到 localStorage 中
     */
    setTokensToStorage() {
      setToStorage(namespace, 'tokens', this.tokens)
    },
    /**
     * 增加 token 到用户 token 列表中
     * @param token
     */
    addToken(token: TokenWithPrice, tokenPoolType: TokenPoolType = '') {
      if (!this.tokens[token.chainId][token.address]) {
        // 设置排序
        token.sort = this.userAddedTokens.length
        // 设置池子类型
        token.poolType = tokenPoolType
        this.tokens[token.chainId][token.address] = token

        this.setTokensToStorage()
      }
    },
    /**
     * 移除用户 token 列表中的代币
     * @param param0
     */
    removeAddedToken({
      address,
      chainId,
    }: {
      address: string
      chainId: ChainId
    }) {
      delete this.tokens[chainId][address]

      this.setTokensToStorage()
    },
    /**
     * 切换跳过观察 token
     * @param param0
     */
    toggleSkipWatchToken({
      address,
      chainId,
    }: {
      address: string
      chainId: ChainId
    }) {
      this.tokens[chainId][address].skipWatch =
        !this.tokens[chainId][address].skipWatch

      this.setTokensToStorage()
    },
    /**
     * 更新用户 token 列表中的数据
     * @param param0
     */
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
      }
    },
    /**
     * token 排序
     * @param param0
     */
    handleTokenSort({ moved: { newIndex, oldIndex } }: TokenSortEvent) {
      const { address: oldAddress, sort: oldSort } =
        this.userAddedTokens[oldIndex]
      const { address: newAddress, sort: newSort } =
        this.userAddedTokens[newIndex]
      this.tokens[ChainId.MAINNET][oldAddress].sort = newSort
      this.tokens[ChainId.MAINNET][newAddress].sort = oldSort

      this.setTokensToStorage()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
