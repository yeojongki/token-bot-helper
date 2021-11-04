import { ChainId } from '@pancakeswap/sdk'
import { providers, Wallet } from 'ethers'
import { useUserStore } from '@/store/user'
import { defaultRpc } from '@/constants'
import { usePrivateKey } from './usePrivateKey'

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
    : new providers.StaticJsonRpcProvider(url)

  return provider
}

/**
 * 获取当前 provider
 * @param url
 * @returns
 */
export function useActiveProvider() {
  if (!provider) {
    setProvider(defaultRpc)
  }

  if (!wallet) {
    const privateKey = usePrivateKey()
    wallet = new Wallet(privateKey, provider!)
  }

  return {
    chainId: ChainId.MAINNET,
    account: wallet.address,
    provider: provider as providers.BaseProvider,
    wallet: wallet as Wallet,
  }
}
