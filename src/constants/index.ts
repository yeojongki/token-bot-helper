import { ChainId, JSBI, Percent, WETH } from '@pancakeswap/sdk'

export const defaultRpc = 'https://bsc-dataseed.binance.org'

export const AddressZero = '0x0000000000000000000000000000000000000000'

export const ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

/**
 * 池子类型
 */
export const enum PoolType {
  UNKNOWN = '',
  BNB = 'BNB',
  BUSD = 'BUSD',
  USDT = 'USDT',
}

/**
 * WETH (WBNB) token 地址
 */
export const WETHTokenAddress = WETH[ChainId.MAINNET].address

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(
  JSBI.BigInt(50),
  JSBI.BigInt(10000),
)

/**
 * 交易队列最大交易数
 */
export const TX_QUEUE_MAXIMUM = 64
