import {
  ChainId,
  Currency,
  currencyEquals,
  Fetcher,
  Pair,
  Percent,
  Token,
  Trade,
} from '@pancakeswap/sdk'
import { flatMap } from 'lodash-es'
import { computed } from 'vue'
import { wrappedCurrency } from './wrappedCurrency'
import { BASES_TO_CHECK_TRADES_AGAINST } from '@/constants/tokens'
import { providers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { ZERO_PERCENT, ONE_HUNDRED_PERCENT } from '@/constants'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

const bases = BASES_TO_CHECK_TRADES_AGAINST[ChainId.MAINNET]

export async function fetchPairs(
  provider: providers.BaseProvider,
  tokens: [Token, Token][],
): Promise<Pair[]> {
  return Promise.all(
    tokens.map(
      (item) =>
        new Promise<any>((resolve) => {
          Fetcher.fetchPairData(item[0], item[1], provider)
            .then((pair) => resolve(pair))
            .catch(() => {
              resolve(null)
            })
        }),
    ),
  ).then((pairs: Pair[]) => {
    const reducePairs = pairs
      .filter(Boolean)
      .reduce<{ [pairAddress: string]: Pair }>((memo, curr) => {
        memo[curr.liquidityToken.address] =
          memo[curr.liquidityToken.address] ?? curr
        return memo
      }, {})

    return Object.values(reducePairs)
  })
}

export async function getPairs(
  provider: providers.BaseProvider,
  currencyA?: Currency,
  currencyB?: Currency,
) {
  const [tokenA, tokenB] = [
    wrappedCurrency(currencyA, ChainId.MAINNET),
    wrappedCurrency(currencyB, ChainId.MAINNET),
  ]

  const basePairs = flatMap(bases, (base): [Token, Token][] =>
    bases.map((otherBase) => [base, otherBase]),
  )

  const allPairCombinations =
    tokenA && tokenB
      ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base): [Token, Token] => [tokenA, base]),
          // token B against all bases
          ...bases.map((base): [Token, Token] => [tokenB, base]),
          // each base against all bases
          ...basePairs,
        ]
          .filter((tokens): tokens is [Token, Token] =>
            Boolean(tokens[0] && tokens[1]),
          )
          .filter(([t0, t1]) => t0.address !== t1.address)
      : []

  const res = await fetchPairs(provider, allPairCombinations)

  return res
}

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
export function isTradeBetter(
  tradeA: Trade | undefined | null,
  tradeB: Trade | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT,
): boolean | undefined {
  if (tradeA && !tradeB) return false
  if (tradeB && !tradeA) return true
  if (!tradeA || !tradeB) return undefined

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !currencyEquals(tradeB.outputAmount.currency, tradeB.outputAmount.currency)
  ) {
    throw new Error('Trades are not comparable')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  }
  return tradeA.executionPrice.raw
    .multiply(minimumDelta.add(ONE_HUNDRED_PERCENT))
    .lessThan(tradeB.executionPrice)
}
