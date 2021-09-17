import { WETHTokenAddress } from '@/constants'
import { USDT_TOKEN } from '@/constants/tokens'
import { getTokenPrice } from '@/utils'
import { useActiveProvider } from './useActiveProvider'
import { useRef } from './useRef'

export function useBNBPrice() {
  const { provider } = useActiveProvider()
  // 初始化 WETH(WBNB) 价格
  const [loading, setLoading] = useRef(false)
  const [WETH_PRICE, SET_WETH_PRICE] = useRef(400)
  const updateWBNBPrice = async () => {
    try {
      setLoading(true)
      const price = await getTokenPrice(
        WETHTokenAddress,
        USDT_TOKEN.address,
        provider,
        WETH_PRICE.value,
      )

      SET_WETH_PRICE(price)
    } catch (error) {
      console.error('update eth price error', error)
    } finally {
      setLoading(false)
    }
  }

  return [loading, WETH_PRICE, updateWBNBPrice] as const
}
