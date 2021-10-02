import { ChainId, Token } from '@pancakeswap/sdk'
import { flatMap } from 'lodash-es'
export interface TokenInfo {
  address: string
  price?: number
  symbol?: string
  chainId?: number
  decimals?: number
  logoURI?: string
}

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

const { MAINNET } = ChainId

export const WBNB_TOKEN = {
  name: 'WBNB Token',
  symbol: 'WBNB',
  address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png',
}

export const BUSD_TOKEN = {
  name: 'BUSD Token',
  symbol: 'BUSD',
  address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0xe9e7cea3dedca5984780bafc599bd69add087d56.png',
}

export const USDT_TOKEN = {
  name: 'Tether USD',
  symbol: 'USDT',
  address: '0x55d398326f99059fF775485246999027B3197955',
  chainId: 56,
  decimals: 18,
  logoURI:
    'https://pancakeswap.finance/images/tokens/0x55d398326f99059ff775485246999027b3197955.png',
}

export const mainnetTokens = {
  wbnb: new Token(
    MAINNET,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB',
    'https://www.binance.com/',
  ),
  // bnb here points to the wbnb contract. Wherever the currency BNB is required, conditional checks for the symbol 'BNB' can be used
  bnb: new Token(
    MAINNET,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'BNB',
    'BNB',
    'https://www.binance.com/',
  ),
  busd: new Token(
    MAINNET,
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    18,
    'BUSD',
    'Binance USD',
    'https://www.paxos.com/busd/',
  ),
  usdt: new Token(
    MAINNET,
    '0x55d398326f99059fF775485246999027B3197955',
    18,
    'USDT',
    'Tether USD',
    'https://tether.to/',
  ),
}

export const mainnetTokensAddressMap = {
  [WBNB_TOKEN.address]: mainnetTokens.wbnb,
  [USDT_TOKEN.address]: mainnetTokens.usdt,
  [BUSD_TOKEN.address]: mainnetTokens.busd,
}

export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [
    mainnetTokens.wbnb,
    mainnetTokens.busd,
    mainnetTokens.usdt,
  ],
  [ChainId.TESTNET]: [],
}

export default {
  [WBNB_TOKEN.address]: WBNB_TOKEN,
  [BUSD_TOKEN.address]: BUSD_TOKEN,
  [USDT_TOKEN.address]: USDT_TOKEN,
}
