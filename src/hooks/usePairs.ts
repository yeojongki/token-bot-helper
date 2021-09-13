import { FACTORY_ADDRESS, INIT_CODE_HASH } from "@pancakeswap/sdk"
import { pack, keccak256 } from "@ethersproject/solidity";
import { getCreate2Address } from "@ethersproject/address";

/**
 * 获取交易对
 * @param token0 目标代币地址
 * @param token1 基础代币地址 如 WBNB, BUSD, USDT
 * @returns 
 */
export function usePair(token0:string, token1:string) {
  const pair = getCreate2Address(
    FACTORY_ADDRESS,
    keccak256(["bytes"], [pack(["address", "address"], [token0, token1])]),
    INIT_CODE_HASH
  );
  return pair
}
