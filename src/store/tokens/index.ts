import { PoolType } from '@/constants'
import ERC20_ABI from '@/constants/erc20'
import { BUSD_TOKEN, USDT_TOKEN, WBNB_TOKEN } from '@/constants/tokens'
import { useActiveProvider } from '@/hooks/useActiveProvider'
import { getTokenPrice, withPoll } from '@/utils'
import { Contract } from '@ethersproject/contracts'
import { ChainId, Token } from '@pancakeswap/sdk'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useUserStore } from '../user'

/**
 * 当值不为 undefined 时, 结束拉取数据
 */
export type PollingTokenReturn = undefined | boolean

/**
 * 池子类型
 */
export type TokenPoolType = '' | 'BNB' | 'BUSD' | 'USDT'

export class TokenWithPrice extends Token {
  sort?: number
  price?: string | number = 0
  skipWatch?: boolean = false
  poolType?: TokenPoolType

  constructor(
    chainId: ChainId,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string,
    price?: string,
    projectLink?: string,
    /**
     * 池子类型
     */
    poolType?: TokenPoolType,
    /**
     * 在观察 token 列表中是否跳过更新价格
     */
    skipWatch?: boolean,
    /**
     * 排序 越小越前
     */
    sort?: number,
  ) {
    super(chainId, address, decimals, symbol, name, projectLink)
    this.price = price
    this.skipWatch = skipWatch
    this.sort = sort
    this.poolType = poolType
  }
}

/**
 * 观察 tokens 列表
 */
export const useTokensStore = defineStore({
  id: 'tokens',
  state: () => ({
    ethPrice: 600,
    loading: false,
    /**
     * 是否在
     */
    pollingReturn: undefined,
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
          PoolType.USDT,
          WBNB_TOKEN.address,
          provider,
        )

        this.ethPrice = price
      } catch (error) {
        console.error('update eth price error', error)
      } finally {
        this.loading = false
      }
    },
    /**
     * 获取 token decimal/symbol/name
     * @param address
     * @returns
     */
    async getTokenDetail(address: string) {
      try {
        const { provider, chainId } = useActiveProvider()
        const userStore = useUserStore()

        // 取缓存中的
        let runtimeToken = userStore.tokens[ChainId.MAINNET][address]
        if (runtimeToken) return runtimeToken

        const tokenContract = new Contract(address, ERC20_ABI, provider)

        const [decimals, symbol, name] = await Promise.all([
          await tokenContract.decimals(),
          await tokenContract.symbol(),
          await tokenContract.name(),
        ])

        return new Token(chainId, address, decimals, symbol, name)
      } catch (error) {
        console.error('get token detail error', error)
      }
    },
    /**
     * 更新观察的 token 列表价格
     */
    async pollWatchListPrice(interval = 1000) {
      const userStore = useUserStore()
      const { provider } = useActiveProvider()
      await withPoll(
        async () => {
          userStore.userAddedTokens.forEach(
            ({ chainId, address, poolType, skipWatch }) => {
              if (
                // address === WBNB_TOKEN.address ||
                address === USDT_TOKEN.address ||
                address === BUSD_TOKEN.address
              ) {
                // userStore.updateAddedToken(address, 6.4)
              } else {
                // 跳过不需要关注的 token
                if (!skipWatch) {
                  getTokenPrice(poolType || PoolType.UNKNOWN, address, provider)
                    .then(price => {
                      userStore.updateAddedTokenPrice({
                        chainId,
                        address,
                        price,
                      })
                    })
                    .catch(err => {
                      console.log(err)
                    })
                }
              }
            },
          )
          return this.pollingReturn
        },
        { interval },
      )
    },
  },
})

if (import.meta.hot) {
  import.meta.hot!.accept(acceptHMRUpdate(useTokensStore, import.meta.hot))
}
