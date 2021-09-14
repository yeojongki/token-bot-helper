import { providers } from 'ethers'

let provider: null | providers.BaseProvider = null

/**
 * 获取当前 provider
 * @param url
 * @returns
 */
export function useActiveProvider(url: string = import.meta.env.VITE_RPC_NODE) {
  if (!provider) {
    provider = url.startsWith('wss')
      ? new providers.WebSocketProvider(url)
      : new providers.JsonRpcProvider(url)
  }
  return provider
}
