import { AddressZero, WETHTokenAddress } from '@/constants'
import { WETH, ChainId, Token, Fetcher, Route } from '@pancakeswap/sdk'
import { Contract, providers, Signer, utils } from 'ethers'
import { isAddress, PollOptions } from 'ethers/lib/utils'

/**
 * 轮训执行函数 若结果为 undefined 以外的值则会重新执行
 * @param func
 * @param options
 * @returns
 */
export function withPoll(
  func: () => Promise<boolean | undefined>,
  options: PollOptions,
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
 * @param tokenAddress
 * @param baseTokenAddress
 * @param provider
 * @param ethPrice
 * @returns
 */
export async function getTokenPrice(
  tokenAddress: string,
  baseTokenAddress = WETHTokenAddress,
  provider: providers.BaseProvider,
  ethPrice: number,
) {
  const targetToken: Token =
    tokenAddress === WETHTokenAddress
      ? WETH[ChainId.MAINNET]
      : await Fetcher.fetchTokenData(ChainId.MAINNET, tokenAddress, provider)

  const baseToken: Token =
    baseTokenAddress === WETHTokenAddress
      ? WETH[ChainId.MAINNET]
      : await Fetcher.fetchTokenData(
          ChainId.MAINNET,
          baseTokenAddress,
          provider,
        )

  const pair = await Fetcher.fetchPairData(targetToken, baseToken, provider)
  const route = new Route([pair], WETH[ChainId.MAINNET])

  const price = route.midPrice
  const usdtMultiple = tokenAddress === WETHTokenAddress ? 1 : ethPrice
  const invertOrNotPrice =
    tokenAddress === WETHTokenAddress
      ? price.toSignificant(6)
      : price.invert().toSignificant(6)

  return Number(invertOrNotPrice) * usdtMultiple
}
