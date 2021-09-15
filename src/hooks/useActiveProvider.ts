import { providers, Wallet } from 'ethers'
import { reactive, toRefs } from 'vue'

let provider: null | providers.BaseProvider = null
let wallet: null | Wallet = null

interface ActiveProvider {
  provider?: providers.BaseProvider
  wallet?: Wallet
}

const state = reactive<ActiveProvider>({})

/**
 * 设置 provider
 * @param url
 */
export function setProvider(url: string) {
  state.provider = url.startsWith('wss')
    ? new providers.WebSocketProvider(url)
    : new providers.JsonRpcProvider(url)
}

/**
 * 获取当前 provider
 * @param url
 * @returns
 */
export function useActiveProvider(url: string = import.meta.env.VITE_RPC_NODE) {
  if (!state.provider) {
    setProvider(url)
  }

  if (!state.wallet) {
    state.wallet = new Wallet(import.meta.env.VITE_PRIVATE_KEY, state.provider)
  }

  return {
    account: import.meta.env.VITE_WALLET_ADDRESS,
    provider: state.provider!,
    wallet: state.wallet!,
  }
}
