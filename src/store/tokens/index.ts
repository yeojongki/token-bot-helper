import { WETHTokenAddress } from '@/constants'
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

export class TokenWithPrice extends Token {
  sort?: number
  price?: string | number = 0
  skipWatch?: boolean = false
  constructor(
    chainId: ChainId,
    address: string,
    decimals: number,
    symbol?: string,
    name?: string,
    price?: string,
    projectLink?: string,
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
  }
}

export const useTokensStore = defineStore({
  id: 'tokens',
  state: () => ({
    ethPrice: 432,
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
          USDT_TOKEN.address,
          WETHTokenAddress,
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

        const tokenContract = new Contract(address, ERC20_ABI, provider)
        const [decimals, symbol, name] = await Promise.all([
          await tokenContract.decimals(),
          await tokenContract.symbol(),
          await tokenContract.name(),
        ])

        return new Token(chainId, address, decimals, symbol, name)
      } catch (error) {}
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
            ({ chainId, address, name, skipWatch }) => {
              if (
                address === WBNB_TOKEN.address ||
                address === USDT_TOKEN.address ||
                address === BUSD_TOKEN.address
              ) {
                // userStore.updateAddedToken(address, 6.4)
              } else {
                // 跳过不需要关注的 token
                if (provider && !skipWatch) {
                  getTokenPrice(address, WBNB_TOKEN.address, provider)
                    .then((price) => {
                      userStore.updateAddedTokenPrice({
                        chainId,
                        address,
                        price,
                      })
                    })
                    .catch((err) => {
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

const aaaaa = {
  '56': {
    '0x12BB890508c125661E03b09EC06E404bc9289040': {
      decimals: 18,
      symbol: 'RACA',
      name: 'Radio Caca V2',
      chainId: 56,
      address: '0x12BB890508c125661E03b09EC06E404bc9289040',
      price: 511772,
      skipWatch: false,
    },
    '0x01E0d17a533E5930A349C2BB71304F04F20AB12B': {
      decimals: 18,
      symbol: 'RPG',
      name: 'REVOLVE_GAMES',
      chainId: 56,
      address: '0x01E0d17a533E5930A349C2BB71304F04F20AB12B',
      price: 989.206,
      skipWatch: true,
    },
    '0x339C72829AB7DD45C3C52f965E7ABe358dd8761E': {
      decimals: 18,
      symbol: 'WANA',
      name: 'Wanaka Farm',
      chainId: 56,
      address: '0x339C72829AB7DD45C3C52f965E7ABe358dd8761E',
      price: 141.489,
      skipWatch: true,
    },
    '0x53E562b9B7E5E94b81f10e96Ee70Ad06df3D2657': {
      decimals: 18,
      symbol: 'BABY',
      name: 'BabySwap Token',
      chainId: 56,
      address: '0x53E562b9B7E5E94b81f10e96Ee70Ad06df3D2657',
      price: 614.879,
      skipWatch: true,
    },
    '0x2e121Ed64EEEB58788dDb204627cCB7C7c59884c': {
      decimals: 18,
      symbol: 'SPHYNX',
      name: 'Sphynx Token',
      chainId: 56,
      address: '0x2e121Ed64EEEB58788dDb204627cCB7C7c59884c',
      skipWatch: true,
      price: 36266.4,
    },
    '0xdCe6380B9D2D8beAC66B0fba2604c51519d24d77': {
      decimals: 18,
      symbol: 'ADAT',
      name: 'Adadex Tools',
      chainId: 56,
      address: '0xdCe6380B9D2D8beAC66B0fba2604c51519d24d77',
      price: 13498.8,
      skipWatch: false,
    },
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': {
      decimals: 18,
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      chainId: 56,
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    },
  },
}
