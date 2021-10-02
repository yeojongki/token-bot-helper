import {
  AddressZero,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  WETHTokenAddress,
} from '@/constants'
import {
  mainnetTokens,
  mainnetTokensAddressMap,
  USDT_TOKEN,
} from '@/constants/tokens'
import {
  ChainId,
  Token,
  Fetcher,
  Route,
  Trade,
  TokenAmount,
  TradeType,
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
 * 获取 token 价格
 * @param outputTokenAddress
 * @param inputTokenAddress
 * @param provider
 * @param ethPrice
 * @returns
 */
export async function getTokenPrice(
  outputTokenAddress: string,
  inputTokenAddress = WETHTokenAddress,
  provider: providers.BaseProvider,
  // ethPrice: number,
) {
  const targetToken: Token =
    mainnetTokensAddressMap[outputTokenAddress] ??
    (await Fetcher.fetchTokenData(
      ChainId.MAINNET,
      outputTokenAddress,
      provider,
    ))

  const baseToken: Token =
    mainnetTokensAddressMap[inputTokenAddress] ??
    (await Fetcher.fetchTokenData(ChainId.MAINNET, inputTokenAddress, provider))

  // const pair = await Fetcher.fetchPairData(targetToken, baseToken, provider)
  // const route = new Route([pair], WETH[ChainId.MAINNET])

  const typedValueParsed = utils.parseUnits('1', baseToken.decimals).toString()
  const parsedAmount = new TokenAmount(baseToken, JSBI.BigInt(typedValueParsed))

  const allowedPairs = await getPairs(provider, baseToken, targetToken)
  // const bestTradeExactIn = Trade.bestTradeExactIn(
  //   allowedPairs,
  //   parsedAmount,
  //   targetToken,
  //   { maxHops: 1, maxNumResults: 1 },
  // )[0]

  // search through trades with varying hops, find best trade out of them
  let bestTradeSoFar: Trade | null = null
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

  // if (outputTokenAddress === '0x96Af135d3ccc996aE8935EAB6acf1471ad7a06b2') {
  //   console.log(bestTradeSoFar)
  //   console.log(Number(bestTradeSoFar?.executionPrice.toSignificant(6)))
  // }

  return Number(bestTradeSoFar?.executionPrice.toSignificant(6))
  // const trade = new Trade(
  //   route,
  //   new TokenAmount(WETH[ChainId.MAINNET], '1000000000000000000'),
  //   TradeType.EXACT_INPUT,
  // )

  // outputTokenAddress === '0x96Af135d3ccc996aE8935EAB6acf1471ad7a06b2' &&
  //   console.log(111, trade.executionPrice.toSignificant(6))

  // const price = route.midPrice
  // const usdtMultiple = outputTokenAddress === WETHTokenAddress ? 1 : ethPrice
  // const invertOrNotPrice =
  //   outputTokenAddress === WETHTokenAddress
  //     ? price.toSignificant(6)
  //     : price.invert().toSignificant(6)

  // return Number(invertOrNotPrice) * usdtMultiple
}

export async function getBlockNumber(provider: providers.BaseProvider) {
  try {
    const number = await provider.getBlockNumber()
    return number
  } catch (error) {
    return null
  }
}
