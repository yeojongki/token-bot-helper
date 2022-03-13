import {
  AddressZero,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  PoolType,
  WETHTokenAddress,
} from '@/constants'
import {
  BUSD_TOKEN,
  mainnetTokensAddressMap,
  USDT_TOKEN,
} from '@/constants/tokens'
import { TokenPoolType } from '@/store/tokens'
import {
  ChainId,
  Token,
  Fetcher,
  Trade,
  TokenAmount,
  JSBI,
} from '@pancakeswap/sdk'
import { Contract, providers, Signer, utils } from 'ethers'
import { isAddress, PollOptions } from 'ethers/lib/utils'
import { getPairs, isTradeBetter } from './trade'

/**
 * 轮训执行函数 若结果为 undefined 以外的值则会重新执行
 * @param func
 * @param options
 * @returns
 */
export function withPoll(
  func: () => Promise<boolean | undefined>,
  options?: PollOptions,
): Promise<boolean | undefined> {
  if (!options) {
    options = { interval: 1000 }
  }
  const wrappedFunc = () =>
    new Promise<boolean | undefined>(async (resolve, reject) => {
      try {
        const result = await func()

        if (result) {
          resolve(true)
        } else {
          // 结果为 falsy 值则 resolve undefined 使之继续执行
          resolve(undefined)
        }
      } catch (error) {
        resolve(undefined)
      }
    })

  return utils.poll(wrappedFunc, options)
}

export function promisePoll<T = any>(func: () => Promise<T>, wait = 1000) {
  let _timer: NodeJS.Timer | null | undefined = undefined
  let _wait = wait

  function _start() {
    if (_timer) {
      clearTimeout(_timer)
    }

    func
      .call(null)
      .then(() => {
        _timer = setTimeout(_start, _wait)
      })
      .catch(err => {
        console.error(err)
      })
  }

  return {
    stop: () => {
      clearTimeout(_timer as NodeJS.Timer)
      _timer = null
    },
    start: () => {
      _timer = undefined
      _start()
    },
    setWait: (wait: number) => {
      _wait = wait
    },
  }
}

/**
 * 获取合约
 * @param address
 * @param ABI
 * @param signerOrProvider
 * @returns
 */
export function getContract(
  address: string,
  ABI: any,
  signerOrProvider?: Signer | providers.Provider,
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, signerOrProvider)
}

/**
 * 根据池子类型获取代币合约地址 不存在则返回 BNB 类型
 * @param poolType
 * @returns
 */
export function getTokenAddressByPoolType(poolType: TokenPoolType) {
  switch (poolType) {
    case PoolType.BNB:
      return WETHTokenAddress
    case PoolType.BUSD:
      return BUSD_TOKEN.address
    case PoolType.USDT:
      return USDT_TOKEN.address

    default:
      return WETHTokenAddress
  }
}

/**
 * 获取交易对 token 信息
 * @param inputTokenAddress
 * @param outputTokenAddress
 * @param provider
 * @returns
 */
export async function fetchPairTokens(
  inputTokenAddress: string,
  outputTokenAddress: string,
  provider: providers.BaseProvider,
) {
  let inputToken: Token | undefined = mainnetTokensAddressMap[inputTokenAddress]
  let outputToken: Token | undefined =
    mainnetTokensAddressMap[outputTokenAddress]

  const fetchInputPromise = Fetcher.fetchTokenData(
    ChainId.MAINNET,
    inputTokenAddress,
    provider,
  )
  const fetchOutputPromise = Fetcher.fetchTokenData(
    ChainId.MAINNET,
    outputTokenAddress,
    provider,
  )

  if (!inputToken && !outputToken) {
    const datas = await Promise.all([fetchInputPromise, fetchOutputPromise])
    inputToken = datas[0]
    outputToken = datas[1]
  } else {
    if (!inputToken) {
      inputToken = await fetchInputPromise
    }

    if (!outputToken) {
      outputToken = await fetchOutputPromise
    }
  }

  return [inputToken, outputToken]
}

/**
 * 获取 token 价格
 * @param poolType
 * @param outputTokenAddress
 * @param provider
 * @returns
 */
export async function getTokenPrice(
  poolType: TokenPoolType,
  outputTokenAddress: string,
  provider: providers.BaseProvider,
) {
  const inputTokenAddress = getTokenAddressByPoolType(poolType)

  const [baseToken, targetToken] = await fetchPairTokens(
    inputTokenAddress,
    outputTokenAddress,
    provider,
  )

  const typedValueParsed = utils.parseUnits('1', baseToken.decimals).toString()
  const parsedAmount = new TokenAmount(baseToken, JSBI.BigInt(typedValueParsed))
  const allowedPairs = await getPairs(provider, baseToken, targetToken)

  // search through trades with varying hops, find best trade out of them
  let bestTradeSoFar: Trade | null = null
  if (poolType) {
    bestTradeSoFar =
      Trade.bestTradeExactIn(allowedPairs, parsedAmount, targetToken, {
        maxHops: 1,
        maxNumResults: 1,
      })[0] ?? null
  } else {
    for (let i = 1; i <= 3; i++) {
      const currentTrade: Trade | null =
        Trade.bestTradeExactIn(allowedPairs, parsedAmount, targetToken, {
          maxHops: i,
          maxNumResults: 1,
        })[0] ?? null
      // if current trade is best yet, save it
      if (
        isTradeBetter(
          bestTradeSoFar,
          currentTrade,
          BETTER_TRADE_LESS_HOPS_THRESHOLD,
        )
      ) {
        bestTradeSoFar = currentTrade
      }
    }
  }

  return Number(bestTradeSoFar?.executionPrice?.invert().toSignificant(6))
}

export async function getBlockNumber(provider: providers.BaseProvider) {
  try {
    const number = await provider.getBlockNumber()
    return number
  } catch (error) {
    return null
  }
}

/**
 * toFixed 后转为 number
 * @param number
 * @param fixCount
 * @returns
 */
export function toFixed(number: number, fixCount = 2) {
  return Number(number.toFixed(fixCount))
}

/**
 * 睡眠
 * @param timeout
 * @returns
 */
export function sleep(timeout: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

/**
 * timeout 毫秒后执行函数
 * @param fn
 * @param timeout
 * @returns
 */
export function execWithSleep<T = any>(fn: () => Promise<T>, timeout: number) {
  return new Promise<T>((resolve, reject) => {
    sleep(timeout).then(() => {
      try {
        fn()
          .then(r => resolve(r))
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * 将科学计数法数字转为完整的数字
 * @param num
 * @returns
 */
export function toNonExponential(num: number) {
  return num.toFixed(18).replace(/\.?0+$/, '')
}
