import { ChainId } from '@pancakeswap/sdk'
import { providers, Wallet } from 'ethers'

let provider: null | providers.BaseProvider = null
let wallet: null | Wallet = null

// interface ActiveProvider {
//   provider?: providers.BaseProvider
//   wallet?: Wallet
// }

// const state = reactive<ActiveProvider>({
//   provider: new providers.JsonRpcProvider(import.meta.env.VITE_RPC_NODE),
//   wallet: undefined,
// })

/**
 * 设置 provider
 * @param url
 */
export function setProvider(url: string) {
  provider = url.startsWith('wss')
    ? new providers.WebSocketProvider(url)
    : new providers.JsonRpcProvider(url)

  return provider
}

/**
 * 获取当前 provider
 * @param url
 * @returns
 */
export function useActiveProvider(url: string = import.meta.env.VITE_RPC_NODE) {
  if (!provider) {
    setProvider(url)
  }

  if (!wallet) {
    wallet = new Wallet(import.meta.env.VITE_PRIVATE_KEY, provider!)
  }

  return {
    chainId: ChainId.MAINNET,
    account: import.meta.env.VITE_WALLET_ADDRESS,
    provider: provider as providers.BaseProvider,
    wallet: wallet as Wallet,
  }
}
