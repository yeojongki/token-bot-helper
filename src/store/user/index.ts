import { defineStore, acceptHMRUpdate } from 'pinia'
import { ChainId } from '@pancakeswap/sdk'
import { WBNB_TOKEN } from '@/constants/tokens'
import { TokenWithPrice } from '../tokens'
import { getFromStorage, setToStorage } from '@/utils/storage'
import { providers, Wallet } from 'ethers'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

export interface TokenPriceMap {
  [chainId: number]: {
    [address: string]: TokenWithPrice
  }
}

const currentTimestamp = () => new Date().getTime()

const namespace = 'user'
const defaultRpc = 'https://bsc-dataseed1.defibit.io'

let provider = new providers.JsonRpcProvider(defaultRpc)
let wallet = null as Wallet | null

export const useUserStore = defineStore({
  id: namespace,
  state: () => ({
    chainId: ChainId.MAINNET,
    timestamp: currentTimestamp(),
    /**
     * 私钥
     */
    privateKey:
      process.env.NODE_ENV === 'production'
        ? ''
        : import.meta.env.VITE_PRIVATE_KEY,
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
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed1.ninicoin.io',
    ],
    /**
     * 添加的 token
     */
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
          skipWatch: false,
          price: '',
        },
      },
    } as TokenPriceMap,
  }),
  getters: {
    userAddedTokens: (state) => {
      const chainId = state.chainId
      if (!chainId) return []
      return Object.values(state.tokens?.[chainId] ?? {})
    },
    activeProvider: () => ({
      chainId: ChainId.MAINNET,
      account: import.meta.env.VITE_WALLET_ADDRESS,
      provider,
      wallet,
    }),
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
      ElMessage.success(`当前节点延迟: ${+new Date() - start}ms`)
    },
    /**
     * 设置私钥
     * @param privateKey
     */
    setPrivateKey(privateKey: string) {
      this.privateKey = privateKey
    },
    /**
     * 增加 token 到用户 token 列表中
     * @param token
     */
    addToken(token: TokenWithPrice) {
      if (!this.tokens[token.chainId][token.address]) {
        this.tokens[token.chainId][token.address] = token

        setToStorage(namespace, 'tokens', this.tokens)
        this.timestamp = currentTimestamp()
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

      setToStorage(namespace, 'tokens', this.tokens)
      this.timestamp = currentTimestamp()
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
      setToStorage(namespace, 'tokens', this.tokens)
      this.timestamp = currentTimestamp()
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
        this.timestamp = currentTimestamp()
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
