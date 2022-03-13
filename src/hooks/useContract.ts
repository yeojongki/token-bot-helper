import ERC20_ABI from '@/constants/erc20'
import { useUserStore } from '@/store/user'
import { getContract } from '@/utils'
import { Contract } from 'ethers'
import { useActiveProvider } from './useActiveProvider'

/**
 * 获取合约, 失败则返回 null
 * @param address
 * @param ABI
 * @param withSignerIfPossible
 * @returns
 */
function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
): Contract | null {
  // const userStore = useUserStore()

  const { provider, wallet } = useActiveProvider()
  if (
    !address ||
    !ABI ||
    !provider ||
    !wallet
    // !userStore.activeProvider.provider ||
    // !userStore.activeProvider.wallet
  )
    return null
  try {
    return getContract(address, ABI, withSignerIfPossible ? wallet : provider)
  } catch (error) {
    console.error('Failed to get contract', error)
    return null
  }
}

/**
 * 获取 token 合约
 * @param tokenAddress
 * @param withSignerIfPossible
 * @returns
 */
export function useTokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean,
): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}
